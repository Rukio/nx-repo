import {
  Controller,
  HttpCode,
  HttpStatus,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiOperation,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiGoneResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiTagsText } from '../swagger';
import { SocialHistoryRepository } from './social-history.repository';
import { QuestionAnswerDto } from './dto/question-answer.dto';
import { ApiCompanionLinkIdParam } from '../decorators/api-companion-link-param.decorator';
import { COMPANION_LINK_NOT_FOUND_ERROR_TEXT } from '../companion/common/companion.constants';
import { CompanionAuthGuard } from '../companion/companion-auth.guard';
import { TasksRepository } from '../tasks/tasks.repository';
import { Link } from '../companion/common';
import { CompanionLinkWithTasks } from '../companion/interfaces/companion-link.interface';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

@Controller()
@ApiTags(ApiTagsText.SocialHistory)
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiTooManyRequestsResponse({ description: 'API request limit exceeded' })
export class SocialHistoryController {
  constructor(
    private repository: SocialHistoryRepository,
    private taskRepository: TasksRepository,
    private segment: SegmentService
  ) {}

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCompanionLinkIdParam()
  @ApiOperation({
    summary: `Updates a patient's social history in Athena through Station.`,
  })
  @ApiNotFoundResponse({ description: COMPANION_LINK_NOT_FOUND_ERROR_TEXT })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  @ApiNoContentResponse({
    description: `Social history updated successfully.`,
  })
  @ApiGoneResponse({ description: `Link is blocked or expired.` })
  @UseGuards(CompanionAuthGuard)
  async updatePatientSocialHistory(
    @Link() link: CompanionLinkWithTasks,
    @Body() questionAnswer: QuestionAnswerDto
  ) {
    const questionKey = await this.repository.getQuestionKey(
      questionAnswer.questionTag
    );

    if (typeof questionKey !== 'string') {
      throw new Error(
        `Question key for ${questionAnswer.questionTag} does not return a string`
      );
    }

    try {
      await this.repository.updatePatientSocialHistory(
        link.careRequestId,
        questionKey,
        questionAnswer.answer
      );

      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.UPDATE_PATIENT_SOCIAL_HISTORY_SUCCESS,
        properties: {
          careRequestId: link.careRequestId,
          questionTag: questionAnswer.questionTag,
          questionKey: questionKey,
        },
      });

      await this.taskRepository.onSocialHistoryUpdate(link, questionAnswer);
    } catch (error) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: link.id,
        event: COMPANION_SEGMENT_EVENTS.UPDATE_PATIENT_SOCIAL_HISTORY_FAILED,
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
