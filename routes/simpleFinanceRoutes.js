// routes/simpleFinanceRoutes.js
import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import {
  listTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBookingIncomes,
  getInventoryExpenses,
} from "../controllers/simpleFinanceController.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Basic CRUD operations
router.get("/transactions", listTransactions);
router.get("/summary", getSummary);
router.post("/transactions", createTransaction);
router.put("/transactions/:id", updateTransaction);
router.delete("/transactions/:id", deleteTransaction);

// Data source routes
router.get("/bookings", getBookingIncomes);
router.get("/inventory-expenses", getInventoryExpenses);

export default router;
