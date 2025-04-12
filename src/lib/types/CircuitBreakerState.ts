export enum CircuitBreakerState {
    Closed, // Requests are allowed
    Open, // Requests are blocked
    HalfOpen, // A trial period to determine if the service has recovered
}
