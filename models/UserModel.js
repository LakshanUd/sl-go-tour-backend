//UserModel.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      //enum: ["Customer", "Staff", "Admin"],
      default: "Customer",
    },
    gender: {
      type: String,
      //enum: ["Male", "Female", "Other"],
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true, // automatically add createdAt, updatedAt
  }
);

module.exports = mongoose.model("User", UserSchema);




