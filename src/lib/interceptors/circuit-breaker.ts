import { CallHandler, ServiceUnavailableException } from '@nestjs/common';
import { tap } from 'rxjs';
import { EventEmitter } from 'events';
import { CircuitBreakerState } from '../types/CircuitBreakerState';
import { CircuitBreakerOptions } from '../types/CircuitBreakerOptions';
import { DEFAULT_FAILURE_THRESHOLD, DEFAULT_OPEN_TO_HALF_OPEN_WAIT_TIME, DEFAULT_SUCCESS_THRESHOLD } from '../constants';

// CircuitBreakerEventEmitter class extending EventEmitter to handle events
export class CircuitBreakerEventEmitter extends EventEmitter {
    private state = CircuitBreakerState.Closed; // Initial state is Closed
    private failureCount = 0; // Count of consecutive failures
    private successCount = 0; // Count of consecutive successes
    private lastError: Error; // The last error encountered
    private nextAttempt: number; // Timestamp for the next attempt when in Open state
    private options: CircuitBreakerOptions; // Configuration options

    // Constructor to initialize the CircuitBreaker with options
    constructor(options: CircuitBreakerOptions = {}) {
        super();
        // Set options with default values if not provided
        this.options = {
            successThreshold: options.successThreshold || DEFAULT_SUCCESS_THRESHOLD,
            failureThreshold: options.failureThreshold || DEFAULT_FAILURE_THRESHOLD,
            openToHalfOpenWaitTime:
                options.openToHalfOpenWaitTime || DEFAULT_OPEN_TO_HALF_OPEN_WAIT_TIME,
            fallback:
                options.fallback ||
                ((status) => {
                    throw new ServiceUnavailableException('Circuit breaker is open. Please try again later.');
                }),
        };
    }

    // Method to handle request execution
    exec(next: CallHandler) {
        // Check if the circuit breaker is in Open state
        if (this.state === CircuitBreakerState.Open) {
            // If the next attempt time has not been reached, emit failure and use fallback
            if (this.nextAttempt > Date.now()) {
                this.emit('failure', this.lastError); // Emit failure event
                return this.options.fallback(this.state); // Execute fallback function with parameters
            }
            // Transition to HalfOpen state if the wait time has elapsed
            this.state = CircuitBreakerState.HalfOpen;
        }

        // Handle the request and monitor its success or failure
        return next.handle().pipe(
            tap({
                next: () => this.handleSuccess(), // Call handleSuccess on success
                error: (error) => this.handleError(error), // Call handleError on error
            }),
        );
    }

    // Method to handle successful request
    private handleSuccess() {
        this.failureCount = 0; // Reset failure count on success
        // If in HalfOpen state, increment success count
        if (this.state === CircuitBreakerState.HalfOpen) {
            this.successCount++;
            // If success count reaches the threshold, close the circuit
            if (this.successCount >= this.options.successThreshold) {
                this.successCount = 0;
                this.state = CircuitBreakerState.Closed;
                this.emit('closed'); // Emit closed event
            }
        }
        this.emit('success'); // Emit success event
    }

    // Method to handle failed request
    private handleError(err: Error) {
        this.failureCount++; // Increment failure count on error
        // If failure count reaches the threshold or in HalfOpen state, open the circuit
        if (
            this.failureCount >= this.options.failureThreshold ||
            this.state === CircuitBreakerState.HalfOpen
        ) {
            this.state = CircuitBreakerState.Open;
            this.lastError = err;
            this.nextAttempt = Date.now() + this.options.openToHalfOpenWaitTime;
            this.emit('open'); // Emit open event
        }
        this.emit('failure', err); // Emit failure event
    }
}