import { Router } from "express";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  acknowledge,
  cancel,
} from "../controllers/reminderController.js";

const router = Router();

router.get("/", getAll);
router.post("/", create);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/:id/acknowledge", acknowledge);
router.post("/:id/cancel", cancel);

export { router as reminderRoutes };
