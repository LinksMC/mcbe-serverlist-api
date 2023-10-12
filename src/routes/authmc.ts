import express from "express";
import { Request, Response } from "express";
import { CreateToken, getTokenLifetime } from "../lib/token";
import { prisma } from "../db/prisma";
import { ExResponse } from "../types/response";
import { getElapsedTime } from "../lib/date";

export const router = express.Router();

// POST /authmc/gen-token : マインクラフト認証用のトークンを生成する
type GenTokenReqBody = {
  edition: string;
  name: string;
  mcid: string;
};

type GenTokenResBody = {
  token: string;
  lifetime: number;
};

router.post(
  "/gen-token",
  async (req: Request<GenTokenReqBody>, res: ExResponse<GenTokenResBody>) => {
    // TODO: 前提条件確認

    // トークン生成・保存
    const token = CreateToken();
    const lifetime = getTokenLifetime();
    await prisma.minecraftAuthRequest.upsert({
      where: {
        edition_mcid: {
          edition: req.body.edition,
          mcid: req.body.mcid,
        },
      },
      update: {
        token: token,
      },
      create: {
        edition: req.body.edition,
        mcid: req.body.mcid,
        name: req.body.name,
        token: token,
      },
    });

    res.status(201).json({
      token: token,
      lifetime: lifetime,
    });
  }
);

// POST /authmc/auth-token : トークンを認証する
type AuthTokenReqBody = {
  id: string;
  token: string;
};

type AuthTokenResBody = {
  edition: string;
  name: string;
  mcid: string;
};

router.post(
  "/auth-token",
  async (req: Request<AuthTokenReqBody>, res: ExResponse<AuthTokenResBody>) => {
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
);
