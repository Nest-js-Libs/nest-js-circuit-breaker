import { Observable } from "rxjs";

// Interface for the options that can be passed to configure the CircuitBreaker
export type CircuitBreakerOptions = {
    successThreshold?: number; // Optional: number of successful requests needed to close the circuit
    failureThreshold?: number; // Optional: number of failed requests needed to open the circuit
    openToHalfOpenWaitTime?: number; // Optional: wait time before moving from open to half-open state
    messageError?: string; // Optional: message to be returned when the circuit is open
    fallback?: (status?: any) => Observable<any> | any; // Optional: fallback function when the circuit is open
}
