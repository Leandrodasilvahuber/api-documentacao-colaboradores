import { Router } from "express";
import { submissionController } from "./submission.controller";

const submissionRoutes = Router({ mergeParams: true });

/**
 * @openapi
 * /collaborators/{collaboratorId}/documents/{documentTypeId}/submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Envia uma nova versão de documento
 *     description: Cria uma nova versão e marca a versão anterior como não-atual. Requer que o tipo de documento esteja vinculado (ativamente) ao colaborador.
 *     parameters:
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: documentTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *                 maxLength: 255
 *                 example: rg-frente.pdf
 *     responses:
 *       201:
 *         description: Versão do documento criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentSubmission'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Tipo de documento não vinculado a este colaborador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Envio concorrente detectado, tente novamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRoutes.post("/", submissionController.submit);

/**
 * @openapi
 * /collaborators/{collaboratorId}/documents/{documentTypeId}/submissions:
 *   get:
 *     tags: [Submissions]
 *     summary: Lista o histórico de versões de um documento
 *     parameters:
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: documentTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Histórico de versões, da mais recente para a mais antiga
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentSubmission'
 *       404:
 *         description: Tipo de documento não vinculado a este colaborador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRoutes.get("/", submissionController.listVersions);

const pendingDocumentRoutes = Router();

/**
 * @openapi
 * /documents/pending:
 *   get:
 *     tags: [Pending]
 *     summary: Lista documentos pendentes de envio, com filtros e paginação
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
 *           default: 20
 *       - in: query
 *         name: collaboratorId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: documentTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: collaboratorName
 *         schema:
 *           type: string
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Lista paginada de vínculos pendentes de envio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CollaboratorDocumentLink'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Erro de validação (ex. createdFrom posterior a createdTo)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
pendingDocumentRoutes.get("/pending", submissionController.listPending);

export { submissionRoutes, pendingDocumentRoutes };
