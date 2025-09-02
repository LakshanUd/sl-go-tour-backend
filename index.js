import express from "express";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import vehicleRouter from "./routes/vehicleRouter.js";

import InventoryRoutes from "./routes/InventoryRoutes.js";
import mealRouter from "./routes/MealRoute.js";
import feedbackRouter from "./routes/FeedbackRoute.js";
import complaintRouter from "./routes/ComplaintRoute.js";

import cors from "cors";
import AccommodationRoute from "./routes/AccommodationRoute.js";


let app = express();
app.use(cors());

connectDB();

app.use(bodyParser.json());

app.use("/api/vehicles", vehicleRouter);

app.use("/api/inventory", InventoryRoutes);
app.use("/api/accommodations", AccommodationRoute);
app.use("/meals", mealRouter)
app.use("/feedbacks", feedbackRouter);
app.use("/complaints", complaintRouter);


app.listen(5000,()=>{
    console.log("Server is running on port 5000");
})


