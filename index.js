//index.js
import express from "express";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import cors from "cors";
import verifyJWT from "./middlewares/auth.js";

import vehicleRouter from "./routes/vehicleRouter.js";
import blogRouter from "./routes/BlogRoute.js";
import userRouter from "./routes/userRouter.js";
import tourPackageRoutes from "./routes/tourPackageRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import simpleFinanceRoutes from "./routes/simpleFinanceRoutes.js";
import accommodationRouter from "./routes/AccommodationRoute.js";
import complaintRouter from "./routes/ComplaintRoute.js";
import feedbackRouter from "./routes/FeedbackRoute.js";
import inventoryRouter from "./routes/InventoryRoutes.js";
import mealRoute from "./routes/MealRoute.js";
import payRoutes from "./routes/payRoutes.js";

import cartRoutes from "./routes/cartRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import chatbotRouter from "./routes/ChatbotRoute.js";
import chatRouter from "./routes/ChatRoute.js";

const app = express();
app.use(cors());
connectDB();

app.use(bodyParser.json());

app.post("/api/cart/webhook", express.raw({ type: "application/json" }), (req, res, next) => {
  // Save the raw buffer for the controller
  req.rawBody = req.body; // buffer
  next();
}, cartRoutes);

// For the rest: JSON parser
app.use(express.json());

app.use("/api/vehicles", vehicleRouter);
app.use("/api/blogs", blogRouter);
app.use("/api/user", userRouter);
app.use("/api/tour-packages", tourPackageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/simple-finance", simpleFinanceRoutes);
app.use("/api/accommodations", accommodationRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/feedbacks", feedbackRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/meals", mealRoute);
app.use("/api/cart", cartRoutes);
app.use("/api/pay", payRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/chat", chatRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
