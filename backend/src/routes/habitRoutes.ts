import { Router } from "express";
import {
  getAll,
  create,
  reorder,
  update,
  remove,
  setCompletion,
} from "../controllers/habitController.js";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.post("/reorder", reorder);
router.put("/:id", update);
router.delete("/:id", remove);
router.patch("/:id/completion/:date", setCompletion);

export { router as habitRoutes };
