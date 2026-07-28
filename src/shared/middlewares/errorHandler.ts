import { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import { AppError } from "../errors/AppError";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Erro de validação",
      issues: z.treeifyError(error),
    });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Erro interno do servidor" });
}
