import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Delete,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiGoneResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../companion/common/companion.constants';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { ApiTagsText } from '../swagger';
import { InsuranceImageUploadDto } from './dto/insurance-image-upload.dto';
import { InsurancesRepository } from './insurances.repository';
import { CompanionService } from '../companion/companion.service';
import { Priority } from '../dashboard/types/priority';
import {
  InsuranceCardType,
  REMOVE_CARD_FRONT,
  REMOVE_CARD_BACK,
  REMOVE_BOTH_CARDS,
} from './interfaces/insurance_card_type.interface';
import { Link } from '../companion/common';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

const ApiInsurancePriorityParam = () =>
  ApiParam({
    name: 'priority',
    description: `The sequence ID to indicate if insurance is primary, secondary, tertiary, etc.`,
  });

@Controller()
@ApiTags(ApiTagsText.Insurances)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class InsurancesController {
  constructor(
    private repository: InsurancesRepository,
    private companionService: CompanionService,
    private segment: SegmentService
  ) {}

  @Post('priority/:priority/images')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: `Uploads insurance card images to Dashboard which uploads to Athena.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiInsurancePriorityParam()
  @ApiBody({
    type: InsuranceImageUploadDto,
    description: `The necessary information to upload insurance card images. At least one of the images must be provided.`,
  })
  @ApiCreatedResponse({
    description: `Images uploaded successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cardFront', maxCount: 1 },
      { name: 'cardBack', maxCount: 1 },
    ])
  )
  async uploadImage(
    @Link() link: CompanionLinkWithTasks,
    @Param('priority') priority: Priority,
    @UploadedFiles()
    files: Record<keyof InsuranceImageUploadDto, Express.Multer.File[]>
  ) {
    const cardFrontFile = files?.cardFront?.at(0);
    const cardBackFile = files?.cardBack?.at(0);

    if (!cardFrontFile && !cardBackFile) {
      throw new BadRequestException(
        'Must include image for the front or back of the insurance card.'
      );
    }

    if (parseInt(priority) < 1 || parseInt(priority) > 2) {
      throw new BadRequestException('Priority must be 1 or 2');
    }

    const acceptedUploadMimeTypes = ['image/png', 'image/jpeg'];

    if (
      cardFrontFile &&
      !acceptedUploadMimeTypes.includes(cardFrontFile.mimetype)
    ) {
      throw new BadRequestException(
        `Card front image does not have an accepted MIME type. Received: ${
          cardFrontFile.mimetype
        }, Expected: ${acceptedUploadMimeTypes.join(', ')}`
      );
    }

    if (
      cardBackFile &&
      !acceptedUploadMimeTypes.includes(cardBackFile.mimetype)
    ) {
      throw new BadRequestException(
        `Card back image does not have an accepted MIME type. Received: ${
          cardBackFile.mimetype
        }, Expected: ${acceptedUploadMimeTypes.join(', ')}`
      );
    }

    try {
      await this.repository.uploadImagesByInsurancePriority(
        link.careRequestId,
        priority,
        cardFrontFile,
        cardBackFile
      );
      await this.companionService.onInsuranceImageUploaded(link.id, priority);
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.INSURANCE_UPLOAD_SUCCESS,
        properties: {
          careRequestId: link.careRequestId,
        },
      });
    } catch (error) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.INSURANCE_UPLOAD_FAILED,
        properties: {
          careRequestId: link.careRequestId,
          errorName: error?.name,
          errorMessage: error?.message,
        },
      });
      throw error;
    }
  }

  @Delete('priority/:priority/images')
  @ApiOperation({
    summary: `Deletes one or both insurance card images in Station.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiInsurancePriorityParam()
  @ApiQuery({ name: 'card_type', enum: InsuranceCardType })
  @ApiOkResponse({
    description: `Insurance card(s) deleted successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: `Not authenticated.` })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  async deleteImages(
    @Link() link: CompanionLinkWithTasks,
    @Param('priority') priority: Priority,
    @Query('card_type') cardType: InsuranceCardType
  ) {
    if (
      ![REMOVE_CARD_FRONT, REMOVE_CARD_BACK, REMOVE_BOTH_CARDS].includes(
        cardType
      )
    ) {
      throw new BadRequestException(
        `${cardType} is not a valid value. It only supports values such as 'remove_card_front', 'remove_card_back' or 'remove_both_cards'`
      );
    }

    await this.repository.deleteInsuranceImages(
      link.careRequestId,
      priority,
      cardType
    );
  }
}
