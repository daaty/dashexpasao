import { Router } from 'express';
import cityRoutes from './city.routes';
import aiRoutes from './ai.routes';
import planningRoutes from './planning.routes';

const router = Router();

router.use('/cities', cityRoutes);
router.use('/ai', aiRoutes);
router.use('/plannings', planningRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
