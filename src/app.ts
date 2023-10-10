import express from "express";
import { router as authmc } from "./routes/authmc";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーティングの設定
app.use("/authmc", authmc);
