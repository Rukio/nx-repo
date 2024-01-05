import {
  Controller,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
  Post,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiGoneResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiTagsText } from '../swagger';
import { CompanionService } from '../companion/companion.service';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../companion/common/companion.constants';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { PcpRepository } from './pcp.repository';
import { PrimaryCareProviderDto } from './dto/pcp.dto';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { Link } from '../companion/common';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

@Controller()
@ApiTags(ApiTagsText.PCP)
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class PcpController {
  constructor(
    private repository: PcpRepository,
    private companionService: CompanionService,
    private segment: SegmentService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCompanionLinkIdParam()
  @ApiOperation({
    summary: `Adds/Updates Primary care provider (PCP) to Station which updates in Athena.`,
  })
  @ApiBody({
    type: PrimaryCareProviderDto,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiCreatedResponse({
    description: `Primary care provider set successfully.`,
  })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  async setPrimaryCareProvider(
    @Link() link: CompanionLinkWithTasks,
    @Body() pcp: PrimaryCareProviderDto
  ) {
    if (!pcp.clinicalProvider) {
      throw new BadRequestException('Primary care provider ID invalid.');
    }

    try {
      await this.repository.setPrimaryCareProvider(
        link.careRequestId,
        pcp.clinicalProvider
      );
      await this.companionService.markPrimaryCareProviderSet(
        link,
        pcp.clinicalProvider.id.toString()
      );

      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.SET_PCP_SUCCESS,
        properties: {
          careRequestId: link.careRequestId,
        },
      });
    } catch (error) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.SET_PCP_FAILED,
        properties: {
          careRequestId: link.careRequestId,
          errorName: error?.name,
          errorMessage: error?.message,
        },
      });
      throw error;
    }
  }
}
