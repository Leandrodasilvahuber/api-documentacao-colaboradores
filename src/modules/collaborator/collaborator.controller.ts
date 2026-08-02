import { NextFunction, Request, Response } from "express";
import { paginationSchema } from "../../shared/utils/pagination";
import { collaboratorService } from "./collaborator.service";
import {
  collaboratorParamsSchema,
  createCollaboratorSchema,
  updateCollaboratorSchema,
} from "./collaborator.schema";

export const collaboratorController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCollaboratorSchema.parse(req.body);
      const collaborator = await collaboratorService.create(data);
      res.status(201).json(collaborator);
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const result = await collaboratorService.findAll(pagination);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = collaboratorParamsSchema.parse(req.params);
      const collaborator = await collaboratorService.findById(id);
      res.status(200).json(collaborator);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = collaboratorParamsSchema.parse(req.params);
      const data = updateCollaboratorSchema.parse(req.body);
      const collaborator = await collaboratorService.update(id, data);
      res.status(200).json(collaborator);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = collaboratorParamsSchema.parse(req.params);
      await collaboratorService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
