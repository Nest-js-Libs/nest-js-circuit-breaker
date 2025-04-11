import { CircuitState } from '../types/CircuitState';

export class CircuitBreakerOpenError extends Error {
  errorType = CircuitState.OPEN;
  statusCode = 503;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CircuitBreakerOpenError.prototype);
  }
}
