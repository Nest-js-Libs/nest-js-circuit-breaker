import { CircuitState } from './CircuitState';

export type CircuitBreakerState = {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttempt: number;
};
