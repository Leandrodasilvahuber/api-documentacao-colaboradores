import { prisma } from "../../shared/database/prisma";

const activeLinkWhere = {
  deletedAt: null,
  collaborator: { deletedAt: null },
  documentType: { deletedAt: null },
} as const;

export const statisticsRepository = {
  countLinks() {
    return prisma.collaboratorDocumentType.count({ where: activeLinkWhere });
  },

  countSubmittedLinks() {
    return prisma.collaboratorDocumentType.count({
      where: { ...activeLinkWhere, submissions: { some: { isCurrentVersion: true } } },
    });
  },

  async byDocumentType() {
    const [totals, pending] = await Promise.all([
      prisma.collaboratorDocumentType.groupBy({
        by: ["documentTypeId"],
        where: activeLinkWhere,
        _count: { _all: true },
      }),
      prisma.collaboratorDocumentType.groupBy({
        by: ["documentTypeId"],
        where: { ...activeLinkWhere, submissions: { none: { isCurrentVersion: true } } },
        _count: { _all: true },
      }),
    ]);

    const documentTypes = await prisma.documentType.findMany({
      where: { id: { in: totals.map((row) => row.documentTypeId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(documentTypes.map((type) => [type.id, type.name]));
    const pendingById = new Map(pending.map((row) => [row.documentTypeId, row._count._all]));

    return totals.map((row) => {
      const total = row._count._all;
      const pendingCount = pendingById.get(row.documentTypeId) ?? 0;
      return {
        documentTypeId: row.documentTypeId,
        documentTypeName: nameById.get(row.documentTypeId) ?? null,
        total,
        submitted: total - pendingCount,
        pending: pendingCount,
      };
    });
  },

  findRecentSubmissions(limit: number) {
    return prisma.documentSubmission.findMany({
      where: {
        isCurrentVersion: true,
        collaboratorDocumentType: activeLinkWhere,
      },
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: {
        collaboratorDocumentType: {
          include: {
            collaborator: { select: { id: true, name: true, email: true } },
            documentType: { select: { id: true, name: true } },
          },
        },
      },
    });
  },
};
