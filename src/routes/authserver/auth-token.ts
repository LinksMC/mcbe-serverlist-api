import { Request, Response } from 'express';
import { ExResponse } from '../../types/response';
import { CreateToken, getTokenLifetime } from '../../lib/token';
import { prisma } from '../../db/prisma';
import { getElapsedTime } from '../../lib/date';
import { z } from 'zod';
import { isPrismaError } from '../../lib/db';
import { ping } from 'bedrock-protocol';

// POST /authserver/auth-token : MinecraftサーバーにPingを送信し、Motdからトークンを認証する

// リクエストボディの型定義
const AuthServerTokenReqBody = z.object({
  id: z.string(), // サーバーリクエストID
});
type AuthServerTokenReqBodyType = z.infer<typeof AuthServerTokenReqBody>;

// レスポンスボディの型定義
const AuthServerTokenResBody = z.object({
  id: z.number(), // サーバーID
});
type AuthServerTokenResBodyType = z.infer<typeof AuthServerTokenResBody>;

export async function AuthServerToken(
  req: Request<AuthServerTokenReqBodyType>,
  res: ExResponse<AuthServerTokenResBodyType>
) {
  try {
    // プロパティが揃っているかを確認する
    AuthServerTokenReqBody.parse(req.body);
    // サーバー認証リクエストを取得する
    const authRequest = await prisma.minecraftServerAuthRequest.findUnique({
      where: {
        id: req.body.id,
      },
    });
    if (authRequest == null) {
      res.status(404).json({
        message: '認証リクエストが見つかりません',
      });
      return;
    }
    // Minecraftサーバーへpingを送信し情報を取得する
    const mcRes = await ping({ host: req.body.ip, port: req.body.port });
    // トークンがmotdに含まれているか確認する
    if (!mcRes.motd.includes(authRequest.token)) {
      res.status(404).json({
        message: 'Motdにトークンが含まれていません',
      });
      return;
    }
    // サーバーを登録する
    const result = await prisma.minecraftServer.create({
      data: {
        name: mcRes.name,
        ip: authRequest.ip,
        port: authRequest.port,
        ownerId: authRequest.userId,
      },
    });
    // サーバー認証リクエストを削除する
    await prisma.minecraftServerAuthRequest.delete({
      where: {
        id: authRequest.id,
      },
    });
    // レスポンスを返す
    res.status(201).json({
      id: result.id,
    });
  } catch (e) {
    // TODO: リファクタリング
    if (!(e instanceof Error)) {
      res.status(404).json({
        message: '未定義のエラー',
      });
      console.log(e);
    } else if (e instanceof z.ZodError) {
      res.status(404).json({
        message: 'リクエストパラメータが不正です',
      });
    } else if (isPrismaError(e)) {
      res.status(404).json({
        message: 'データベースエラー',
      });
      console.log(e);
    } else if (e.message.startsWith('Invalid connection address')) {
      res.status(404).json({
        message: 'サーバーへ接続できません',
      });
    } else if (e.message.startsWith('Ping timed out')) {
      res.status(404).json({
        message: '接続がタイムアウトしました',
      });
    } else {
      res.status(404).json({
        message: `未定義のエラー: ${e.name}`,
      });
      console.log(e);
    }
    return;
  }
}
