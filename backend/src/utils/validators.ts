import Joi from 'joi';

// City validators
export const cityQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('CONSOLIDATED', 'EXPANSION', 'NOT_SERVED', 'PLANNING').optional(),
  mesorregion: Joi.string()
    .valid('NORTE', 'NORDESTE', 'SUDESTE', 'SUDOESTE', 'CENTRO_SUL')
    .optional(),
  minPopulation: Joi.number().integer().min(0).optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});

export const cityBodySchema = Joi.object({
  id: Joi.number().integer().required(),
  name: Joi.string().required(),
  population: Joi.number().integer().min(0).required(),
  population15to44: Joi.number().integer().min(0).required(),
  averageIncome: Joi.number().min(0).required(),
  urbanizationIndex: Joi.number().min(0).max(1).required(),
  status: Joi.string().valid('CONSOLIDATED', 'EXPANSION', 'NOT_SERVED', 'PLANNING').required(),
  mesorregion: Joi.string()
    .valid('NORTE', 'NORDESTE', 'SUDESTE', 'SUDOESTE', 'CENTRO_SUL')
    .required(),
  gentilic: Joi.string().required(),
  anniversary: Joi.string().required(),
  mayor: Joi.string().required(),
  monthlyRevenue: Joi.number().min(0).optional(),
  implementationStartDate: Joi.date().optional(),
  averageFormalSalary: Joi.number().min(0).required(),
  formalJobs: Joi.number().integer().min(0).required(),
  urbanizedAreaKm2: Joi.number().min(0).required(),
});

// AI validators
export const aiPromptSchema = Joi.object({
  prompt: Joi.string().min(10).max(2000).required(),
});

// Planning validators
export const planningBodySchema = Joi.object({
  cityId: Joi.number().integer().required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional().allow(null),
  status: Joi.string().valid('active', 'completed', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  estimatedBudget: Joi.number().min(0).optional(),
  actualBudget: Joi.number().min(0).optional(),
  tasks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().optional(),
        dueDate: Joi.date().optional(),
      })
    )
    .optional(),
});

export const taskBodySchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  completed: Joi.boolean().optional(),
  dueDate: Joi.date().optional().allow(null),
});
