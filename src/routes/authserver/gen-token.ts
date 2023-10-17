import { Request, Response } from "express";
import { ExResponse } from "../../types/response";
import { CreateToken, getTokenLifetime } from "../../lib/token";
import { prisma } from "../../db/prisma";
import { getElapsedTime } from "../../lib/date";
import { ping } from "bedrock-protocol";
import {
	PrismaClientInitializationError,
	PrismaClientKnownRequestError,
	PrismaClientRustPanicError,
	PrismaClientUnknownRequestError,
	PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { error } from "console";
import { isTypeOfOne } from "../../lib/utils";
import { isPrismaError } from "../../lib/db";
import { z } from "zod";

// POST /authserver/check-address : Minecraftサーバーが存在するか確認する

// リクエストボディの型定義
const GenServerTokenReqBody = z.object({
	userid: z.string(),
	ip: z.string(),
	port: z.number(),
});
type GenServerTokenReqBodyType = z.infer<typeof GenServerTokenReqBody>;

// レスポンスボディの型定義
const GenServerTokenResBody = z.object({
	id: z.string(),
	token: z.string(),
});
type GenServerTokenResBodyType = z.infer<typeof GenServerTokenResBody>;

export async function GenServerToken(
	req: Request<GenServerTokenReqBodyType>,
	res: ExResponse<GenServerTokenResBodyType>
) {
	// サーバー存在確認・トークン作成
	try {
		// プロパティが揃っているかを確認する
		GenServerTokenReqBody.parse(req.body);
		// すでに登録されていないか確認
		const server = await prisma.minecraftServer.findFirst({
			where: {
				ip: req.body.ip,
				port: req.body.port,
			},
		});
		if (server != null) {
			res.status(404).json({
				message: "すでに登録されています",
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
				message: "すでに認証リクエストが生成されています",
			});
			return;
		}
		//サーバー疎通確認
		const mcRes = await ping({ host: req.body.ip, port: req.body.port });
		// UserのminecraftServerAuthRequestsに追加
		const token = CreateToken();
		const result = await prisma.minecraftServerAuthRequest.create({
			data: {
				ip: req.body.ip,
				port: req.body.port,
				token: token,
				userId: req.body.userid,
			},
		});
		res.status(201).json({
			id: result.id,
			token: token,
		});
		return;
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
		} else if (e.message.startsWith("Invalid connection address")) {
			res.status(404).json({
				message: "サーバーへ接続できません",
			});
		} else if (e.message.startsWith("Ping timed out")) {
			res.status(404).json({
				message: "接続がタイムアウトしました",
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
