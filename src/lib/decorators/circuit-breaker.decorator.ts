import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { CircuitBreakerInterceptor } from '../interceptors/circuit-breaker.interceptor';
import { CircuitBreakerOptions } from '../types/CircuitBreakerOptions';

export const CIRCUIT_BREAKER_OPTIONS = 'CIRCUIT_BREAKER_OPTIONS';

/**
 * Decorador que aplica el patrón Circuit Breaker a un método o controlador.
 * Registra las opciones del circuit breaker y aplica el interceptor correspondiente.
 * @param options Opciones de configuración del circuit breaker
 */
export function CircuitBreaker(options: CircuitBreakerOptions = {}) {
  return applyDecorators(
    SetMetadata(CIRCUIT_BREAKER_OPTIONS, options),
    UseInterceptors(CircuitBreakerInterceptor),
  );
}
