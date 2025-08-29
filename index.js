import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

let app = express();

connectDB();

app.use(bodyParser.json());

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})
