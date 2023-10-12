import { Response } from "express";
import { Send } from "express-serve-static-core";

interface ErrorResponse {
  errors: Array<{
    message: string;
    code?: number;
  }>;
}

export interface ExResponse<ResBody> extends Response {
  json: Send<ResBody | ErrorResponse>;
}

TypeScript;
