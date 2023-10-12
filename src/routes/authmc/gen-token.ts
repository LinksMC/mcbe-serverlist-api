import { Request, Response } from "express";
import { ExResponse } from "../../types/response";
import { CreateToken, getTokenLifetime } from "../../lib/token";
import { prisma } from "../../db/prisma";

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

export async function GenToken(
  req: Request<GenTokenReqBody>,
  res: ExResponse<GenTokenResBody>
) {
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
