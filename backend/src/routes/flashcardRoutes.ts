import { Router } from "express";
import {
  getFlashcards,
  getDueFlashcards,
  getFlashcard,
  createFlashcard,
  updateFlashcard,
  reviewFlashcard,
  removeFlashcard,
} from "../controllers/flashcardController.js";

const router = Router();

router.get("/", getFlashcards);
router.post("/", createFlashcard);
router.get("/due", getDueFlashcards);
router.post("/:id/review", reviewFlashcard);
router.get("/:id", getFlashcard);
router.put("/:id", updateFlashcard);
router.delete("/:id", removeFlashcard);

export { router as flashcardRoutes };
