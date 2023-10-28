import { Request, Response } from 'express';
import { ExResponse } from '../../types/response';
import { CreateToken, getTokenLifetime } from '../../lib/token';
import { prisma } from '../../db/prisma';
import { getElapsedTime } from '../../lib/date';
import { ping } from 'bedrock-protocol';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { error } from 'console';
import { isTypeOfOne } from '../../lib/utils';
import { isPrismaError } from '../../lib/db';
import { z } from 'zod';

// POST /server/edit-info : Minecraftサーバーの登録情報を変更する

// リクエストボディの型定義
const EditServerInfoReqBody = z.object({
  id: z.string(),
  name: z.string(),
  published: z.boolean(),
  showIP: z.boolean(),
  description: z.string(),
});
type EditServerInfoReqBodyType = z.infer<typeof EditServerInfoReqBody>;

// レスポンスボディの型定義
const EditServerInfoResBody = z.object({});
type EditServerInfoResBodyType = z.infer<typeof EditServerInfoResBody>;

export async function EditServerInfo(
  req: Request<EditServerInfoReqBodyType>,
  res: ExResponse<EditServerInfoResBodyType>
) {
  try {
    // プロパティが揃っているかを確認する
    EditServerInfoReqBody.parse(req.body);
    // サーバーが存在するかどうか確認
    const server = await prisma.minecraftServer.findFirst({
      where: {
        id: req.body.id,
      },
    });
    if (server == null) {
      res.status(404).json({
        message: 'サーバーが存在しません',
      });
      return;
    }
    await prisma.minecraftServer.update({
      where: {
        id: req.body.id,
      },
      data: {
        name: req.body.name,
        published: req.body.published,
        showIP: req.body.showIP,
        description: req.body.description,
      },
    });
    res.status(201).json({});
    return;
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
    return;
  }
}
