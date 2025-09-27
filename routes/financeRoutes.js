// routes/financeRoutes.js
import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import {
  listTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
} from "../controllers/financeController.js";

const router = Router();

/* --------- Order matters: static before dynamic --------- */
router.get("/transactions", listTransactions);
router.get("/summary", getSummary);
router.get("/transactions/:id", getTransactionById);

/* --------- Protected mutations --------- */
router.post("/transactions", verifyJWT, createTransaction);
router.put("/transactions/:id", verifyJWT, updateTransaction);
router.delete("/transactions/:id", verifyJWT, deleteTransaction);

export default router;
