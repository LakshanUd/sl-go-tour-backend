import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import Stripe from "stripe";
import Cart from "../models/Cart.js";
import User from "../models/UserModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = Router();

/** POST /api/pay/checkout
 * Creates a Stripe Checkout Session from the logged-in user's cart.
 * Returns { url } to redirect the browser to Stripe.
 */
router.post("/checkout", verifyJWT, async (req, res) => {
  try {
    // find current user
    const me = await User.findOne({ email: req.user.email }).lean();
    if (!me) return res.status(403).json({ message: "Account not found" });

    // load cart
    const cart = await Cart.findOne({ customer: me._id });
    const items = cart?.items || [];
    if (items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Build Stripe line items (amounts in cents)
    // Using USD for demo; change to 'lkr' if your Stripe supports it
    const currency = "usd";
    const line_items = items.map((it) => ({
      price_data: {
        currency,
        product_data: {
          name: it.name,
          description: `${it.serviceType}${it.code ? " • " + it.code : ""}`,
          images: it.image ? [it.image] : undefined,
        },
        unit_amount: Math.max(0, Math.round(Number(it.unitPrice) * 100 / 300)), 
        // NOTE: Demo conversion: LKR→USD ≈ /300. Replace with your real conversion if you want.
      },
      quantity: Math.max(1, Number(it.qty || 1)),
    }));

    const successUrl = `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.APP_URL}/payment/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("[pay/checkout]", e);
    return res.status(500).json({ message: "Failed to create checkout session" });
  }
});

/** POST /api/pay/finalize
 * Frontend hits this on the success page with ?session_id=...
 * - Verifies Stripe says it's paid
 * - If paid → create Booking + clear cart (re-using your cartController.checkout logic)
 */
router.post("/finalize", verifyJWT, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ message: "Missing session_id" });

    const me = await User.findOne({ email: req.user.email }).lean();
    if (!me) return res.status(403).json({ message: "Account not found" });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Re-use your existing booking creation from cart
    // Simplest: import your checkout() logic and call that here—or inline a minimal copy.
    // Here we'll call your existing controller method programmatically for clarity:

    // Minimal inline version using your Booking model:
    const CartModel = (await import("../models/Cart.js")).default;
    const Booking = (await import("../models/Booking.js")).default;

    const cart = await CartModel.findOne({ customer: me._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart empty after payment" });
    }

    // convert items → booking lines (same as your controller)
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

    const booking = await Booking.create({
      customer: me._id,
      channel: "web",
      items,
      currency: "LKR",
      itemsSubtotal, discount, tax, fees, grandTotal,
      status: "confirmed",       // paid → confirmed
      paymentStatus: "paid",
      startDate, endDate,
      guests: { adults: 1, children: 0 },
      notes: `Stripe session ${session_id}`,
    });

    // clear cart
    cart.items = [];
    cart.recalc();
    await cart.save();

    return res.status(201).json({ message: "Payment verified. Booking created.", booking });
  } catch (e) {
    console.error("[pay/finalize]", e);
    return res.status(500).json({ message: "Failed to finalize payment" });
  }
});

export default router;
