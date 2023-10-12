import express from "express";
import { GenToken } from "./routes/authmc/gen-token";
import { AuthToken } from "./routes/authmc/auth-token";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーティングの設定
// 認証API
const authmc = express.Router();
authmc.post("/gen-token", GenToken);
authmc.post("/auth-token", AuthToken);
app.use("/authmc", authmc);
