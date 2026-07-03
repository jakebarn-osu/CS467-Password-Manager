import cors from "cors";
import express from "express";
import type { User } from "@app/shared";
import { pool } from "./db.js";

const app = express();
app.use(cors());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users", async (_req, res) => {
  const result = await pool.query<User>(
    "SELECT id, name, email FROM users ORDER BY id",
  );
  res.json(result.rows);
});

const port = 5000;
app.listen(port, () => {
  console.log(`api listening on port ${port}`);
});
