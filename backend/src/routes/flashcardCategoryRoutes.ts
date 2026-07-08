import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  removeCategory,
} from "../controllers/flashcardCategoryController.js";

const router = Router();

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", removeCategory);

export { router as flashcardCategoryRoutes };
