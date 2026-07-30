import { z } from 'zod';

export const createSubmissionSchema = z.object({
  fileName: z
    .string()
    .min(1, 'fileName não pode ser vazio')
    .max(255, 'fileName deve ter no máximo 255 caracteres')
    .optional(),
});

export const submissionParamsSchema = z.object({
  collaboratorId: z.uuid('collaboratorId inválido'),
  documentTypeId: z.uuid('documentTypeId inválido'),
});

export const pendingQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    collaboratorId: z.uuid('collaboratorId inválido').optional(),
    documentTypeId: z.uuid('documentTypeId inválido').optional(),
    collaboratorName: z.string().min(1).optional(),
    createdFrom: z.coerce.date('createdFrom inválido').optional(),
    createdTo: z.coerce.date('createdTo inválido').optional(),
  })
  .refine(
    (query) => !query.createdFrom || !query.createdTo || query.createdFrom <= query.createdTo,
    { message: 'createdFrom deve ser anterior ou igual a createdTo', path: ['createdFrom'] },
  );

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type SubmissionParams = z.infer<typeof submissionParamsSchema>;
export type PendingQuery = z.infer<typeof pendingQuerySchema>;
