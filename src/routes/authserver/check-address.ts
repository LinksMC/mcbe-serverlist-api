import { Request, Response } from "express";
import { ExResponse } from "../../types/response";
import { CreateToken, getTokenLifetime } from "../../lib/token";
import { prisma } from "../../db/prisma";
import { getElapsedTime } from "../../lib/date";

// POST /authserver/check-address : Minecraftサーバーが存在するか確認する
type CheckAddressReqBody = {
	ip: string;
	port: number;
};

type CheckAddressResBody = {};

export async function CheckAddress(
	req: Request<CheckAddressReqBody>,
	res: ExResponse<CheckAddressResBody>
) {
	// TODO: 前提条件確認

	// サーバー存在確認

	res.status(201).json({});
}
