import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { ApiTagsText } from '../swagger';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';
import { HealthService } from './health.service';

@Controller()
@ApiTags(ApiTagsText.Health)
export class HealthCheckController {
  constructor(
    private healthService: HealthService,
    private config: ConfigService
  ) {}

  @Get('health-check')
  @HealthCheck()
  @ApiOperation({
    summary:
      'An endpoint to determine the overall health of the application by evaluating the health of all critical dependencies.',
  })
  async check(): Promise<HealthCheckResponseDto> {
    return this.handleHealthCheck(() => this.healthService.check());
  }

  @Get('liveness')
  @HealthCheck()
  @ApiOperation({
    summary: 'An endpoint to determine the health of only this application.',
  })
  async liveness(): Promise<HealthCheckResponseDto> {
    return this.handleHealthCheck(() => this.healthService.liveness());
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({
    summary:
      'An endpoint to determine the overall health of the application by evaluating the health of all critical dependencies.',
  })
  async readiness(): Promise<HealthCheckResponseDto> {
    return this.handleHealthCheck(() => this.healthService.readiness());
  }

  @Get('healthcheck')
  @HealthCheck()
  @ApiOperation({
    summary:
      'An endpoint to determine the health of only this application. This is used for Aptible health checks.',
  })
  async aptibleHealthCheck(): Promise<HealthCheckResponseDto> {
    return this.liveness();
  }

  private async handleHealthCheck(
    checkFunction: () => Promise<HealthCheckResult | undefined>
  ): Promise<HealthCheckResponseDto> {
    try {
      const result = await checkFunction();

      if (result?.status === 'error') {
        throw new ServiceUnavailableException();
      }

      return this.buildHealthCheckResponse(result);
    } catch (error) {
      throw new ServiceUnavailableException(
        this.buildHealthCheckResponse(error)
      );
    }
  }

  private buildHealthCheckResponse(result: unknown): HealthCheckResponseDto {
    const versionKey = 'GIT_SHA';
    const version = this.config.get(versionKey, 'unknown');

    return {
      [versionKey]: version,
      healthCheckResult: result,
    };
  }
}
