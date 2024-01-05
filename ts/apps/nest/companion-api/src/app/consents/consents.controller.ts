import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiTooManyRequestsResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT, Link } from '../companion/common';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { CompanionService } from '../companion/companion.service';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { ApiTagsText } from '../swagger';
import { ConsentDefinitionsQueryDto } from './dto/consent-definitons-query-dto';
import { ConsentsRepository } from './consents.repository';
import { ConsentsService } from './consents.service';
import { SignedConsentDto, SignedConsentRequest } from './dto/consent.dto';
import { CreateCaptureDto } from './domain/capture';
import { TasksService } from '../tasks/tasks.service';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import {
  CompanionSegmentEventTrackParams,
  ConsentAppliedCommonProperties,
} from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

@Controller()
@ApiTags(ApiTagsText.Consents)
@ApiInternalServerErrorResponse({ description: 'Internal server error.' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded.' })
export class ConsentsController {
  constructor(
    private companionService: CompanionService,
    private consentsService: ConsentsService,
    private tasksService: TasksService,
    private consentsRepository: ConsentsRepository,
    private segment: SegmentService
  ) {}

  // TODO(PT-1347): Remove this endpoint after confirming it is no longer used
  @Post('signed-consents')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: `Endpoint for applying signed consents. (Deprecated)`,
    deprecated: true,
  })
  @ApiCompanionLinkIdParam()
  @ApiBody({
    type: SignedConsentRequest,
    description: `The necessary information to apply a signed consent.`,
  })
  @ApiCreatedResponse({
    description: `Consent applied successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async submitSignedConsent(
    @Link() link: CompanionLinkWithTasks,
    @Body(ValidationPipe) consentRequest: SignedConsentRequest
  ) {
    const consent = SignedConsentDto.fromSignedConsentRequest(consentRequest);

    const SegmentTrackProperties: ConsentAppliedCommonProperties = {
      careRequestId: link.careRequestId,
      consentType: consent.type,
      signedAt: consent.signature.signedAt,
      signerName: consent.signature.signerName,
      signerRelationToPatient: consent.signature.signerRelationToPatient,
    };

    try {
      await this.consentsRepository.applySignedConsent(
        link.careRequestId,
        consent
      );
      await this.companionService.markMedicationHistoryConsentApplied(link.id);
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.CONSENT_APPLIED_SUCCESS,
        properties: SegmentTrackProperties,
      });
    } catch (error) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.CONSENT_APPLIED_FAILED,
        properties: {
          ...SegmentTrackProperties,
          errorName: error?.name,
          errorMessage: error?.message,
        },
      });

      throw error;
    }
  }

  @Post('captures')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: `Endpoint for creating consent captures.`,
  })
  @ApiCompanionLinkIdParam()
  @ApiBody({
    type: CreateCaptureDto,
    description: `The necessary information to create a consent capture.`,
  })
  @ApiCreatedResponse({
    description: `Capture created successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'signatureImage', maxCount: 1 }])
  )
  async createConsentCapture(
    @Link() link: CompanionLinkWithTasks,
    @Body() { definitionId, signer }: Omit<CreateCaptureDto, 'signatureImage'>,
    @UploadedFiles()
    files: Partial<Record<'signatureImage', Express.Multer.File[]>>
  ) {
    const parsedDefinitionId = parseInt(definitionId, 10);
    const signatureFile = files.signatureImage?.at(0);

    if (!signatureFile) {
      throw new BadRequestException('Signature image is required.');
    }

    await this.consentsService.createCaptureForCompanionLink(
      link,
      parsedDefinitionId,
      signer,
      signatureFile
    );
    await this.tasksService.onConsentCaptured(link, parsedDefinitionId);
  }

  @Get('definitions')
  @UseGuards(CompanionAuthGuard)
  @ApiCompanionLinkIdParam()
  @ApiQuery({
    name: 'languageId',
    type: Number,
    required: false,
    example: 1,
    description: `Optional, defaults to English. Options can be pulled from '../consents/options' endpoint.`,
  })
  @ApiQuery({
    name: 'signerId',
    type: Number,
    required: true,
    example: 1,
    description: `The IDs of the signer types. Options can be pulled from '../consents/options' endpoint.`,
  })
  @ApiQuery({
    name: 'incomplete',
    type: Boolean,
    required: false,
    example: true,
    description: `If true, the returned definitions will be only those that need to be captured for this companion link. Defaults to false.`,
  })
  @ApiOperation({
    summary: `Endpoint for retrieving consent definitions for the given companion link.`,
  })
  @ApiOkResponse({
    description: `Consent definitions retrieved successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  async getDefinitions(
    @Link() link: CompanionLinkWithTasks,
    @Query() { incomplete, signerId }: ConsentDefinitionsQueryDto
  ) {
    return this.consentsService.getDefinitionsForCompanionLink(
      link,
      signerId,
      incomplete
    );
  }

  @Get('options')
  @UseGuards(CompanionAuthGuard)
  @ApiCompanionLinkIdParam()
  @ApiOperation({
    summary: `Endpoint for retrieving consent options for the given companion link.`,
  })
  @ApiOkResponse({
    description: `Consent options retrieved successfully.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  async getOptions() {
    return this.consentsRepository.getOptions();
  }
}
