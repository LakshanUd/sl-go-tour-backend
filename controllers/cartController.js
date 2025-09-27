// controllers/cartController.js
import mongoose from "mongoose";
import Stripe from "stripe";
import Cart from "../models/Cart.js";
import User from "../models/UserModel.js";
import Booking from "../models/Booking.js";
import Vehicle from "../models/vehicleModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ------------ helpers ------------ */
function requireUser(req, res) {
  if (!req.user) {
    res.status(403).json({ message: "You need to login first" });
    return null;
  }
  return req.user;
}

async function currentUserDoc(req) {
  if (!req?.user?.email) return null;
  return User.findOne({ email: req.user.email }).lean();
}

async function getOrCreateCart(customerId) {
  let cart = await Cart.findOne({ customer: customerId });
  if (!cart) {
    cart = await Cart.create({ customer: customerId, items: [] });
  }
  return cart;
}

function toStripeAmount(n) {
  // Stripe needs integer minor units for non-zero-decimal currencies.
  return Math.round(Number(n || 0) * 100);
}

/** GET /api/cart (mine) */
export async function getMyCart(req, res) {
  try {
    const u = requireUser(req, res); if (!u) return;
    const me = await currentUserDoc(req);
    if (!me) return res.status(403).json({ message: "Account not found" });

    const cart = await getOrCreateCart(me._id);
    return res.status(200).json(cart);
  } catch (e) {
    console.error("[getMyCart]", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** POST /api/cart/items */
export async function addItem(req, res) {
  try {
    const u = requireUser(req, res); if (!u) return;
    const me = await currentUserDoc(req);
    if (!me) return res.status(403).json({ message: "Account not found" });

    const {
      serviceType, refId,
      name, image, code,
      unitPrice, currency = "LKR",
      qty = 1,
      startDate, endDate, notes,
    } = req.body || {};

    if (!serviceType || !refId || !name || unitPrice == null)
      return res.status(400).json({ message: "serviceType, refId, name, unitPrice required" });

    const cart = await getOrCreateCart(me._id);

    const matchIdx = cart.items.findIndex((it) => {
      const sameType = it.serviceType === serviceType;
      const sameRef =
        (serviceType === "Accommodation" && String(it.accommodation) === String(refId)) ||
        (serviceType === "Meal"          && String(it.meal) === String(refId)) ||
        (serviceType === "TourPackage"   && String(it.tourPackage) === String(refId)) ||
        (serviceType === "Vehicle"       && String(it.vehicle) === String(refId));
      const sameDates =
        String(it.startDate || "") === String(startDate || "") &&
        String(it.endDate || "")   === String(endDate || "");
      return sameType && sameRef && sameDates && it.unitPrice === Number(unitPrice);
    });

    if (matchIdx >= 0) {
      cart.items[matchIdx].qty += Number(qty || 1);
    } else {
      cart.items.push({
        serviceType,
        accommodation: serviceType === "Accommodation" ? refId : undefined,
        meal:          serviceType === "Meal" ? refId : undefined,
        tourPackage:   serviceType === "TourPackage" ? refId : undefined,
        vehicle:       serviceType === "Vehicle" ? refId : undefined,
        name, image, code,
        currency, unitPrice: Number(unitPrice), qty: Number(qty || 1),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate:   endDate ? new Date(endDate) : undefined,
        notes,
      });
    }

    cart.recalc();
    await cart.save();
    return res.status(201).json({ message: "Added to cart", cart });
  } catch (e) {
    console.error("[addItem]", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** PATCH /api/cart/items/:itemId (qty, notes, dates) */
export async function updateItem(req, res) {
  try {
    const u = requireUser(req, res); if (!u) return;
    const me = await currentUserDoc(req);
    if (!me) return res.status(403).json({ message: "Account not found" });

    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid cart item id" });
    }

    const { qty, notes, startDate, endDate } = req.body || {};
    const cart = await getOrCreateCart(me._id);
    const it = cart.items.id(itemId);
    if (!it) return res.status(404).json({ message: "Item not found" });

    if (qty != null) it.qty = Math.max(1, Number(qty));
    if (notes !== undefined) it.notes = notes;
    if (startDate !== undefined) it.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined)   it.endDate   = endDate ? new Date(endDate) : undefined;

    cart.recalc();
    await cart.save();
    return res.status(200).json({ message: "Item updated", cart });
  } catch (e) {
    console.error("[updateItem]", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** DELETE /api/cart/items/:itemId */
export async function removeItem(req, res) {
  try {
    const u = requireUser(req, res); if (!u) return;
    const me = await currentUserDoc(req);
    if (!me) return res.status(403).json({ message: "Account not found" });

    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid cart item id" });
    }

    const cart = await getOrCreateCart(me._id);
    const it = cart.items.id(itemId);
    if (!it) return res.status(404).json({ message: "Item not found" });

    it.deleteOne();
    cart.recalc();
    await cart.save();
    return res.status(200).json({ message: "Item removed", cart });
  } catch (e) {
    console.error("[removeItem]", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/** DELETE /api/cart  (clear) */
export async function clearCart(req, res) {
  try {
    const u = requireUser(req, res); if (!u) return;
    const me = await currentUserDoc(req);
    if (!me) return res.status(403).json({ message: "Account not found" });

    const cart = await getOrCreateCart(me._id);
    cart.items = [];
    cart.recalc();
    await cart.save();
    return res.status(200).json({ message: "Cart cleared", cart });
  } catch (e) {
    console.error("[clearCart]", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/cart/checkout
 * Creates a DRAFT booking + Stripe Checkout Session (do NOT clear cart now).
 * Vehicle status is flipped in webhook after successful payment.
 */
export async function checkout(req, res) {
  try {
    const u = requireUser(req, res); if (!u) return;
    const me = await currentUserDoc(req);
    if (!me) return res.status(403).json({ message: "Account not found" });

    const cart = await getOrCreateCart(me._id);
    if (cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const items = cart.items.map((it) => ({
      serviceType: it.serviceType,
      accommodation: it.accommodation,
      meal: it.meal,
      tourPackage: it.tourPackage,
      vehicle: it.vehicle,
      name: it.name,
      code: it.code,
      image: it.image,
      startDate: it.startDate,
      endDate: it.endDate,
      qty: it.qty,
      pax: 1,
      notes: it.notes,
      currency: it.currency,
      unitPrice: it.unitPrice,
      discount: 0,
      tax: 0,
      fees: 0,
      lineTotal: it.unitPrice * it.qty,
    }));

    const itemsSubtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const discount = 0, tax = 0, fees = 0;
    const grandTotal = itemsSubtotal - discount + tax + fees;

    const starts = items.map(i => i.startDate).filter(Boolean).map(d => new Date(d).getTime());
    const ends   = items.map(i => i.endDate).filter(Boolean).map(d => new Date(d).getTime());
    const startDate = starts.length ? new Date(Math.min(...starts)) : undefined;
    const endDate   = ends.length ? new Date(Math.max(...ends)) : undefined;

    // Create draft booking (unpaid)
    const booking = await Booking.create({
      customer: me._id,
      channel: "web",
      items,
      currency: "LKR",
      itemsSubtotal, discount, tax, fees, grandTotal,
      status: "pending",
      paymentStatus: "unpaid",
      startDate, endDate,
      guests: { adults: 1, children: 0 },
      notes: "Created from cart (draft until payment)",
    });

    // Stripe Checkout session
    const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";
    const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || "usd"; // set to "lkr" if supported

    const line_items = cart.items.map((it) => ({
      price_data: {
        currency: STRIPE_CURRENCY,
        product_data: {
          name: it.name,
          images: it.image ? [it.image] : [],
        },
        unit_amount: toStripeAmount(it.unitPrice),
      },
      quantity: it.qty || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cart`,
      metadata: {
        bookingId: String(booking._id),
        userId: String(me._id),
      },
    });

    return res.status(201).json({
      message: "Draft booking created. Redirect to Stripe.",
      bookingId: booking._id,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (e) {
    console.error("[checkout]", e);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * STRIPE WEBHOOK (no auth, raw body)
 * - mark booking paid + confirmed
 * - flip booked vehicles to inactive
 * - clear user's cart
 */
export async function handleStripeWebhook(req, res) {
  try {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    // IMPORTANT: req.rawBody must be the raw buffer (set in server)
    try {
      event = Stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error("[webhook] signature verify failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      const userId = session.metadata?.userId;

      if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
        const booking = await Booking.findById(bookingId);
        if (booking && String(booking.customer) === String(userId)) {
          booking.paymentStatus = "paid";
          booking.status = "confirmed";
          await booking.save();

          const vehicleIds = booking.items
            .filter((it) => it.serviceType === "Vehicle" && it.vehicle)
            .map((it) => it.vehicle);

          if (vehicleIds.length) {
            await Vehicle.updateMany(
              { _id: { $in: vehicleIds } },
              { $set: { status: "inactive" } }
            );
          }

          const cart = await Cart.findOne({ customer: userId });
          if (cart) {
            cart.items = [];
            cart.recalc();
            await cart.save();
          }
        }
      }
    }

    res.json({ received: true });
  } catch (e) {
    console.error("[handleStripeWebhook]", e);
    res.status(500).json({ message: "Server error" });
  }
}
