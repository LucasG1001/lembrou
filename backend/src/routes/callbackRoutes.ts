import { Router } from "express";
import { requireCallbackSecret } from "../middleware/callbackAuth.js";
import { handleCallback } from "../controllers/callbackController.js";

const router = Router();

router.post("/callback", requireCallbackSecret, handleCallback);

export { router as telegramRoutes };
