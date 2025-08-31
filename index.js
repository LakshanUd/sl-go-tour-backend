import express from "express";
import bodyParser from "body-parser";
import connectDB from "./config/db.js";
import vehicleRouter from "./routes/vehicleRouter.js";
import cors from "cors";

let app = express();
app.use(cors());

connectDB();

app.use(bodyParser.json());

app.use("/api/vehicles", vehicleRouter);

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})
