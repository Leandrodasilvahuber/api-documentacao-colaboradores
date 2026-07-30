import { statisticsRepository } from '../statistics.repository';
import { statisticsService } from '../statistics.service';

jest.mock('../statistics.repository');

const mockedStatisticsRepository = statisticsRepository as jest.Mocked<typeof statisticsRepository>;

describe('statisticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompletion', () => {
    it('returns zeroed stats when there is no data', async () => {
      mockedStatisticsRepository.countLinks.mockResolvedValue(0);
      mockedStatisticsRepository.countSubmittedLinks.mockResolvedValue(0);

      const result = await statisticsService.getCompletion();

      expect(result).toEqual({ total: 0, submitted: 0, pending: 0, percentage: 0 });
    });

    it('computes the percentage when data is partial', async () => {
      mockedStatisticsRepository.countLinks.mockResolvedValue(3);
      mockedStatisticsRepository.countSubmittedLinks.mockResolvedValue(1);

      const result = await statisticsService.getCompletion();

      expect(result).toEqual({ total: 3, submitted: 1, pending: 2, percentage: 33.33 });
    });

    it('returns 100% when every link has a submission', async () => {
      mockedStatisticsRepository.countLinks.mockResolvedValue(5);
      mockedStatisticsRepository.countSubmittedLinks.mockResolvedValue(5);

      const result = await statisticsService.getCompletion();

      expect(result).toEqual({ total: 5, submitted: 5, pending: 0, percentage: 100 });
    });
  });

  describe('getPendingRanking', () => {
    it('returns an empty ranking when there is no data', async () => {
      mockedStatisticsRepository.byDocumentType.mockResolvedValue([]);

      const result = await statisticsService.getPendingRanking();

      expect(result).toEqual([]);
    });

    it('excludes document types without pending links', async () => {
      mockedStatisticsRepository.byDocumentType.mockResolvedValue([
        { documentTypeId: 'dt-1', documentTypeName: 'RG', total: 4, submitted: 4, pending: 0 },
        { documentTypeId: 'dt-2', documentTypeName: 'CPF', total: 4, submitted: 2, pending: 2 },
      ]);

      const result = await statisticsService.getPendingRanking();

      expect(result).toEqual([
        { documentTypeId: 'dt-2', documentTypeName: 'CPF', total: 4, submitted: 2, pending: 2 },
      ]);
    });

    it('sorts document types with pending links by pending count descending', async () => {
      mockedStatisticsRepository.byDocumentType.mockResolvedValue([
        { documentTypeId: 'dt-1', documentTypeName: 'RG', total: 4, submitted: 3, pending: 1 },
        { documentTypeId: 'dt-2', documentTypeName: 'CPF', total: 4, submitted: 0, pending: 4 },
        { documentTypeId: 'dt-3', documentTypeName: 'CNH', total: 4, submitted: 1, pending: 3 },
      ]);

      const result = await statisticsService.getPendingRanking();

      expect(result.map((item) => item.documentTypeId)).toEqual(['dt-2', 'dt-3', 'dt-1']);
    });

    it('breaks ties in pending count by document type name alphabetically', async () => {
      mockedStatisticsRepository.byDocumentType.mockResolvedValue([
        { documentTypeId: 'dt-1', documentTypeName: 'RG', total: 4, submitted: 2, pending: 2 },
        { documentTypeId: 'dt-2', documentTypeName: 'CPF', total: 4, submitted: 2, pending: 2 },
        { documentTypeId: 'dt-3', documentTypeName: 'CNH', total: 4, submitted: 2, pending: 2 },
      ]);

      const result = await statisticsService.getPendingRanking();

      expect(result.map((item) => item.documentTypeId)).toEqual(['dt-3', 'dt-2', 'dt-1']);
    });
  });

  describe('getRecentSubmissions', () => {
    it('returns an empty array when there are no submissions', async () => {
      mockedStatisticsRepository.findRecentSubmissions.mockResolvedValue([]);

      const result = await statisticsService.getRecentSubmissions({ limit: 10 });

      expect(mockedStatisticsRepository.findRecentSubmissions).toHaveBeenCalledWith(10);
      expect(result).toEqual([]);
    });

    it('returns the submissions delegated by the repository respecting the limit', async () => {
      const submissions = [
        { id: 'submission-2', version: 2, submittedAt: new Date('2026-07-28') },
        { id: 'submission-1', version: 1, submittedAt: new Date('2026-07-27') },
      ];
      mockedStatisticsRepository.findRecentSubmissions.mockResolvedValue(submissions as never);

      const result = await statisticsService.getRecentSubmissions({ limit: 2 });

      expect(mockedStatisticsRepository.findRecentSubmissions).toHaveBeenCalledWith(2);
      expect(result).toEqual(submissions);
    });
  });
});
