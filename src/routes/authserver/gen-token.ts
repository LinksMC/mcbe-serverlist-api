import { Request, Response } from "express";
import { ExResponse } from "../../types/response";
import { CreateToken, getTokenLifetime } from "../../lib/token";
import { prisma } from "../../db/prisma";
import { getElapsedTime } from "../../lib/date";
import { ping } from "bedrock-protocol";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// POST /authserver/check-address : Minecraftサーバーが存在するか確認する
type GenServerTokenReqBody = {
  userid: string;
  ip: string;
  port: number;
};

type GenServerTokenResBody = {
  token: string;
};

export async function GenServerToken(
  req: Request<GenServerTokenReqBody>,
  res: ExResponse<GenServerTokenResBody>,
) {
  // TODO: 前提条件確認

  // すでに登録されていないか確認
  const server = await prisma.minecraftServer.findFirst({
    where: {
      ip: req.body.ip,
      port: req.body.port,
    },
  });
  if (server != null) {
    res.status(404).json({
      errors: [
        {
          message: "すでに登録されています",
        },
      ],
    });
    return;
  }
  // 既に認証リクエストが生成されていないか確認
  const authRequest = await prisma.minecraftServerAuthRequest.findFirst({
    where: {
      ip: req.body.ip,
      port: req.body.port,
    },
  });
  if (authRequest != null) {
    res.status(404).json({
      errors: [
        {
          message: "すでに認証リクエストが生成されています",
        },
      ],
    });
    return;
  }

  // サーバー存在確認・トークン作成
  try {
    const mcRes = await ping({ host: req.body.ip, port: req.body.port });
    // UserのminecraftServerAuthRequestsに追加
    const token = CreateToken();
    await prisma.minecraftServerAuthRequest.create({
      data: {
        ip: req.body.ip,
        port: req.body.port,
        token: token,
        userId: req.body.userid,
      },
    });
    res.status(201).json({
      token: token,
    });
    return;
  } catch (e) {
    // エラーハンドリング
    // TODO リファクタリング
    if (!(e instanceof Error)) {
      res.status(404).json({
        errors: [
          {
            message: "未定義のエラー",
          },
        ],
      });
    } else if (e instanceof PrismaClientKnownRequestError) {
      res.status(404).json({
        errors: [
          {
            message: "データベースエラー",
          },
        ],
      });
    } else if (e.message.startsWith("Invalid connection address")) {
      res.status(404).json({
        errors: [
          {
            message: "アドレスが不正です",
          },
        ],
      });
    } else if (e.message.startsWith("Ping timed out")) {
      res.status(404).json({
        errors: [
          {
            message: "サーバーへ接続できません",
          },
        ],
      });
    } else {
      res.status(404).json({
        errors: [
          {
            message: "未定義のエラー",
          },
        ],
      });
    }
    return;
  }
}
