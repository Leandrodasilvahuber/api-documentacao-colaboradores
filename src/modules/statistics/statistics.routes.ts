import { Router } from 'express';
import { statisticsController } from './statistics.controller';

const statisticsRoutes = Router();

statisticsRoutes.get('/completion', statisticsController.completion);
statisticsRoutes.get('/pending-ranking', statisticsController.pendingRanking);
statisticsRoutes.get('/recent-submissions', statisticsController.recentSubmissions);

export { statisticsRoutes };
