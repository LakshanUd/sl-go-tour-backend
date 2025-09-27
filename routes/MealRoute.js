// routes/MealRoute.js
import { Router } from "express";
import {
  getAllMeals,
  addMeals,
  deleteMeal,
  getById,
  updateMeal,
} from "../controllers/MealControl.js";

const router = Router();

router.get("/", getAllMeals);
router.post("/", addMeals);
router.get("/:id", getById);
router.put("/:id", updateMeal);
router.delete("/:id", deleteMeal);

export default router;
