import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, firstValueFrom } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { CIRCUIT_BREAKER_OPTIONS } from '../decorators/circuit-breaker.decorator';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { CircuitBreakerOpenError } from '../errors/CircuitBreakerOpenError';
import { CircuitState } from '../types/CircuitState';

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Obtener las opciones del decorador CircuitBreaker
    const options =
      this.reflector.get(CIRCUIT_BREAKER_OPTIONS, context.getHandler()) || {};

    const key =
      options.key || `${context.getClass().name}_${context.getHandler().name}`;
      
    // Registrar el circuito si no existe
    this.circuitBreakerService.registerCircuit(key, options);
    
    return new Observable(subscriber => {
      this.circuitBreakerService
        .executeWithCircuitBreaker(
          key,
          () => firstValueFrom(next.handle()),
        )
        .then(value => {
          subscriber.next(value);
          subscriber.complete();
        })
        .catch(err => {
          // Obtener el estado actual del circuito
          const circuitState = this.circuitBreakerService.getCircuitState(key);
          
          if (err instanceof CircuitBreakerOpenError || (circuitState === CircuitState.CLOSED && err)) {
            // Si el circuito está abierto/cerrado y hay una función de fallback definida, la ejecutamos
            if (options.fallback) {
              try {
                // Obtenemos los argumentos del contexto para pasarlos al fallback
                const req = context.switchToHttp().getRequest();
                const result = options.fallback({
                  id: req.params?.id || 'unknown',
                  request: req,
                  error: err
                });
                
                // Si es un error de circuito abierto o cerrado con fallback, devolvemos 503
                const error = {
                  message: err.message,
                  statusCode: 503,
                  errorType: circuitState === CircuitState.OPEN ? CircuitState.OPEN : CircuitState.CLOSED,
                  fallbackResponse: result
                };
                subscriber.error(error);
                return;
              } catch (fallbackError) {
                // Si el fallback falla, enviamos el error original
                const error = {
                  message: err.message,
                  statusCode: 503,
                  errorType: circuitState === CircuitState.OPEN ? CircuitState.OPEN : CircuitState.CLOSED,
                  fallbackError: fallbackError.message
                }
                subscriber.error(error);
              }
            } else {
              // Si no hay fallback, enviamos el error original con 503
              const error = {
                message: err.message,
                statusCode: 503,
                errorType: circuitState === CircuitState.OPEN ? CircuitState.OPEN : CircuitState.CLOSED,
              }
              subscriber.error(error);
            }
          } else if (err.response) {
            subscriber.error(err.response);
          } else {
            subscriber.error(err);
          }
        });
    });
  }
}
