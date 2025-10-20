// models/FeedBackModel.js
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: { 
      type: String
    },

    email: { 
      type: String, 
    },

    message: { 
      type: String,
    },

    rating: { 
      type: Number,
      required: true, 
      min: 1, 
      max: 5 
   },

    date: { 
      type: Date, 
      default: Date.now 
   },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("FeedbackModel", feedbackSchema);
export default Feedback;
