import { Router } from 'express';
import { submissionController } from './submission.controller';

const submissionRoutes = Router({ mergeParams: true });

submissionRoutes.post('/', submissionController.submit);
submissionRoutes.get('/', submissionController.listVersions);

const pendingDocumentRoutes = Router();

pendingDocumentRoutes.get('/pending', submissionController.listPending);

export { submissionRoutes, pendingDocumentRoutes };
