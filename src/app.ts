import express from 'express';
import { GenUserToken } from './routes/authmc/gen-token';
import { AuthUserToken } from './routes/authmc/auth-token';
import { GenServerToken } from './routes/authserver/gen-token';
import { AuthServerToken } from './routes/authserver/auth-token';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーティングの設定
// Minecraftアカウント認証API
const authmc = express.Router();
authmc.post('/gen-token', GenUserToken);
authmc.post('/auth-token', AuthUserToken);
app.use('/authmc', authmc);
// Minecraftサーバー認証API
const authserver = express.Router();
authserver.post('/gen-token', GenServerToken);
authserver.post('/auth-token', AuthServerToken);
app.use('/authserver', authserver);
