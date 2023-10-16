import { Request, Response } from "express";
import { ExResponse } from "../../types/response";
import { CreateToken, getTokenLifetime } from "../../lib/token";
import { prisma } from "../../db/prisma";
import { z } from "zod";
import { isPrismaError } from "../../lib/db";

// POST /authmc/gen-token : マインクラフト認証用のトークンを生成する

// リクエストボディの型定義
const GenServerTokenReqBody = z.object({
  edition: z.string(),
  name: z.string(),
  mcid: z.string(),
});
type GenUserTokenReqBodyType = z.infer<typeof GenServerTokenReqBody>;

// レスポンスボディの型定義
const GenServerTokenResBody = z.object({
  token: z.string(),
  lifetime: z.number(),
});
type GenServerTokenResBodyType = z.infer<typeof GenServerTokenResBody>;

export async function GenUserToken(
  req: Request<GenUserTokenReqBodyType>,
  res: ExResponse<GenServerTokenResBodyType>
) {
  try {
    // プロパティが揃っているかを確認する
    GenServerTokenReqBody.parse(req.body);
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
  } catch (e) {
    // TODO リファクタリング
    if (!(e instanceof Error)) {
      res.status(404).json({
        message: "未定義のエラー",
      });
      console.log(e);
    } else if (e instanceof z.ZodError) {
      res.status(404).json({
        message: "リクエストパラメータが不正です",
      });
    } else if (isPrismaError(e)) {
      res.status(404).json({
        message: "データベースエラー",
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
