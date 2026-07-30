import { Router } from 'express';
import { collaboratorController } from './collaborator.controller';

const collaboratorRoutes = Router();

/**
 * @openapi
 * /collaborators:
 *   post:
 *     tags: [Collaborators]
 *     summary: Cria um novo colaborador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maria Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria.silva@empresa.com
 *     responses:
 *       201:
 *         description: Colaborador criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collaborator'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Já existe um colaborador com este email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
collaboratorRoutes.post('/', collaboratorController.create);

/**
 * @openapi
 * /collaborators:
 *   get:
 *     tags: [Collaborators]
 *     summary: Lista colaboradores de forma paginada
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista paginada de colaboradores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collaborator'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
collaboratorRoutes.get('/', collaboratorController.findAll);

/**
 * @openapi
 * /collaborators/{id}:
 *   get:
 *     tags: [Collaborators]
 *     summary: Busca um colaborador pelo id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Colaborador encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collaborator'
 *       404:
 *         description: Colaborador não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
collaboratorRoutes.get('/:id', collaboratorController.findById);

/**
 * @openapi
 * /collaborators/{id}:
 *   put:
 *     tags: [Collaborators]
 *     summary: Atualiza um colaborador
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maria Silva Souza
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria.souza@empresa.com
 *     responses:
 *       200:
 *         description: Colaborador atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Collaborator'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Colaborador não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Já existe um colaborador com este email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
collaboratorRoutes.put('/:id', collaboratorController.update);

/**
 * @openapi
 * /collaborators/{id}:
 *   delete:
 *     tags: [Collaborators]
 *     summary: Remove (soft delete) um colaborador
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Colaborador removido
 *       404:
 *         description: Colaborador não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
collaboratorRoutes.delete('/:id', collaboratorController.delete);

export { collaboratorRoutes };
