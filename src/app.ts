import express from 'express';
import { GenUserToken } from './routes/authmc/gen-token';
import { AuthUserToken } from './routes/authmc/auth-token';
import { GenServerToken } from './routes/authserver/gen-token';
import { AuthServerToken } from './routes/authserver/auth-token';
import { EditServerInfo } from './routes/server/edit-info';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーティングの設定
// Minecraftアカウント認証API
const r_authmc = express.Router();
r_authmc.post('/gen-token', GenUserToken);
r_authmc.post('/auth-token', AuthUserToken);
app.use('/authmc', r_authmc);
// Minecraftサーバー認証API
const r_authserver = express.Router();
r_authserver.post('/gen-token', GenServerToken);
r_authserver.post('/auth-token', AuthServerToken);
app.use('/authserver', r_authserver);
// サーバー操作系API
const r_server = express.Router();
r_server.post('/edit-info', EditServerInfo);
app.use('/server', r_server);
