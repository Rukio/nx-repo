import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CareRequestAPIResponse,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import { Logger } from 'winston';
import { HttpServiceInterceptor } from '../common/interceptors/httpservice-interceptor';
import { ApiTagsText } from '../swagger';
import { UseValidationPipe } from '../decorators/validation-pipe.decorator';
import ChannelItemsService from './channel-items.service';
import ChannelItemDto from './dto/channel-item.dto';
import ChannelItemsQueryDto from './dto/channel-item-query.dto';
import { InjectLogger } from '../decorators/logger.decorator';
import ErrorResponse from '../common/error-response';
import { AuthGuard } from '@nestjs/passport';

@Controller('channel-items')
@UseGuards(AuthGuard('aob'))
@UseInterceptors(HttpServiceInterceptor)
@ApiTags(ApiTagsText.ChannelItems)
@ApiBearerAuth()
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
export default class ChannelItemsController {
  constructor(
    @InjectLogger() private logger: Logger,
    private readonly service: ChannelItemsService
  ) {}

  @Get('search')
  @ApiQuery({
    type: ChannelItemsQueryDto,
  })
  @ApiOperation({
    summary: 'Search for channel with/without market id',
  })
  @ApiResponse({
    type: ChannelItemDto,
    isArray: true,
  })
  @UseValidationPipe()
  async search(
    @Query() searchParams: ChannelItemsQueryDto
  ): Promise<CareRequestAPIResponse<ChannelItem[]>> {
    try {
      const data: ChannelItem[] = await this.service.search(searchParams);

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        `ChannelItemController error: ${error?.message}`,
        searchParams
      );

      return ErrorResponse(error);
    }
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'id of the channel item',
  })
  @ApiOperation({
    summary: 'Get channel item by id',
  })
  @ApiResponse({
    type: ChannelItemDto,
    isArray: false,
  })
  @UseValidationPipe()
  async fetch(
    @Param('id') id: string
  ): Promise<CareRequestAPIResponse<ChannelItem>> {
    try {
      const data: ChannelItem = await this.service.fetch(id);

      return { success: true, data };
    } catch (error) {
      this.logger.error(`ChannelItemController error: ${error?.message}`, id);

      return ErrorResponse(error);
    }
  }
}
