import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { CircuitBreakerEventEmitter } from './circuit-breaker';
import { catchError } from 'rxjs/operators';
import { CircuitBreakerOptions } from '../types/CircuitBreakerOptions';
import { CIRCUIT_BREAKER_OPTIONS } from '../decorators/circuit-breaker.decorator';

@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
    private readonly circuitBreakerByHandler = new WeakMap<
        Function,
        CircuitBreakerEventEmitter
    >();

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const methodRef = context.getHandler();

        // Obtener las opciones del circuit breaker desde el contexto
        const options = Reflect.getMetadata(
            CIRCUIT_BREAKER_OPTIONS,
            context.getHandler(),
        );

        const opciones: CircuitBreakerOptions = {
            successThreshold: options?.successThreshold,
            failureThreshold: options?.failureThreshold,
            openToHalfOpenWaitTime: options?.openToHalfOpenWaitTime,
            fallback: options?.fallback,
        } as CircuitBreakerOptions;

        let circuitBreaker: CircuitBreakerEventEmitter;
        if (this.circuitBreakerByHandler.has(methodRef)) {
            circuitBreaker = this.circuitBreakerByHandler.get(methodRef);
        } else {
            circuitBreaker = new CircuitBreakerEventEmitter(opciones);
            this.circuitBreakerByHandler.set(methodRef, circuitBreaker);
        }

        return circuitBreaker.exec(next).pipe(
            catchError(() => {
                return throwError(
                    () =>
                        new HttpException(
                            'Internal server error',
                            HttpStatus.INTERNAL_SERVER_ERROR,
                        ),
                );
            }),
        );
    }
}