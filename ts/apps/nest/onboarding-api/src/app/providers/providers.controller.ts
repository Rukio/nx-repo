import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  Post,
  Body,
} from '@nestjs/common';
import {
  CareRequestAPIResponse,
  Provider,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import ProvidersService from './providers.service';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import ProvidersQueryDto from './dto/providers-params.dto';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { InjectLogger } from '../decorators/logger.decorator';
import ProviderCallSearchParamsDto from './dto/providers-call-search.dto';
import ProvidersBodyDto from './dto/provider-search.dto';
import ErrorResponse from '../common/error-response';

@Controller('providers')
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.Providers)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class ProvidersController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: ProvidersService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of the all providers',
  })
  @ApiResponse({
    isArray: true,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchAll(
    @Query() searchParams?: ProvidersQueryDto
  ): Promise<CareRequestAPIResponse<Provider[]>> {
    try {
      const data: Provider[] = await this.service.fetchAll(searchParams);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `ProvidersController error: ${error?.message}`,
        searchParams
      );

      return ErrorResponse(error);
    }
  }

  @Get('/search')
  @ApiOperation({
    summary: 'search for provider',
  })
  @ApiResponse({
    isArray: true,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async searchScreeningProviders(
    @Query() params?: ProviderCallSearchParamsDto
  ): Promise<CareRequestAPIResponse<Provider>> {
    try {
      const data: Provider = await this.service.fetch(params);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`ProvidersController error: ${error?.message}`, params);

      return ErrorResponse(error);
    }
  }

  @Post('/name-search')
  @ApiOperation({
    summary: 'Get list of the all providers based on name',
  })
  @ApiResponse({
    isArray: true,
  })
  @UseValidationPipe()
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  async fetchByName(
    @Body() searchBody?: ProvidersBodyDto
  ): Promise<CareRequestAPIResponse<Provider[]>> {
    try {
      const data: Provider[] = await this.service.fetchByName(searchBody);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `ProvidersController error: ${error?.message}`,
        searchBody
      );

      return ErrorResponse(error);
    }
  }
}
