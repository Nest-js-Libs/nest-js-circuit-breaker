import { Injectable } from '@nestjs/common';
import { CircuitBreakerOpenError } from '../errors/CircuitBreakerOpenError';
import { CircuitBreakerOptions } from '../types/CircuitBreakerOptions';
import { CircuitState } from '../types/CircuitState';

@Injectable()
export class CircuitBreakerService {
  private circuits: Map<
    string,
    {
      state: CircuitState;
      failures: number;
      lastFailureTime: number;
      successesInHalfOpen: number;
      options: CircuitBreakerOptions;
    }
  > = new Map();

  private defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    halfOpenSuccessThreshold: 2,
    halfOpenTimeout: 30000, // 30 seconds
    fallback: () => Promise.reject(new Error('Fallback function not provided')),
  };

  registerCircuit(
    circuitName: string,
    options: Partial<CircuitBreakerOptions> = {},
  ): void {
    const circuitOptions = { ...this.defaultOptions, ...options };
    this.circuits.set(circuitName, {
      state: CircuitState.CLOSED,
      failures: 0,
      lastFailureTime: 0,
      successesInHalfOpen: 0,
      options: {
        ...circuitOptions,
      },
    });
  }

  async executeWithCircuitBreaker<T>(
    circuitName: string,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    const circuit = this.circuits.get(circuitName);

    if (!circuit) {
      return fn();
    }

    // Check if circuit is OPEN
    if (circuit.state === CircuitState.OPEN) {
      const now = Date.now();
      const timeElapsed = now - circuit.lastFailureTime;

      if (timeElapsed >= circuit.options.resetTimeout) {
        // Transition to HALF_OPEN
        circuit.state = CircuitState.HALF_OPEN;
        circuit.successesInHalfOpen = 0;
      } else {
        throw new CircuitBreakerOpenError(`Circuit ${circuitName} is open`);
      }
    }

    try {
      const result = await fn();

      // Handle success
      if (circuit.state === CircuitState.HALF_OPEN) {
        circuit.successesInHalfOpen++;

        if (
          circuit.successesInHalfOpen >=
          circuit.options.halfOpenSuccessThreshold
        ) {
          circuit.state = CircuitState.CLOSED;
          circuit.failures = 0;
        }
      } else if (circuit.state === CircuitState.CLOSED) {
        circuit.failures = 0;
      }

      return result;
    } catch {
      // Handle failure
      circuit.failures++;
      circuit.lastFailureTime = Date.now();

      if (
        circuit.state === CircuitState.CLOSED &&
        circuit.failures >= circuit.options.failureThreshold
      ) {
        circuit.state = CircuitState.OPEN;
      }

      if (circuit.state === CircuitState.HALF_OPEN) {
        circuit.state = CircuitState.OPEN;
      }

      if (circuit.state === CircuitState.OPEN) {
        throw new CircuitBreakerOpenError(`Circuit ${circuitName} is open`);
      }
    }
  }

  getCircuitState(circuitName: string): CircuitState | undefined {
    return this.circuits.get(circuitName)?.state;
  }

  resetCircuit(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (circuit) {
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successesInHalfOpen = 0;
    }
  }
}
