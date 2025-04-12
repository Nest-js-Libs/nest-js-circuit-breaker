import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CircuitBreakerResponseDto } from './circuit-breaker.response.dto';
import { CircuitBreaker } from 'src/lib/decorators/circuit-breaker.decorator';

@ApiTags('Circuit Breaker Test')
@Controller('/circuit-breaker')
export class CircuitBreakerController {
  @CircuitBreaker({
    successThreshold: 3,
    openToHalfOpenWaitTime: 30000, // 30 seconds
    failureThreshold: 1,
    fallback: (status) => {
      console.log('Circuit breaker is open: ', status);
      throw new ServiceUnavailableException(
        'Circuit breaker is open. Please try again later.',
      );
    },
  })
  @Get('/test')
  public async testCircuitBreaker(): Promise<CircuitBreakerResponseDto> {
    // Simular latencia
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simular error aleatorio (50% de probabilidad)
    if (Math.random() < 0.5) {
      console.log('Error simulado');
      throw new Error('Service Failure');
    }

    // Respuesta exitosa
    return {
      status: 'ok',
    };
  }
}
