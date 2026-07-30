import { NextFunction, Request, Response } from "express";
import { collaboratorDocumentService } from "./collaborator-document.service";
import { linkDocumentsSchema } from "./collaborator-document.schema";

export const collaboratorDocumentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const documents = await collaboratorDocumentService.listByCollaborator(
        req.params.collaboratorId as string,
      );
      res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  },

  async link(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentTypeIds } = linkDocumentsSchema.parse(req.body);
      const result = await collaboratorDocumentService.linkDocuments(
        req.params.collaboratorId as string,
        documentTypeIds,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async unlink(req: Request, res: Response, next: NextFunction) {
    try {
      await collaboratorDocumentService.unlinkDocument(
        req.params.collaboratorId as string,
        req.params.documentTypeId as string,
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
