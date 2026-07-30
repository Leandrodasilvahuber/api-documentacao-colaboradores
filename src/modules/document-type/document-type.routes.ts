import { Router } from "express";
import { documentTypeController } from "./document-type.controller";

const documentTypeRoutes = Router();

/**
 * @openapi
 * /document-types:
 *   post:
 *     tags: [DocumentTypes]
 *     summary: Cria um novo tipo de documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: RG
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Documento de identidade
 *     responses:
 *       201:
 *         description: Tipo de documento criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentType'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Já existe um tipo de documento com este nome
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
documentTypeRoutes.post("/", documentTypeController.create);

/**
 * @openapi
 * /document-types:
 *   get:
 *     tags: [DocumentTypes]
 *     summary: Lista tipos de documento de forma paginada
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
 *         description: Lista paginada de tipos de documento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DocumentType'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
documentTypeRoutes.get("/", documentTypeController.findAll);

/**
 * @openapi
 * /document-types/{id}:
 *   get:
 *     tags: [DocumentTypes]
 *     summary: Busca um tipo de documento pelo id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tipo de documento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentType'
 *       404:
 *         description: Tipo de documento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
documentTypeRoutes.get("/:id", documentTypeController.findById);

/**
 * @openapi
 * /document-types/{id}:
 *   put:
 *     tags: [DocumentTypes]
 *     summary: Atualiza um tipo de documento
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
 *                 example: RG
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Documento de identidade atualizado
 *     responses:
 *       200:
 *         description: Tipo de documento atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentType'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Tipo de documento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Já existe um tipo de documento com este nome
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
documentTypeRoutes.put("/:id", documentTypeController.update);

/**
 * @openapi
 * /document-types/{id}:
 *   delete:
 *     tags: [DocumentTypes]
 *     summary: Remove (soft delete) um tipo de documento
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Tipo de documento removido
 *       404:
 *         description: Tipo de documento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
documentTypeRoutes.delete("/:id", documentTypeController.delete);

export { documentTypeRoutes };
