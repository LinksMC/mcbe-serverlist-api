import express from "express";
import { Request, Response } from "express";
import { CreateToken, getTokenLifetime } from "../lib/token";
import { prisma } from "../db/prisma";

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
  async (req: Request<GenTokenReqBody>, res: Response<GenTokenResBody>) => {
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

    res.send({
      token: token,
      lifetime: lifetime,
    });
  }
);
