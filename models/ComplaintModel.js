// models/ComplaintModel.js
import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    name: { 
      type: String 
   },

    email: { 
      type: String 
   },

    service: { 
      type: String, 
      required: true 
   },

    category: { 
      type: String, 
      required: true 
   },

    description: { 
      type: String, 
      required: true 
   },

    status: { 
      type: String,
       default: "Open" 
      },   
  },
  { timestamps: true }
);

const Complaint = mongoose.model("ComplaintModel", complaintSchema);
export default Complaint;
