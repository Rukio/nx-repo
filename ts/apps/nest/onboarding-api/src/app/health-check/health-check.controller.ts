import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { ApiTagsText } from '../swagger';
import HealthCheckService from './health-check.service';

@Controller('health-check')
@ApiTags(ApiTagsText.HealthCheck)
export default class HealthCheckController {
  constructor(private healthCheckService: HealthCheckService) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary:
      'An endpoint to determine the overall health of the application by evaluating the health of all critical dependencies.',
  })
  async check() {
    try {
      const result = await this.healthCheckService.check();

      if (result?.status === 'error') {
        throw new ServiceUnavailableException();
      }

      return result;
    } catch (error) {
      throw new ServiceUnavailableException(error);
    }
  }
}
