import { Request, Response } from "express";
import { ExResponse } from "../../types/response";
import { CreateToken, getTokenLifetime } from "../../lib/token";
import { prisma } from "../../db/prisma";
import { getElapsedTime } from "../../lib/date";

// POST /authmc/auth-token : トークンを認証する
type AuthUserTokenReqBody = {
  id: string;
  token: string;
};

type AuthUserTokenResBody = {
  edition: string;
  name: string;
  mcid: string;
};

export async function AuthUserToken(
  req: Request<AuthUserTokenReqBody>,
  res: ExResponse<AuthUserTokenResBody>,
) {
  // TODO: 前提条件確認

  // トークン存在確認
  const authRequest = await prisma.minecraftAuthRequest.findFirst({
    where: {
      token: req.body.token,
    },
  });
  if (authRequest == null) {
    res.status(404).json({
      errors: [
        {
          message: "トークンが見つかりません",
        },
      ],
    });
    return;
  }
  // トークンが有効期限内か確認する
  const elapsed = getElapsedTime(authRequest.updatedAt);
  if (elapsed > getTokenLifetime()) {
    res.status(404).json({
      errors: [
        {
          message: "トークンの有効期限が切れています",
        },
      ],
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
      errors: [
        {
          message: "ユーザーが見つかりません",
        },
      ],
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
      errors: [
        {
          message: "既に連携しています",
        },
      ],
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
}
