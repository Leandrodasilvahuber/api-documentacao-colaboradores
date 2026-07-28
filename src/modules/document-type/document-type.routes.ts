import { Router } from 'express';
import { documentTypeController } from './document-type.controller';

const documentTypeRoutes = Router();

documentTypeRoutes.post('/', documentTypeController.create);
documentTypeRoutes.get('/', documentTypeController.findAll);
documentTypeRoutes.get('/:id', documentTypeController.findById);
documentTypeRoutes.put('/:id', documentTypeController.update);
documentTypeRoutes.delete('/:id', documentTypeController.delete);

export { documentTypeRoutes };
