import { Router } from "express";
import { collaboratorDocumentController } from "./collaborator-document.controller";

const collaboratorDocumentRoutes = Router({ mergeParams: true });

/**
 * @openapi
 * /collaborators/{collaboratorId}/documents:
 *   get:
 *     tags: [CollaboratorDocuments]
 *     summary: Lista os tipos de documento vinculados a um colaborador
 *     parameters:
 *       - in: path
 *         name: collaboratorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de vínculos do colaborador
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CollaboratorDocumentLink'
 *       404:
 *         description: Colaborador não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
collaboratorDocumentRoutes.get("/", collaboratorDocumentController.list);

/**
 * @openapi
 * /collaborators/{collaboratorId}/documents:
 *   post:
 *     tags: [CollaboratorDocuments]
 *     summary: Vincula um ou mais tipos de documento a um colaborador
 *     description: Vínculos removidos anteriormente são reativados; vínculos já ativos são ignorados silenciosamente.
 *     parameters:
 *       - in: path
 *         name: collaboratorId
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
 *             required: [documentTypeIds]
 *             properties:
 *               documentTypeIds:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]
 *     responses:
 *       201:
 *         description: Vínculos criados e/ou reativados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CollaboratorDocumentLink'
 *                 reactivated:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CollaboratorDocumentLink'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Colaborador ou tipo de documento não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
collaboratorDocumentRoutes.post("/", collaboratorDocumentController.link);

/**
 * @openapi
 * /collaborators/{collaboratorId}/documents/{documentTypeId}:
 *   delete:
 *     tags: [CollaboratorDocuments]
 *     summary: Desvincula um tipo de documento de um colaborador
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
 *       204:
 *         description: Vínculo removido
 *       404:
 *         description: Colaborador não encontrado ou tipo de documento não vinculado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
collaboratorDocumentRoutes.delete("/:documentTypeId", collaboratorDocumentController.unlink);

export { collaboratorDocumentRoutes };
