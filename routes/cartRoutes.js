// routes/cartRoutes.js
import express, { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import {
  getMyCart, addItem, updateItem, removeItem, clearCart,
  checkout, handleStripeWebhook,
} from "../controllers/cartController.js";

const router = Router();

// user cart (auth)
router.get("/", verifyJWT, getMyCart);
router.post("/items", verifyJWT, addItem);
router.patch("/items/:itemId", verifyJWT, updateItem);
router.delete("/items/:itemId", verifyJWT, removeItem);
router.delete("/", verifyJWT, clearCart);

// checkout (auth)
router.post("/checkout", verifyJWT, checkout);

// Stripe webhook (NO auth; needs RAW body; must be BEFORE any JSON parser on this route)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    // keep raw buffer accessible for Stripe signature verification
    req.rawBody = req.body;
    return handleStripeWebhook(req, res);
  }
);

export default router;
