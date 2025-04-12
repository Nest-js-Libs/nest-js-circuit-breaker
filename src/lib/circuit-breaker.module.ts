import { Global, Module } from '@nestjs/common';
import { CircuitBreakerController } from 'src/example/circuit-breaker.controller';
import { CircuitBreakerInterceptor } from './interceptors/circuit-breaker.interceptor';

@Global()
@Module({
  controllers: [CircuitBreakerController],
  providers: [CircuitBreakerInterceptor],
})
export class CircuitBreakerModule {}
