import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { migrate } from "./database/migrate.js";
import { reminderRoutes } from "./routes/reminderRoutes.js";
import { habitRoutes } from "./routes/habitRoutes.js";
import { telegramRoutes } from "./routes/callbackRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { startScheduler } from "./services/reminderScheduler.js";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/reminders", reminderRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/telegram", telegramRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  await migrate();
  app.listen(PORT, () => {
    process.stdout.write(`RemindMe backend rodando em http://localhost:${PORT}\n`);
  });
  startScheduler();
}

start().catch((error) => {
  console.error("Falha ao iniciar o backend:", error);
  process.exit(1);
});
