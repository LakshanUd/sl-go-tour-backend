// controllers/simpleFinanceController.js
import SimpleFinance from "../models/SimpleFinance.js";
import Booking from "../models/Booking.js";
import Inventory from "../models/InventoryModel.js";

// GET /api/simple-finance/transactions
export async function listTransactions(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    // Only Admin can access all transactions
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can access financial data" });
    }

    const transactions = await SimpleFinance.find()
      .populate('booking', 'bookingID customer items grandTotal')
      .populate('inventory', 'inventoryID name category quantity unitCost')
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
  }
}

// GET /api/simple-finance/summary
export async function getSummary(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can access financial data" });
    }

    const transactions = await SimpleFinance.find();
    
    const summary = {
      totalTransactions: transactions.length,
      totalIncome: transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
      incomeCount: transactions.filter(t => t.type === "income").length,
      expenseCount: transactions.filter(t => t.type === "expense").length,
    };

    summary.netProfit = summary.totalIncome - summary.totalExpense;

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch summary", error: error.message });
  }
}

// POST /api/simple-finance/transactions
export async function createTransaction(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can create transactions" });
    }

    const transaction = new SimpleFinance(req.body);
    await transaction.save();

    res.status(201).json({ message: "Transaction created successfully", transaction });
  } catch (error) {
    res.status(400).json({ message: "Failed to create transaction", error: error.message });
  }
}

// PUT /api/simple-finance/transactions/:id
export async function updateTransaction(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can update transactions" });
    }

    const transaction = await SimpleFinance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    res.status(400).json({ message: "Failed to update transaction", error: error.message });
  }
}

// DELETE /api/simple-finance/transactions/:id
export async function deleteTransaction(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can delete transactions" });
    }

    const transaction = await SimpleFinance.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete transaction", error: error.message });
  }
}

// GET /api/simple-finance/bookings (for income data)
export async function getBookingIncomes(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can access financial data" });
    }

    // Get all bookings and convert them to income transactions
    const bookings = await Booking.find({ status: { $in: ["confirmed", "completed"] } })
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const incomeTransactions = bookings.map(booking => ({
      _id: `booking_${booking._id}`,
      bookingID: booking.bookingID,
      booking: booking._id,
      date: booking.createdAt,
      type: "income",
      category: "Tour Package", // Default category, can be derived from booking items
      method: "online", // Default method
      amount: booking.grandTotal || 0,
      currency: "LKR",
      reference: booking.bookingID,
      notes: `Booking from ${booking.customer?.firstName} ${booking.customer?.lastName}`,
      txnId: `BK-${booking.bookingID}`,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      isFromBooking: true, // Flag to identify this is from booking data
    }));

    res.status(200).json(incomeTransactions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch booking incomes", error: error.message });
  }
}

// GET /api/simple-finance/inventory-expenses (for expense data)
export async function getInventoryExpenses(req, res) {
  try {
    if (!req.user) {
      return res.status(403).json({ message: "You need to login first" });
    }

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can access financial data" });
    }

    // Get all inventory items and convert them to expense transactions
    const inventoryItems = await Inventory.find({ type: "RECEIVE" })
      .sort({ createdAt: -1 });

    const expenseTransactions = inventoryItems.map(item => ({
      _id: `inventory_${item._id}`,
      inventoryID: item.inventoryID,
      inventory: item._id,
      date: item.purchaseDate || item.createdAt,
      type: "expense",
      category: item.category || "Misc",
      method: "cash", // Default method
      amount: (item.quantity || 0) * (item.unitCost || 0),
      currency: "LKR",
      reference: item.inventoryID,
      notes: `Inventory purchase: ${item.name}`,
      txnId: `INV-${item.inventoryID}`,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isFromInventory: true, // Flag to identify this is from inventory data
    }));

    res.status(200).json(expenseTransactions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory expenses", error: error.message });
  }
}
