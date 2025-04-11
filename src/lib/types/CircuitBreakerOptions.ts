export type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenTimeout: number;
  halfOpenSuccessThreshold: number;
  fallback: (...args: any[]) => any;
};
