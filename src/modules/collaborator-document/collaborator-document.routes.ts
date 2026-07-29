import { Router } from 'express';
import { collaboratorDocumentController } from './collaborator-document.controller';

const collaboratorDocumentRoutes = Router({ mergeParams: true });

collaboratorDocumentRoutes.get('/', collaboratorDocumentController.list);
collaboratorDocumentRoutes.post('/', collaboratorDocumentController.link);
collaboratorDocumentRoutes.delete('/:documentTypeId', collaboratorDocumentController.unlink);

export { collaboratorDocumentRoutes };
