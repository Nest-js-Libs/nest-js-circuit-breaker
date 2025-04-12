# Circuit Breaker

# @nest-js/circuit-breaker

[![npm version](https://img.shields.io/npm/v/@nest-js/circuit-breaker.svg)](https://www.npmjs.com/package/@nest-js/circuit-breaker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Una implementación del patrón Circuit Breaker para NestJS que ayuda a manejar fallos en sistemas distribuidos, para evitar que las solicitudes se acumulen en un punto crítico.

## Instalación

```bash
npm install @nest-js/circuit-breaker
```
## Uso
```typescript
import { Module } from '@nestjs/common';
import { CircuitBreakerModule } from '@nest-js/circuit-breaker';
@Module({
  imports: [
    CircuitBreakerModule
  ]
})
export class AppModule {}
```

### Controlador
```typescript
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CircuitBreakerResponseDto } from './circuit-breaker.response.dto';
import { CircuitBreaker } from 'src/lib/decorators/circuit-breaker.decorator';

@ApiTags('Circuit Breaker Test')
@Controller('/circuit-breaker')
export class CircuitBreakerController {

  @CircuitBreaker({
    successThreshold: 3, // 3 respuestas exitosas para cerrar el circuito
    openToHalfOpenWaitTime: 30000, // 30 seconds
    failureThreshold: 1, // 1 respuesta fallida para abrir el circuito
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
```