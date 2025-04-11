import { ApiProperty } from '@nestjs/swagger';

export class CircuitBreakerResponseDto {
  @ApiProperty({ description: 'Service health status' })
  status: string;
}
