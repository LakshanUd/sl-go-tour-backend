/* models/MealModel.js */
import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
   },

    description: { 
      type: String 
   },

    catogery: { 
      type: String, 
      required: true 
   }, 
    
    price: { 
      type: Number, 
      required: true 
   },

    avalability: { 
      type: Boolean, 
      default: true 
   },

    image: { 
      type: String 
   },
  },
  { timestamps: true }
);

const Meal = mongoose.model("MealModel", mealSchema);
export default Meal;
