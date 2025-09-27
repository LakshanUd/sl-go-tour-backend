// controllers/bookingController.js
import Booking from "../models/Booking.js";
import User from "../models/UserModel.js";

/* ------------------------ helpers ------------------------ */
function computeLineTotal(it) {
  const qty = Number(it.qty ?? 1);
  const unit = Number(it.unitPrice ?? 0);
  const discount = Number(it.discount ?? 0);
  const tax = Number(it.tax ?? 0);
  const fees = Number(it.fees ?? 0);
  const base = Math.max(0, unit * qty);
  return Math.max(0, base - discount + tax + fees);
}

function computeBookingTotals(items, bookingLevel = {}) {
  const itemsSubtotal = items.reduce((sum, it) => sum + Math.max(0, (it.unitPrice ?? 0) * (it.qty ?? 1)), 0);
  const discount = Number(bookingLevel.discount ?? 0);
  const tax = Number(bookingLevel.tax ?? 0);
  const fees = Number(bookingLevel.fees ?? 0);
  const grandTotal = Math.max(0, itemsSubtotal - discount + tax + fees);
  return { itemsSubtotal, discount, tax, fees, grandTotal };
}

function deriveWindow(items) {
  const starts = items.map(i => i.startDate).filter(Boolean).map(d => new Date(d).getTime());
  const ends   = items.map(i => i.endDate).filter(Boolean).map(d => new Date(d).getTime());
  return {
    startDate: starts.length ? new Date(Math.min(...starts)) : undefined,
    endDate:   ends.length   ? new Date(Math.max(...ends))   : undefined,
  };
}

function ensureLineIntegrity(item) {
  const validTypes = ["Accommodation", "Meal", "TourPackage", "Vehicle"];
  if (!validTypes.includes(item.serviceType)) {
    throw new Error("Invalid serviceType on item");
  }
  // Make sure the right reference exists
  if (item.serviceType === "Accommodation" && !item.accommodation) throw new Error("Accommodation ref missing");
  if (item.serviceType === "Meal"          && !item.meal)          throw new Error("Meal ref missing");
  if (item.serviceType === "TourPackage"   && !item.tourPackage)   throw new Error("TourPackage ref missing");
  if (item.serviceType === "Vehicle"       && !item.vehicle)       throw new Error("Vehicle ref missing");

  // qty defaults for meals/tickets
  if (item.serviceType === "Meal" && (item.qty ?? 0) <= 0) {
    item.qty = 1;
  }
  // compute lineTotal if not provided
  item.lineTotal = Number(item.lineTotal ?? computeLineTotal(item));
}

/* ------------------------ CRUD ------------------------ */

// CREATE (Customer/Staff/Admin) — associates booking to current user
export async function createBooking(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    // find user _id (your JWT doesn't carry _id, so we lookup by email)
    const user = await User.findOne({ email: req.user.email }).lean();
    if (!user) {
      return res.status(403).json({ message: "Account not found for current user" });
    }

    const data = req.body || {};
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      return res.status(400).json({ message: "Booking must contain at least one item" });
    }

    // validate/normalize each item
    items.forEach(ensureLineIntegrity);

    // compute totals and date window
    const totals = computeBookingTotals(items, {
      discount: data.discount,
      tax: data.tax,
      fees: data.fees,
    });
    const { startDate, endDate } = deriveWindow(items);

    const booking = new Booking({
      customer: user._id,
      channel: data.channel || "web",
      items,
      ...totals,
      currency: data.currency || "USD",
      guests: data.guests || { adults: 1, children: 0 },
      status: data.status || "pending",
      paymentStatus: data.paymentStatus || "unpaid",
      notes: data.notes || "",
      startDate,
      endDate,
    });

    await booking.save();
    return res.status(201).json({ message: "Booking created successfully", booking });
  } catch (error) {
    console.error("[createBooking]", error);
    return res.status(400).json({ message: error.message });
  }
}

// READ ALL
// Admin: all; Non-admin: only own
export async function getBookings(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }
    let filter = {};
    if (req.user.role !== "Admin") {
      // match user by email -> _id
      const user = await User.findOne({ email: req.user.email }).lean();
      if (!user) return res.status(403).json({ message: "Account not found for current user" });
      filter.customer = user._id;
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("[getBookings]", error);
    return res.status(400).json({ message: error.message });
  }
}

// READ ONE by bookingID or _id (supports both)
export async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    let booking =
      (await Booking.findOne({ bookingID: id })) ||
      (await Booking.findById(id));
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    if (req.user.role !== "Admin") {
      const user = await User.findOne({ email: req.user.email }).lean();
      if (!user || String(booking.customer) !== String(user._id)) {
        return res.status(403).json({ message: "Unauthorized to view this booking" });
      }
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error("[getBookingById]", error);
    return res.status(400).json({ message: error.message });
  }
}

// UPDATE (Admin always; customer can modify ONLY while pending)
export async function updateBooking(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    const { id } = req.params;
    let booking =
      (await Booking.findOne({ bookingID: id })) ||
      (await Booking.findById(id));
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isAdmin = req.user.role === "Admin";
    if (!isAdmin) {
      const user = await User.findOne({ email: req.user.email }).lean();
      const isOwner = user && String(booking.customer) === String(user._id);
      if (!isOwner || booking.status !== "pending") {
        return res.status(403).json({ message: "You cannot modify this booking" });
      }
    }

    const patch = req.body || {};
    // If items change or pricing changes, recompute totals/window
    if (Array.isArray(patch.items) && patch.items.length) {
      patch.items.forEach(ensureLineIntegrity);
      const totals = computeBookingTotals(patch.items, patch);
      Object.assign(patch, totals, deriveWindow(patch.items));
    }

    const updated = await Booking.findByIdAndUpdate(booking._id, patch, { new: true, runValidators: true });
    return res.status(200).json({ message: "Booking updated", booking: updated });
  } catch (error) {
    console.error("[updateBooking]", error);
    return res.status(400).json({ message: error.message });
  }
}

// CANCEL (Customer own booking if pending/confirmed; Admin always)
export async function cancelBooking(req, res) {
  try {
    if (!req.user) return res.status(403).json({ message: "You need to login first" });

    const { id } = req.params;
    let booking =
      (await Booking.findOne({ bookingID: id })) ||
      (await Booking.findById(id));
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isAdmin = req.user.role === "Admin";
    let isOwner = false;
    if (!isAdmin) {
      const user = await User.findOne({ email: req.user.email }).lean();
      isOwner = user && String(booking.customer) === String(user._id);
    }
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You cannot cancel this booking" });
    }

    if (!["pending", "confirmed"].includes(booking.status) && !isAdmin) {
      return res.status(400).json({ message: "Booking cannot be cancelled in its current status" });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    return res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    console.error("[cancelBooking]", error);
    return res.status(400).json({ message: error.message });
  }
}

// DELETE (Admin only) — hard delete (usually avoid; prefer cancel)
export async function deleteBooking(req, res) {
  try {
    if (!req.user) return res.status(403).json({ message: "You need to login first" });
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "You cannot delete bookings" });
    }

    const { id } = req.params;
    const deleted =
      (await Booking.findOneAndDelete({ bookingID: id })) ||
      (await Booking.findByIdAndDelete(id));

    if (!deleted) return res.status(404).json({ message: "Booking not found" });
    return res.status(200).json({ message: "Booking deleted" });
  } catch (error) {
    console.error("[deleteBooking]", error);
    return res.status(400).json({ message: error.message });
  }
}
