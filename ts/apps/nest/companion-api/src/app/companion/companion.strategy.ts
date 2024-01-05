import {
  GoneException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as passportCustom from 'passport-custom';
import { Request } from 'express';
import { CompanionService } from './companion.service';
import { CompanionAuthenticationDto } from './dto/companion-authentication.dto';
import { ApiProperty } from '@nestjs/swagger';
import { InjectLogger } from '../logger/logger.decorator';
import { Logger } from 'winston';
import { CareRequestRepository } from '../care-request/care-request.repository';
import { CompanionLinkNotFoundException } from './common';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

/**
 * The expected request body for authentication requests to endpoints protected by
 * the companion passport strategy.
 */
export class CompanionAuthenticationRequestBody {
  @ApiProperty()
  data: CompanionAuthenticationDto;
}

/**
 * The expected request parameters for authentication requests to endpoints protected by
 * the companion passport strategy.
 */
type RequestParams = {
  linkId: string;
};

/** The model that is used to identify session users. */
export interface CompanionSessionUserModel {
  linkId: string;
  careRequestId: number;
}

/** The fully defined session request for Passport. */
export interface CompanionSessionExpressRequest
  extends Request<RequestParams, null, CompanionAuthenticationRequestBody> {
  user: CompanionSessionUserModel;
}

@Injectable()
export class CompanionStrategy extends PassportStrategy(
  passportCustom.Strategy,
  'companion'
) {
  constructor(
    private careRequestRepository: CareRequestRepository,
    private companion: CompanionService,
    private segment: SegmentService,
    @InjectLogger() private logger: Logger
  ) {
    super();
  }

  /**
   * Validates incoming companion requests to ensure that sessions are created.
   */
  async validate(
    req: CompanionSessionExpressRequest,
    done: passportCustom.VerifiedCallback
  ): Promise<void> {
    function handleUnauthorizedError(text: string) {
      return done(new UnauthorizedException(text));
    }

    function handleGoneError() {
      return done(new GoneException('Link has been disabled.'));
    }

    this.logger.debug('Authenticating incoming request.');

    const linkId = req.params.linkId;
    const link = await this.companion.findLinkById(linkId);

    if (!link) {
      this.logger.debug(`Link with ID equal to ${linkId} does not exist!`);
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: linkId,
        event: COMPANION_SEGMENT_EVENTS.LINK_NOTFOUND,
      });

      return done(new CompanionLinkNotFoundException());
    }

    const isBlocked = await this.companion.isCompanionLinkAuthBlocked(link);

    if (isBlocked) {
      this.logger.debug(`User has maxed out authentication attempts!`, {
        careRequestId: link.careRequestId,
        linkId: link.id,
      });

      return handleGoneError();
    }

    if (req.user && req.user.careRequestId === link.careRequestId) {
      this.logger.debug(
        `User already authenticated for care request with ID of ${link.careRequestId}`
      );

      return done(null, req.user);
    }

    this.logger.debug(`User not authenticated yet!`);

    const careRequest = await this.careRequestRepository.getById(
      link.careRequestId
    );

    if (!careRequest) {
      const message = `Care request with ID associated to link was not found!`;

      this.logger.debug(message, { linkId });

      return handleUnauthorizedError(message);
    }

    const providedDob = req.body.data?.dob;
    const providedDobMatches = careRequest.patient?.dob === providedDob;

    if (providedDob && providedDobMatches) {
      this.logger.debug(`Authenticated successfully!`);
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: linkId,
        event: COMPANION_SEGMENT_EVENTS.AUTHENTICATION_SUCCESS,
        properties: {
          careRequestId: careRequest.id,
        },
      });
      const user: CompanionSessionUserModel = {
        linkId,
        careRequestId: careRequest.id,
      };

      return done(null, user);
    } else if (providedDob && !providedDobMatches) {
      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: linkId,
        event: COMPANION_SEGMENT_EVENTS.AUTHENTICATION_FAILED,
        properties: {
          careRequestId: careRequest.id,
        },
      });
      link.invalidAuthCount += 1;
      await this.companion.updateInvalidAuthCount(
        link.id,
        link.invalidAuthCount
      );

      return handleUnauthorizedError(`Authentication failed.`);
    }

    return handleUnauthorizedError(
      `User not authenticated and did not include the correct authentication information.`
    );
  }
}
