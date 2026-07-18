import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { vaultRouter } from "./routes/vault.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/vault", vaultRouter);

app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`api listening on port ${config.PORT}`);
});
