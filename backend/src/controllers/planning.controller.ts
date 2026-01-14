import { Request, Response, NextFunction } from 'express';
import * as planningService from '../services/planning.service';
import { ApiResponse } from '../types';

export const createPlanning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planning = await planningService.createPlanning(req.body);

    const response: ApiResponse<any> = {
      success: true,
      data: planning,
      message: 'Planejamento criado com sucesso',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getAllPlannings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cityId, status } = req.query;
    const plannings = await planningService.getAllPlannings({
      cityId: cityId ? parseInt(cityId as string) : undefined,
      status: status as string,
    });

    const response: ApiResponse<any> = {
      success: true,
      data: plannings,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getPlanningById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const planning = await planningService.getPlanningById(id);

    const response: ApiResponse<any> = {
      success: true,
      data: planning,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updatePlanning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const planning = await planningService.updatePlanning(id, req.body);

    const response: ApiResponse<any> = {
      success: true,
      data: planning,
      message: 'Planejamento atualizado com sucesso',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deletePlanning = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await planningService.deletePlanning(id);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Planejamento deletado com sucesso',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const addTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const task = await planningService.addTaskToPlanning(id, req.body);

    const response: ApiResponse<any> = {
      success: true,
      data: task,
      message: 'Tarefa adicionada com sucesso',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const task = await planningService.updateTask(taskId, req.body);

    const response: ApiResponse<any> = {
      success: true,
      data: task,
      message: 'Tarefa atualizada com sucesso',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    await planningService.deleteTask(taskId);

    const response: ApiResponse<any> = {
      success: true,
      message: 'Tarefa deletada com sucesso',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
