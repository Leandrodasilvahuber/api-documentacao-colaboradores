import { NextFunction, Request, Response } from 'express';
import { paginationSchema } from '../../shared/utils/pagination';
import { documentTypeService } from './document-type.service';
import { createDocumentTypeSchema, updateDocumentTypeSchema } from './document-type.schema';

export const documentTypeController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createDocumentTypeSchema.parse(req.body);
      const documentType = await documentTypeService.create(data);
      res.status(201).json(documentType);
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const result = await documentTypeService.findAll(pagination);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const documentType = await documentTypeService.findById(req.params.id as string);
      res.status(200).json(documentType);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateDocumentTypeSchema.parse(req.body);
      const documentType = await documentTypeService.update(req.params.id as string, data);
      res.status(200).json(documentType);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await documentTypeService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
