import { Request, Response } from 'express';
import { ExResponse } from '../../types/response';
import { CreateToken, getTokenLifetime } from '../../lib/token';
import { prisma } from '../../db/prisma';
import { getElapsedTime } from '../../lib/date';
import { z } from 'zod';
import { isPrismaError } from '../../lib/db';

// POST /authmc/auth-token : トークンを認証する

// リクエストボディの型定義
const AuthUserTokenReqBody = z.object({
  id: z.string(),
  token: z.string(),
});
type AuthUserTokenReqBodyType = z.infer<typeof AuthUserTokenReqBody>;

// レスポンスボディの型定義
const AuthUserTokenResBody = z.object({
  edition: z.string(),
  name: z.string(),
  mcid: z.string(),
});
type AuthUserTokenResBodyType = z.infer<typeof AuthUserTokenResBody>;

export async function AuthUserToken(
  req: Request<AuthUserTokenReqBodyType>,
  res: ExResponse<AuthUserTokenResBodyType>
) {
  try {
    // プロパティが揃っているかを確認する
    AuthUserTokenReqBody.parse(req.body);
    // トークン存在確認
    const authRequest = await prisma.minecraftAuthRequest.findFirst({
      where: {
        token: req.body.token,
      },
    });
    if (authRequest == null) {
      res.status(404).json({
        message: 'トークンが見つかりません',
      });
      return;
    }
    // トークンが有効期限内か確認する
    const elapsed = getElapsedTime(authRequest.updatedAt);
    if (elapsed > getTokenLifetime()) {
      res.status(404).json({
        message: 'トークンの有効期限が切れています',
      });
      return;
    }
    // ユーザー取得
    const user = await prisma.user.findFirst({
      where: {
        id: req.body.id,
      },
    });
    if (user == null) {
      res.status(404).send({
        message: 'ユーザーが見つかりません',
      });
      return;
    }
    // ユーザーが既に連携しているか確認する
    const minecraftAccount = await prisma.minecraftAccount.findFirst({
      where: {
        userId: user.id,
        edition: authRequest.edition,
      },
    });
    if (minecraftAccount != null) {
      res.status(409).json({
        message: '既に連携しています',
      });
      return;
    }
    // Minecraft連携処理
    await prisma.minecraftAccount.create({
      data: {
        userId: user.id,
        edition: authRequest.edition,
        name: authRequest.name,
        mcid: authRequest.mcid,
      },
    });
    await prisma.minecraftAuthRequest.delete({
      where: {
        id: authRequest.id,
      },
    });
    // TODO: アバター画像変更処理

    res.status(201).json({
      edition: authRequest.edition,
      name: authRequest.name,
      mcid: authRequest.mcid,
    });
  } catch (e) {
    // TODO リファクタリング
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
    } else {
      res.status(404).json({
        message: `未定義のエラー: ${e.name}`,
      });
      console.log(e);
    }
  }
}
