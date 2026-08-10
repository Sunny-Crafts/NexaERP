import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined ? { data } : {})
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, error?: string, statusCode = 400) => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(error ? { error } : {})
  };
  return res.status(statusCode).json(response);
};
