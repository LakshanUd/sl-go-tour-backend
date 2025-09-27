// controllers/financeController.js
import mongoose from "mongoose";
import FinanceTransaction from "../models/FinanceTransaction.js";
import Booking from "../models/Booking.js";
import User from "../models/UserModel.js";

const { isValidObjectId } = mongoose;

/* ------------------------ helpers ------------------------ */
function pickServiceTypes(booking) {
  if (!booking?.items?.length) return [];
  return [...new Set(booking.items.map(i => i.serviceType).filter(Boolean))];
}

async function findBookingByAnyId(idLike) {
  if (!idLike) return null;
  // try business id (bookingID) first, then _id
  return (
    (await Booking.findOne({ bookingID: idLike })) ||
    (isValidObjectId(idLike) ? await Booking.findById(idLike) : null)
  );
}

async function currentUserDoc(req) {
  if (!req?.user?.email) return null;
  return User.findOne({ email: req.user.email }).lean();
}

/* =========================================================
   ROUTE HANDLERS (match routes/financeRoutes.js)
   ========================================================= */

/**
 * GET /api/finance/transactions
 * Admin: all transactions
 * Others: only their own (by customer id)
 */
export async function listTransactions(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    let filter = {};
    if (req.user.role !== "Admin") {
      const me = await currentUserDoc(req);
      if (!me) return res.status(403).json({ message: "Account not found for current user" });
      filter.customer = me._id;
    }

    const txs = await FinanceTransaction.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(txs);
  } catch (error) {
    console.error("[listTransactions]", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/finance/transactions/:id
 * id can be either:
 *  - Mongo ObjectId of the transaction
 *  - a referenceID string (if you use one)
 */
export async function getTransactionById(req, res) {
  try {
    const { id } = req.params;

    // Try by referenceID first
    let tx = await FinanceTransaction.findOne({ referenceID: id });

    // If not found and id looks like an ObjectId, try by _id
    if (!tx && isValidObjectId(id)) {
      tx = await FinanceTransaction.findById(id);
    }

    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // Authorization: Admin sees all; others only their own
    if (!req.user) return res.status(403).json({ message: "You need to login first" });
    if (req.user.role !== "Admin" && tx.customer) {
      const me = await currentUserDoc(req);
      if (!me || String(tx.customer) !== String(me._id)) {
        return res.status(403).json({ message: "Unauthorized to view this transaction" });
      }
    }

    return res.status(200).json(tx);
  } catch (error) {
    console.error("[getTransactionById]", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/finance/transactions
 * Generic creator that supports:
 *  - type = invoice | payment | refund
 *  - bookingId (bookingID/_id) required for all
 * Permissions:
 *  - invoice: Admin/Staff
 *  - refund:  Admin/Staff
 *  - payment: Customer for own booking, Staff/Admin for any
 */
export async function createTransaction(req, res) {
  try {
    if (!req.user) return res.status(403).json({ message: "You need to login first" });

    const {
      type,                 // 'invoice' | 'payment' | 'refund'
      bookingId, bookingID, _id, // any id for booking
      subtotal, discount, tax, fees, total, currency,
      amount,               // for payments/refunds (alias for total)
      method, gateway, externalRef, memo,
    } = req.body || {};

    const bid = bookingId || bookingID || _id;
    if (!bid) return res.status(400).json({ message: "bookingId is required" });

    const booking = await findBookingByAnyId(bid);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Permission checks by type
    if (type === "invoice" || type === "refund") {
      if (!["Admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Unauthorized action" });
      }
    }
    if (type === "payment" && req.user.role !== "Admin" && req.user.role) {
      // Customers can only pay for their own booking
      const me = await currentUserDoc(req);
      if (!me || String(booking.customer) !== String(me._id)) {
        return res.status(403).json({ message: "You cannot pay for this booking" });
      }
    }

    // Common fields
    const txDoc = {
      booking: booking._id,
      customer: booking.customer,
      serviceTypes: pickServiceTypes(booking),
      currency: currency || booking.currency || "USD",
      memo: memo || undefined,
    };

    let tx = null;

    if (type === "invoice") {
      tx = await FinanceTransaction.create({
        ...txDoc,
        type: "invoice",
        status: "open",
        subtotal: Number(subtotal ?? booking.itemsSubtotal),
        discount: Number(discount ?? booking.discount) || 0,
        tax: Number(tax ?? booking.tax) || 0,
        fees: Number(fees ?? booking.fees) || 0,
        total: Number(total ?? booking.grandTotal),
      });
    } else if (type === "payment") {
      const amt = Number(amount ?? total);
      if (!amt || amt <= 0) return res.status(400).json({ message: "Invalid amount" });

      tx = await FinanceTransaction.create({
        ...txDoc,
        type: "payment",
        status: "paid",
        subtotal: amt,
        discount: 0,
        tax: 0,
        fees: 0,
        total: amt,
        method: method || "other",
        gateway,
        externalRef,
        paidAt: new Date(),
        memo: txDoc.memo || "Payment received",
      });
    } else if (type === "refund") {
      const amt = Number(amount ?? total);
      if (!amt || amt <= 0) return res.status(400).json({ message: "Invalid amount" });

      tx = await FinanceTransaction.create({
        ...txDoc,
        type: "refund",
        status: "refunded",
        subtotal: amt,
        discount: 0,
        tax: 0,
        fees: 0,
        total: amt,
        method: method || "other",
        gateway,
        externalRef,
        refundedAt: new Date(),
        memo: txDoc.memo || "Refund issued",
      });
    } else {
      return res.status(400).json({ message: "Invalid type. Use invoice|payment|refund" });
    }

    // Keep booking paymentStatus in sync (simple recalculation)
    const paidAgg = await FinanceTransaction.aggregate([
      { $match: { booking: booking._id, type: "payment", status: { $in: ["paid", "partial"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const refundAgg = await FinanceTransaction.aggregate([
      { $match: { booking: booking._id, type: "refund", status: "refunded" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const paid = paidAgg.length ? paidAgg[0].total : 0;
    const refunded = refundAgg.length ? refundAgg[0].total : 0;
    const net = paid - refunded;

    booking.paymentStatus =
      net <= 0 ? "refunded" : net >= booking.grandTotal ? "paid" : net > 0 ? "partial" : "unpaid";
    if (booking.paymentStatus === "paid" && booking.status === "pending") {
      booking.status = "confirmed";
    }
    await booking.save();

    return res.status(201).json({ message: "Transaction created", transaction: tx, booking });
  } catch (error) {
    console.error("[createTransaction]", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PUT /api/finance/transactions/:id
 * Admin/Staff only. Update limited fields (status/memo/method/gateway/externalRef)
 */
export async function updateTransaction(req, res) {
  try {
    if (!req.user) return res.status(403).json({ message: "You need to login first" });
    if (!["Admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid transaction id" });

    const allowed = ["status", "memo", "method", "gateway", "externalRef"];
    const patch = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }

    const tx = await FinanceTransaction.findByIdAndUpdate(id, patch, { new: true });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    return res.status(200).json({ message: "Transaction updated", transaction: tx });
  } catch (error) {
    console.error("[updateTransaction]", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/finance/transactions/:id
 * Admin only
 */
export async function deleteTransaction(req, res) {
  try {
    if (!req.user) return res.status(403).json({ message: "You need to login first" });
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid transaction id" });

    const tx = await FinanceTransaction.findByIdAndDelete(id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    return res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("[deleteTransaction]", error);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * GET /api/finance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Optional filters: type=invoice|payment|refund, serviceType=vehicle|accommodation|meal|tourpackage
 */
export async function getSummary(req, res) {
  try {
    if (!req.user) return res.status(403).json({ message: "You need to login first" });
    // Admin: all, Others: their own
    const match = {};

    // date window
    const { from, to, type, serviceType } = req.query || {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }
    if (type) match.type = type;
    if (serviceType) match.serviceTypes = serviceType;

    if (req.user.role !== "Admin") {
      const me = await currentUserDoc(req);
      if (!me) return res.status(403).json({ message: "Account not found for current user" });
      match.customer = me._id;
    }

    const agg = await FinanceTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { type: "$type" },
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
        },
      },
      { $project: { _id: 0, type: "$_id.type", count: 1, totalAmount: 1 } },
    ]);

    // Also provide grand totals
    const totals = agg.reduce(
      (acc, cur) => {
        acc.count += cur.count;
        acc.totalAmount += cur.totalAmount;
        return acc;
      },
      { count: 0, totalAmount: 0 }
    );

    return res.status(200).json({ byType: agg, totals });
  } catch (error) {
    console.error("[getSummary]", error);
    return res.status(500).json({ message: "Server error" });
  }
}
