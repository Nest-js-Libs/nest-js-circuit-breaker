// Default configuration values for the CircuitBreaker
export const DEFAULT_SUCCESS_THRESHOLD = 3; // Number of successful requests before closing the circuit
export const DEFAULT_FAILURE_THRESHOLD = 3; // Number of failed requests before opening the circuit
export const DEFAULT_OPEN_TO_HALF_OPEN_WAIT_TIME = 60000; // Time to wait before trying to reset the circuit (in milliseconds)
