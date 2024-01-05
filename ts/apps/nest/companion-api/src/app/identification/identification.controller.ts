import {
  BadRequestException,
  Controller,
  Delete,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../companion/common/companion.constants';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { ApiTagsText } from '../swagger';
import { IdentificationRepository } from './identification.repository';
import { IdentificationUploadDto } from './dto/identification-upload.dto';
import { CompanionService } from '../companion/companion.service';
import { Link } from '../companion/common';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

@Controller()
@ApiTags(ApiTagsText.Identification)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class IdentificationController {
  constructor(
    private repository: IdentificationRepository,
    private companionService: CompanionService,
    private segment: SegmentService
  ) {}

  @Post('/images')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: `Uploads identification image to Station which uploads to Athena.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiBody({ type: IdentificationUploadDto })
  @ApiCreatedResponse({
    description: `Image uploaded successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async uploadImage(
    @Link() link: CompanionLinkWithTasks,
    @UploadedFiles()
    files?: Record<keyof IdentificationUploadDto, Express.Multer.File[]>
  ) {
    const imageFile = files?.image?.at(0);

    if (!imageFile) {
      throw new BadRequestException('No image file found in request body.');
    }

    const acceptedUploadMimeTypes = ['image/png', 'image/jpeg'];

    if (!acceptedUploadMimeTypes.includes(imageFile.mimetype)) {
      throw new BadRequestException(
        `Image does not have an accepted mimetype. Received: ${
          imageFile.mimetype
        }, Expected: ${acceptedUploadMimeTypes.join(', ')}`
      );
    }

    try {
      await this.repository.uploadImageByCareRequestId(
        link.careRequestId,
        imageFile
      );
      await this.companionService.markIdentificationUploaded(link.id);

      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.DRIVER_LICENSE_UPLOAD_SUCCESS,
        properties: {
          careRequestId: link.careRequestId,
        },
      });
    } catch (error) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.DRIVER_LICENSE_UPLOAD_FAILED,
        properties: {
          careRequestId: link.careRequestId,
          errorName: error?.name,
          errorMessage: error?.message,
        },
      });
      throw error;
    }
  }

  @Delete()
  @ApiOperation({
    summary: `Deletes identification image from Station.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  async deleteByLinkId(@Link() link: CompanionLinkWithTasks) {
    await this.repository.deleteDriversLicenseByCareRequestId(
      link.careRequestId
    );
  }
}
