import { NextFunction, Request, Response } from "express";
import { collaboratorDocumentService } from "./collaborator-document.service";
import {
  collaboratorDocumentParamsSchema,
  collaboratorDocumentUnlinkParamsSchema,
  linkDocumentsSchema,
} from "./collaborator-document.schema";

export const collaboratorDocumentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { collaboratorId } = collaboratorDocumentParamsSchema.parse(req.params);
      const documents = await collaboratorDocumentService.listByCollaborator(collaboratorId);
      res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  },

  async link(req: Request, res: Response, next: NextFunction) {
    try {
      const { collaboratorId } = collaboratorDocumentParamsSchema.parse(req.params);
      const { documentTypeIds } = linkDocumentsSchema.parse(req.body);
      const result = await collaboratorDocumentService.linkDocuments(
        collaboratorId,
        documentTypeIds,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async unlink(req: Request, res: Response, next: NextFunction) {
    try {
      const { collaboratorId, documentTypeId } = collaboratorDocumentUnlinkParamsSchema.parse(
        req.params,
      );
      await collaboratorDocumentService.unlinkDocument(collaboratorId, documentTypeId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
