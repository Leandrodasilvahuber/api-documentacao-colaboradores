import { NextFunction, Request, Response } from "express";
import { submissionService } from "./submission.service";
import {
  createSubmissionSchema,
  pendingQuerySchema,
  submissionParamsSchema,
} from "./submission.schema";

export const submissionController = {
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { collaboratorId, documentTypeId } = submissionParamsSchema.parse(req.params);
      const body = createSubmissionSchema.parse(req.body);
      const submission = await submissionService.submit(collaboratorId, documentTypeId, body);
      res.status(201).json(submission);
    } catch (error) {
      next(error);
    }
  },

  async listVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { collaboratorId, documentTypeId } = submissionParamsSchema.parse(req.params);
      const versions = await submissionService.listVersions(collaboratorId, documentTypeId);
      res.status(200).json(versions);
    } catch (error) {
      next(error);
    }
  },

  async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const query = pendingQuerySchema.parse(req.query);
      const result = await submissionService.listPending(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
