import { DynamicModule, Global, Module } from '@nestjs/common';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { CIRCUIT_BREAKER_OPTIONS } from './decorators/circuit-breaker.decorator';
import { CircuitBreakerFilter } from './filters/circuit-breaker.filter';
import { APP_FILTER } from '@nestjs/core';
import { CircuitBreakerController } from 'src/example/circuit-breaker.controller';

export interface CircuitBreakerModuleOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenTimeout: number;
}

@Global()
@Module({
  controllers: [CircuitBreakerController],
  providers: [
    CircuitBreakerService,
    {
      provide: APP_FILTER,
      useClass: CircuitBreakerFilter,
    },
  ],
})
export class CircuitBreakerModule {
  static register(options: CircuitBreakerModuleOptions): DynamicModule {
    return {
      module: CircuitBreakerModule,
      providers: [
        {
          provide: CIRCUIT_BREAKER_OPTIONS,
          useValue: options,
        },
        CircuitBreakerService,
        {
          provide: APP_FILTER,
          useClass: CircuitBreakerFilter,
        },
      ],
      exports: [CircuitBreakerService],
    };
  }
}
