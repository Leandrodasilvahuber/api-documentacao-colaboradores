import { statisticsRepository } from './statistics.repository';
import { RecentSubmissionsQuery } from './statistics.schema';

export const statisticsService = {
  async getCompletion() {
    const [total, submitted] = await Promise.all([
      statisticsRepository.countLinks(),
      statisticsRepository.countSubmittedLinks(),
    ]);
    const pending = total - submitted;
    const percentage = total === 0 ? 0 : Number(((submitted / total) * 100).toFixed(2));

    return { total, submitted, pending, percentage };
  },

  async getPendingRanking() {
    const byDocumentType = await statisticsRepository.byDocumentType();

    return byDocumentType
      .filter((item) => item.pending > 0)
      .sort((a, b) => {
        if (b.pending !== a.pending) {
          return b.pending - a.pending;
        }
        return (a.documentTypeName ?? '').localeCompare(b.documentTypeName ?? '');
      });
  },

  async getRecentSubmissions(query: RecentSubmissionsQuery) {
    return statisticsRepository.findRecentSubmissions(query.limit);
  },
};
