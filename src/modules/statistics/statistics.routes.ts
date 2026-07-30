import { Router } from "express";
import { statisticsController } from "./statistics.controller";

const statisticsRoutes = Router();

/**
 * @openapi
 * /statistics/completion:
 *   get:
 *     tags: [Statistics]
 *     summary: Retorna o percentual geral de conclusão de envio de documentos
 *     responses:
 *       200:
 *         description: Totais e percentual de conclusão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 submitted:
 *                   type: integer
 *                   example: 35
 *                 pending:
 *                   type: integer
 *                   example: 15
 *                 percentage:
 *                   type: number
 *                   example: 70.00
 */
statisticsRoutes.get("/completion", statisticsController.completion);

/**
 * @openapi
 * /statistics/pending-ranking:
 *   get:
 *     tags: [Statistics]
 *     summary: Ranking de tipos de documento por quantidade de pendências
 *     description: Retorna apenas tipos de documento com ao menos uma pendência, ordenados do mais pendente para o menos pendente.
 *     responses:
 *       200:
 *         description: Ranking de pendências por tipo de documento
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   documentTypeId:
 *                     type: string
 *                     format: uuid
 *                   documentTypeName:
 *                     type: string
 *                     nullable: true
 *                     example: RG
 *                   total:
 *                     type: integer
 *                     example: 20
 *                   submitted:
 *                     type: integer
 *                     example: 12
 *                   pending:
 *                     type: integer
 *                     example: 8
 */
statisticsRoutes.get("/pending-ranking", statisticsController.pendingRanking);

/**
 * @openapi
 * /statistics/recent-submissions:
 *   get:
 *     tags: [Statistics]
 *     summary: Lista os envios de documento mais recentes
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Envios recentes, com dados do colaborador e do tipo de documento
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/DocumentSubmission'
 *                   - type: object
 *                     properties:
 *                       collaboratorDocumentType:
 *                         type: object
 *                         properties:
 *                           collaborator:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           documentType:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
statisticsRoutes.get("/recent-submissions", statisticsController.recentSubmissions);

export { statisticsRoutes };
