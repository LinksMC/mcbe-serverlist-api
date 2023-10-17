import dotenv from 'dotenv';
import { app } from './app';

// 環境変数の読み込み
dotenv.config();

// サーバーの起動
app.listen(process.env.API_SERVER_PORT, () => {
  console.log(`Start on port ${process.env.API_SERVER_PORT}.`);
});
