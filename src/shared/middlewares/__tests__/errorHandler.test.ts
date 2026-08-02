import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { AppError } from "../../errors/AppError";
import { errorHandler } from "../errorHandler";

function buildRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response & { status: jest.Mock; json: jest.Mock };
}

function buildReq() {
  return { log: { error: jest.fn() } } as unknown as Request;
}

describe("errorHandler", () => {
  it("responds with the error's status code and message for an AppError", () => {
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();
    const error = new AppError("Colaborador não encontrado", 404);

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Colaborador não encontrado" });
  });

  it("responds with 400 and treeified issues for a ZodError", () => {
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();
    const schema = z.object({ email: z.email() });
    const parseResult = schema.safeParse({ email: "not-an-email" });
    const error = parseResult.error as ZodError;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Erro de validação",
      issues: z.treeifyError(error),
    });
  });

  it("logs and responds with 500 for a generic error", () => {
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();
    const error = new Error("database is unreachable");

    errorHandler(error, req, res, next);

    expect(req.log.error).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Erro interno do servidor" });
  });
});
