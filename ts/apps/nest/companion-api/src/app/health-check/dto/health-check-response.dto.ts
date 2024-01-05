import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class HealthCheckResponseDto {
  @ApiProperty({
    description: `The git repositiory's SHA1 hash at the time of the latest commit.`,
    example: '29932f3915935d773dc8d52c292cadd81c81071d',
  })
  @IsString()
  GIT_SHA: string;

  @ApiProperty({
    description: `The result from the health check.`,
  })
  @IsObject()
  healthCheckResult: unknown;
}
