import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { CircuitBreakerOpenError } from '../errors/CircuitBreakerOpenError';
import { Response } from 'express';

@Catch(CircuitBreakerOpenError)
export class CircuitBreakerFilter implements ExceptionFilter {
  catch(exception: CircuitBreakerOpenError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Responder con un estado 503 Service Unavailable cuando el circuito está abierto
    response.status(503).json({
      statusCode: 503,
      message: exception.message,
      error: 'Service Unavailable',
      timestamp: new Date().toISOString(),
    });
  }
}