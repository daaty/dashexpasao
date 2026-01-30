import { Router } from 'express';
import cityRoutes from './city.routes';
import aiRoutes from './ai.routes';
import planningRoutes from './planning.routes';
import planDetailsRoutes from './planDetails.routes';
import ridesRoutes from './rides.routes';
import passengerRoutes from './passengers.routes';
import marketBlocksRoutes from './marketBlocks.routes';

const router = Router();

router.use('/cities', cityRoutes);
router.use('/ai', aiRoutes);
router.use('/plannings', planningRoutes);
router.use('/plan-details', planDetailsRoutes);
router.use('/rides', ridesRoutes);
router.use('/passengers', passengerRoutes);
router.use('/market-blocks', marketBlocksRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
