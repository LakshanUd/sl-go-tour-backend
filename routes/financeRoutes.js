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

/* --------- Protected reads --------- */
router.get("/transactions", verifyJWT, listTransactions);
router.get("/summary", verifyJWT, getSummary);
router.get("/transactions/:id", verifyJWT, getTransactionById);

/* --------- Protected mutations --------- */
router.post("/transactions", verifyJWT, createTransaction);
router.put("/transactions/:id", verifyJWT, updateTransaction);
router.delete("/transactions/:id", verifyJWT, deleteTransaction);

export default router;
