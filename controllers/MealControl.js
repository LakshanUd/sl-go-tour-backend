// controllers/MealControl.js
import Meal from "../models/MealModel.js";

// controllers/MealControl.js
export const getAllMeals = async (req, res) => {
  try {
    const meals = await Meal.find();
    return res.status(200).json({ meals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


// POST /meals
export const addMeals = async (req, res) => {
  try {
    const { name, description, catogery, price, avalability, image } = req.body;
    const meal = new Meal({ name, description, catogery, price, avalability, image });
    await meal.save();
    return res.status(201).json({ meals: meal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Unable to add meals" });
  }
};

// GET /meals/:id
export const getById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal cannot be found" });
    return res.status(200).json({ meals: meal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /meals/:id
export const updateMeal = async (req, res) => {
  try {
    const { name, description, catogery, price, avalability, image } = req.body;
    // IMPORTANT: use { new: true } and DON'T call .save() after findByIdAndUpdate
    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      { name, description, catogery, price, avalability, image },
      { new: true, runValidators: true }
    );
    if (!meal) return res.status(404).json({ message: "Unable to update meal details" });
    return res.status(200).json({ meals: meal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /meals/:id
export const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });
    return res.status(200).json({ meals: meal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
