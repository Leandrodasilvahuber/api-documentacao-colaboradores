import { Router } from 'express';
import { collaboratorController } from './collaborator.controller';

const collaboratorRoutes = Router();

collaboratorRoutes.post('/', collaboratorController.create);
collaboratorRoutes.get('/', collaboratorController.findAll);
collaboratorRoutes.get('/:id', collaboratorController.findById);
collaboratorRoutes.put('/:id', collaboratorController.update);
collaboratorRoutes.delete('/:id', collaboratorController.delete);

export { collaboratorRoutes };
