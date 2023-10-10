import dotenv from "dotenv";
import express from "express";

// 環境変数の読み込み
dotenv.config();

const app: express.Express = express();
app.use(express.json());

// サーバーの起動
app.listen(process.env.API_SERVER_PORT, () => {
	console.log(`Start on port ${process.env.API_SERVER_PORT}.`);
});
