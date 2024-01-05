import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CompanionService } from './companion.service';
import { differenceInSeconds } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import {
  COMPANION_LINK_EXPIRED_ERROR_TEXT,
  COMPANION_LINK_NOT_VALID_ERROR_TEXT,
} from './common/companion.constants';
import { CareRequestStatusText } from '../care-request/enums/care-request-status.enum';
import { CompanionLinkNotFoundException } from './common';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

/**Validates status and expiration of companion link */
@Injectable()
export class CompanionLinkStatusInterceptor implements NestInterceptor {
  private expirationSeconds: number;

  constructor(
    private readonly companionService: CompanionService,
    config: ConfigService,
    private segment: SegmentService
  ) {
    const EXPIRATION_SECONDS_KEY = 'COMPANION_LINK_TTL_SECONDS';

    this.expirationSeconds = config.get<number>(
      EXPIRATION_SECONDS_KEY,
      2592000
    );
    // ENV variable stores expiration in seconds, conversion is required for days
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<Response>> {
    const req = context.switchToHttp().getRequest();
    const linkId = req.params.linkId;

    // Check if link ID is present on parameters
    if (!linkId) {
      throw new BadRequestException(COMPANION_LINK_NOT_VALID_ERROR_TEXT);
    }

    // Retrieve link information from DB
    const link = await this.companionService.findLinkById(linkId);

    // Throw error if link cannot be found
    if (!link) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: linkId,
        event: COMPANION_SEGMENT_EVENTS.LINK_NOTFOUND,
      });
      throw new CompanionLinkNotFoundException();
    }

    // Verify care request expiration
    const today = new Date();
    const careRequestInfo =
      await this.companionService.getCompanionInfoByCareRequestLink(link);
    const completedStatus = careRequestInfo.currentStates
      .filter((val) => {
        return val.name === CareRequestStatusText.Complete;
      })
      .pop();
    const completedDateString =
      completedStatus !== undefined ? completedStatus.createdAt : undefined;
    const archivedStatus = careRequestInfo.currentStates
      .filter((val) => {
        return val.name === CareRequestStatusText.Archived;
      })
      .pop();
    const archivedDateString =
      archivedStatus !== undefined ? archivedStatus.createdAt : undefined;
    const linkCreationDate = link.created;

    if (
      completedDateString === undefined ||
      differenceInSeconds(today, Date.parse(completedDateString)) >
        this.expirationSeconds
    ) {
      if (
        archivedDateString === undefined ||
        differenceInSeconds(today, Date.parse(archivedDateString)) >
          this.expirationSeconds
      ) {
        if (
          differenceInSeconds(today, linkCreationDate) > this.expirationSeconds
        ) {
          const properties = {
            careRequestId: careRequestInfo.careRequestId,
            careRequestCompletedDate: completedDateString,
            careRequestArchivedDate: archivedDateString,
            companionLinkCreationDate: linkCreationDate.toISOString(),
          };

          this.segment.track<CompanionSegmentEventTrackParams>({
            anonymousId: linkId,
            event: COMPANION_SEGMENT_EVENTS.LINK_EXPIRED,
            properties,
          });
          throw new GoneException({
            message: COMPANION_LINK_EXPIRED_ERROR_TEXT,
            ...properties,
          });
        }
      }
    }
    req.body.careRequestInfo = careRequestInfo;

    return next.handle();
  }
}
