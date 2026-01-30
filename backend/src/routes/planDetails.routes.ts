import { Router } from 'express';
import * as planDetailsController from '../controllers/planDetails.controller';

const router = Router();

// Salvar detalhes do planejamento (fases + ações)
router.post('/:cityId', planDetailsController.savePlanDetails);

// Buscar detalhes do planejamento
router.get('/:cityId', planDetailsController.getPlanDetails);

// Deletar detalhes do planejamento
router.delete('/:cityId', planDetailsController.deletePlanDetails);

export default router;
