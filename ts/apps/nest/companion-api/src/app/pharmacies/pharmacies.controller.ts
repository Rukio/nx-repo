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
import { PharmaciesRepository } from './pharmacies.repository';
import { DefaultPharmacyDto } from './dto/default-pharmacy.dto';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../companion/common/companion.constants';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { Link } from '../companion/common';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

@Controller()
@ApiTags(ApiTagsText.Pharmacies)
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class PharmaciesController {
  constructor(
    private repository: PharmaciesRepository,
    private companionService: CompanionService,
    private segment: SegmentService
  ) {}

  @Post('/default')
  @HttpCode(HttpStatus.CREATED)
  @ApiCompanionLinkIdParam()
  @ApiOperation({
    summary: `Add/Updates a patient's default pharmacy to Station which updates in Athena.`,
  })
  @ApiBody({
    type: DefaultPharmacyDto,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiCreatedResponse({
    description: `Default pharmacy set successfully.`,
  })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  async setDefaultPharmacy(
    @Link() link: CompanionLinkWithTasks,
    @Body() pharmacy: DefaultPharmacyDto
  ) {
    if (!pharmacy.defaultPharmacy) {
      throw new BadRequestException('Default pharmacy invalid.');
    }

    try {
      await this.repository.setDefaultPharmacy(
        link.careRequestId,
        pharmacy.defaultPharmacy
      );
      await this.companionService.markPharmacySet(link.id);
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.SET_DEFAULT_PHARMACY_SUCCESS,
        properties: {
          careRequestId: link.careRequestId,
        },
      });
    } catch (error) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.SET_DEFAULT_PHARMACY_FAILED,
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
