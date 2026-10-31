import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const sendError = (res: Response, error: unknown): Response => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {})
      }
    });
  }

  console.error('Unhandled internal error:', error);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred'
    }
  });
};
