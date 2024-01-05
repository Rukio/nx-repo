import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CompanionLink,
  CompanionTaskStatusName,
  CompanionTaskType,
} from '@prisma/client';
import { format } from 'date-fns';
import { Logger } from 'winston';
import { CareRequestRepository } from '../care-request/care-request.repository';
import { SmsService } from '../communications/sms.service';
import { DashboardWebhookCareRequest } from '../dashboard/types/dashboard-care-request';
import { SELF_PAY_COMPANY_NAME } from '../dashboard/types/dashboard-insurance';
import { DatabaseService } from '../database/database.service';
import { IdentificationRepository } from '../identification/identification.repository';
import { InsurancesRepository } from '../insurances/insurances.repository';
import { InjectLogger } from '../logger/logger.decorator';
import { TasksRepository } from '../tasks/tasks.repository';
import { CompanionInfoDto } from './dto/companion-info.dto';
import { CompanionLinkWithTasks } from './interfaces/companion-link.interface';
import { DashboardService } from '../dashboard/dashboard.service';
import {
  InsuranceImageTaskMetadata,
  PcpTaskMetadata,
} from '../tasks/models/companion-task';
import { PharmaciesRepository } from '../pharmacies/pharmacies.repository';
import { PcpRepository } from '../pcp/pcp.repository';
import { CompanionLinkAnalytics } from './dto/companion-link-analytics.dto';
import { ConsentsRepository } from '../consents/consents.repository';
import { ConsentType } from '../consents/dto/consent.dto';
import { StatsigUser } from 'statsig-node';
import { CareRequestStatusText } from '../care-request/enums/care-request-status.enum';
import { getRequiredEnvironmentVariable, timeBetween } from '../utility/utils';
import { CareRequestDto } from '../care-request/dto/care-request.dto';
import { DUMMY_USER_ID, StatsigService } from '@*company-data-covered*/nest-statsig';
import { SocialHistoryRepository } from '../social-history/social-history.repository';
import { QuestionTag } from '../social-history/dto/question-answer.dto';
import {
  SocialHistory,
  SocialHistoryQuestion,
} from '../dashboard/types/social-history';
import {
  SOCIAL_HISTORY_TEMPLATE_ID,
  VALID_NO_ANSWER,
  VALID_YES_ANSWER,
} from '../social-history/common';
import { Priority } from '../dashboard/types/priority';
import { CareTeamEtaDto } from './dto/care-team-eta-dto';
import { JobsService } from '../jobs/jobs.service';
import { DashboardWebhookDtoV2 } from './dto/dashboard-webhook-v2.dto';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';
import { MessageType } from '../communications/enums/message-type.enum';

@Injectable()
export class CompanionService {
  private companionUrl: string;
  private maxAuthAttempts: number;
  private companionTwilioFlowSid: string;

  constructor(
    private dashboard: DashboardService,
    private database: DatabaseService,
    private careRequestRepository: CareRequestRepository,
    private identificationRepository: IdentificationRepository,
    private insurancesRepository: InsurancesRepository,
    private tasksRepository: TasksRepository,
    private pharmaciesRepository: PharmaciesRepository,
    private pcpRepository: PcpRepository,
    private consentsRepository: ConsentsRepository,
    private smsService: SmsService,
    private socialHistoryRepository: SocialHistoryRepository,
    config: ConfigService,
    private segment: SegmentService,
    private statsig: StatsigService,
    @InjectLogger() private logger: Logger,
    private jobs: JobsService
  ) {
    const companionUrlKey = 'COMPANION_URL';
    const companionUrl = getRequiredEnvironmentVariable(
      companionUrlKey,
      config
    );

    this.companionUrl = companionUrl;

    const maxAuthAttemptsKey = 'COMPANION_MAX_AUTH_ATTEMPTS';

    this.maxAuthAttempts = config.get(maxAuthAttemptsKey, 25);

    const companionTwilioFlowSidKey = 'TWILIO_COMPANION_FLOW_SID';
    const companionTwilioFlowSid = getRequiredEnvironmentVariable(
      companionTwilioFlowSidKey,
      config
    );

    this.companionTwilioFlowSid = companionTwilioFlowSid;
  }

  /**
   * Adds a entry to the companion link table that is associated to a care request ID.
   *
   * @param createCompanionDto The information necessary to create a companion link.
   * @returns The ID of the generated companion link.
   */
  async createCompanionLink(
    createCompanionDto: DashboardWebhookCareRequest
  ): Promise<string> {
    const careRequestId = createCompanionDto.external_id;
    const existingLink = await this.findLinkByCareRequestId(careRequestId);

    if (existingLink) {
      this.logger.debug(`Companion link already exists for care request.`, {
        careRequestId: careRequestId,
      });

      return existingLink.id;
    }

    this.logger.debug(`Creating companion link for care request.`, {
      careRequestId: careRequestId,
    });

    const identificationUploadStatus =
      await this.checkIdentificationUploadStatus(careRequestId);

    this.logger.debug(
      `identificationUploadStatus on companion link creation.`,
      {
        careRequestId,
        identificationUploadStatus,
      }
    );

    const insuranceUploadStatus = await this.checkInsuranceUploadStatus(
      careRequestId
    );

    this.logger.debug(`insuranceUploadStatus on companion link creation.`, {
      careRequestId,
      insuranceUploadStatus,
    });

    const defaultPharmacyStatus = await this.checkDefaultPharmacyStatus(
      careRequestId
    );

    this.logger.debug(`defaultPharmacyStatus on companion link creation.`, {
      careRequestId,
      defaultPharmacyStatus,
    });

    const primaryCareProviderStatus = await this.checkPrimaryCareProviderStatus(
      careRequestId
    );

    this.logger.debug(`primaryCareProviderStatus on companion link creation.`, {
      careRequestId,
      primaryCareProviderStatus,
    });

    const medicationHistoryConsentStatus =
      await this.checkMedicationHistoryConsentStatus(careRequestId);

    this.logger.debug(
      `medicationHistoryConsentStatus on companion link creation.`,
      {
        careRequestId,
        medicationHistoryConsentStatus,
      }
    );

    const link = await this.database.companionLink.create({
      data: {
        careRequestId,
        tasks: {
          create: [
            {
              type: CompanionTaskType.IDENTIFICATION_IMAGE,
              statuses: {
                create: {
                  name: identificationUploadStatus,
                },
              },
            },
            {
              type: CompanionTaskType.INSURANCE_CARD_IMAGES,
              metadata: insuranceUploadStatus.metadata,
              statuses: {
                create: {
                  name: insuranceUploadStatus.overallStatus,
                },
              },
            },
            {
              type: CompanionTaskType.DEFAULT_PHARMACY,
              statuses: {
                create: {
                  name: defaultPharmacyStatus,
                },
              },
            },
            {
              type: CompanionTaskType.PRIMARY_CARE_PROVIDER,
              metadata: primaryCareProviderStatus.metadata ?? undefined,
              statuses: {
                create: {
                  name: primaryCareProviderStatus.overallStatus,
                },
              },
            },
            {
              type: CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY,
              statuses: {
                create: {
                  name: medicationHistoryConsentStatus,
                },
              },
            },
            {
              type: CompanionTaskType.CONSENTS,
              metadata: {
                completedDefinitionIds: [],
              },
              statuses: {
                create: {
                  name: CompanionTaskStatusName.NOT_STARTED,
                },
              },
            },
          ],
        },
      },
      include: {
        tasks: {
          include: {
            statuses: true,
          },
        },
      },
    });

    this.segment.track<CompanionSegmentEventTrackParams>({
      anonymousId: link.id,
      event: COMPANION_SEGMENT_EVENTS.LINK_CREATED,
      properties: {
        careRequestId,
      },
    });

    await this.sendCompanionLinkCreatedNotification(
      createCompanionDto.external_id,
      link.id
    );
    const runningLateSmsGate = await this.jobs.checkRunningLateSmsGate();

    if (runningLateSmsGate) {
      await this.jobs.queueRunningLateSmsJob(careRequestId);
    }

    return link.id;
  }

  /** Retrieves a companion link by ID. */
  async findLinkById(id: string): Promise<CompanionLinkWithTasks | null> {
    return this.database.companionLink.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            statuses: true,
          },
        },
      },
    });
  }

  /** Retrieves a companion link with tasks by care Request ID. */
  async findLinkByCareRequestId(
    careRequestId: number
  ): Promise<CompanionLinkWithTasks | null> {
    return this.database.companionLink.findUnique({
      where: { careRequestId },
      include: {
        tasks: {
          include: {
            statuses: true,
          },
        },
      },
    });
  }

  async updateInvalidAuthCount(
    id: string,
    newCount: number
  ): Promise<boolean | null> {
    const result = await this.database.companionLink.update({
      where: {
        id: id,
      },
      data: {
        invalidAuthCount: newCount,
        lastInvalidAuth: new Date(),
      },
    });

    return result !== null;
  }

  async updateBlockedStatus(
    id: string,
    newStatus: boolean
  ): Promise<boolean | null> {
    const result = await this.database.companionLink.update({
      where: {
        id: id,
      },
      data: {
        isBlocked: newStatus,
      },
    });

    return result !== null;
  }

  async isCompanionLinkAuthBlocked(
    link: CompanionLink
  ): Promise<boolean | null> {
    if (link.isBlocked) {
      return true;
    }
    if (link.invalidAuthCount >= this.maxAuthAttempts) {
      await this.updateBlockedStatus(link.id, true);

      return true;
    }

    return false;
  }

  /** Retrieves the information required to display in the companion experience. */
  async getCompanionInfoByCareRequestLink(
    link: CompanionLinkWithTasks
  ): Promise<CompanionInfoDto> {
    this.logger.debug(`Retrieving companion info for care request.`, {
      careRequestId: link.careRequestId,
    });

    const careRequest = await this.careRequestRepository.getById(
      link.careRequestId
    );

    if (!careRequest) {
      throw new Error(`Care request not found with provided ID.`);
    }

    const isLV1 = await this.isLV1(careRequest.market.shortName);

    return CompanionInfoDto.fromCareRequest(careRequest, link.tasks, isLV1);
  }

  /** Retrieves the care team ETA to display in the companion experience. */
  async getCareTeamEta(link: CompanionLinkWithTasks): Promise<CareTeamEtaDto> {
    this.logger.debug(`Retrieving care team ETA for care request.`, {
      careRequestId: link.careRequestId,
    });

    const careRequest = await this.careRequestRepository.getByIdWithError(
      link.careRequestId
    );

    return this.dashboard.getCareTeamEta(careRequest.id);
  }

  private async isLV1(marketShortName: string) {
    const statsigUser: StatsigUser = { userID: DUMMY_USER_ID };
    const launchedLV1MarketsConfig = await this.statsig.getConfig(
      statsigUser,
      'lv1_launched_markets'
    );

    const launchedLv1Markets: string[] | unknown = launchedLV1MarketsConfig.get(
      'lv1_launched_markets',
      []
    );

    return (
      Array.isArray(launchedLv1Markets) &&
      launchedLv1Markets.includes(marketShortName)
    );
  }

  /** Retrieves the information required to display in the companion experience. */
  async getAnalyticsInfo(
    link: CompanionLinkWithTasks
  ): Promise<CompanionLinkAnalytics> {
    const careRequest = await this.careRequestRepository.getById(
      link.careRequestId
    );

    if (!careRequest) {
      throw new NotFoundException(`Care request not found with provided ID.`);
    }

    return {
      statsigCareRequestId: careRequest.statsigCareRequestId,
    };
  }

  /** Handles sending notifications through all communication channels. */
  async sendCompanionLinkCreatedNotification(
    careRequestId: number,
    linkId: string
  ): Promise<void> {
    const link = await this.findLinkById(linkId);

    if (!link?.createdNotificationSent) {
      this.logger.debug(`Sending companion communications for care request.`, {
        careRequestId,
      });

      const careRequest = await this.careRequestRepository.getById(
        careRequestId
      );

      if (!careRequest) {
        throw new NotFoundException('Care request with that ID not found');
      }

      let appointmentDate: Date | undefined;
      let appointmentDateString: string | undefined;

      if (careRequest.appointmentSlot?.startTime) {
        appointmentDate = new Date(careRequest.appointmentSlot.startTime);
      } else if (careRequest.assignmentDate) {
        appointmentDate = new Date(careRequest.assignmentDate);
      }

      if (appointmentDate) {
        const dateFormat = 'iiii, MMMM d'; // Friday, September 22

        appointmentDateString = format(appointmentDate, dateFormat);
      } else {
        this.logger.error(
          `Sending companion communications for care request without appointment slot.`,
          { careRequestId }
        );
      }

      const url = this.buildLinkUrl(linkId);

      const flowParameters: Record<string, string> = {
        url: url,
        status: CareRequestStatusText.Accepted,
        messageType: MessageType.CompanionLinkSms,
      };

      if (appointmentDateString) {
        flowParameters['date'] = appointmentDateString;
      }
      await this.smsService.executeFlow(
        this.companionTwilioFlowSid,
        careRequest.caller.origin_phone,
        flowParameters
      );

      this.segment.track<CompanionSegmentEventTrackParams>({
        anonymousId: linkId,
        event: COMPANION_SEGMENT_EVENTS.SMS_SENT,
        properties: {
          trigger: CareRequestStatusText.Accepted,
          careRequestId: careRequest.id,
        },
      });

      await this.database.companionLink.update({
        where: { id: linkId },
        data: { createdNotificationSent: true },
      });
    }
  }

  async onCareRequestOnScene(careRequestId: number): Promise<void> {
    try {
      await this.logTaskCompletionMetrics(careRequestId);
    } catch (error) {
      this.logger.error(`Unable to log task completion metrics.`, {
        careRequestId,
      });
    }
  }

  async onCareRequestOnRoute(careRequestId: number): Promise<void> {
    try {
      await this.sendCareTeamOnRouteNotification(careRequestId);
      await this.createNoteForCareRequest(careRequestId);
    } catch (error) {
      throw new InternalServerErrorException({
        message: `Failed to execute CareRequestStatusText.OnRoute handler: ${error}`,
        careRequestId: careRequestId,
      });
    }
  }

  async sendCareTeamOnRouteNotification(careRequestId: number): Promise<void> {
    try {
      await this.jobs.removeRunningLateSmsJob(careRequestId);
    } catch (error) {
      this.logger.error(
        `Failed to cancel Running Late SMS Job for ${careRequestId} during On Route workflow.`,
        error
      );
    }

    const loggerMetadata: Record<string, unknown> = {
      careRequestId,
    };

    this.logger.debug(
      `Sending care team on route notification for care request.`,
      loggerMetadata
    );

    const link = await this.findLinkByCareRequestId(careRequestId);

    if (!link) {
      throw new NotFoundException(
        'Could not find an existing link for that Care request'
      );
    }

    loggerMetadata.linkId = link.id;

    if (!link.onRouteNotificationSent) {
      const careRequest = await this.careRequestRepository.getByIdWithError(
        careRequestId
      );

      if (careRequest.patient?.voicemailConsent) {
        const url = this.buildLinkUrl(link.id);

        const flowSid = this.companionTwilioFlowSid;

        const flowParameters = {
          status: CareRequestStatusText.OnRoute,
          url,
          pendingTaskText: await this.getPendingTaskText(link, careRequest),
          messageType: MessageType.OnRouteSms,
        };

        await this.smsService.executeFlow(
          flowSid,
          careRequest.caller.origin_phone,
          flowParameters
        );

        await this.database.companionLink.update({
          where: { id: link.id },
          data: { onRouteNotificationSent: true },
        });

        this.logger.debug(
          `On-route notification executed successfully.`,
          loggerMetadata
        );

        this.segment.track<CompanionSegmentEventTrackParams>({
          anonymousId: link.id,
          event: COMPANION_SEGMENT_EVENTS.SMS_SENT,
          properties: {
            trigger: CareRequestStatusText.OnRoute,
            careRequestId: careRequest.id,
          },
        });
      } else {
        this.logger.debug(
          `Patient's voicemail consent is false!`,
          loggerMetadata
        );
      }
    } else {
      this.logger.debug('On route notification already sent!', loggerMetadata);
    }
  }

  async handleEtaRangeEvent(careRequestData: DashboardWebhookDtoV2) {
    const careRequestId = careRequestData.care_request_id;
    const requestStatus = careRequestData.request_status;
    const link = await this.findLinkByCareRequestId(careRequestId);

    if (link) {
      switch (requestStatus as CareRequestStatusText) {
        case CareRequestStatusText.Accepted:
        case CareRequestStatusText.Committed:
        case CareRequestStatusText.Scheduled:
        case CareRequestStatusText.Requested:
          await this.jobs.updateRunningLateSmsJob(careRequestId);

          return;
        default:
          await this.jobs.removeRunningLateSmsJob(careRequestId);

          return;
      }
    } else {
      this.jobs.removeRunningLateSmsJob(careRequestId);
    }
  }

  private async getPendingTaskText(
    link: CompanionLinkWithTasks,
    careRequest: CareRequestDto
  ): Promise<string> {
    let pendingTasks: CompanionTaskType[] = [];

    for (const task of link.tasks) {
      if (pendingTasks.length > 2) {
        break;
      }
      task.statuses.sort(
        (status1, status2) =>
          status1.createdAt.getTime() - status2.createdAt.getTime()
      );
      const taskStatusName = task.statuses[task.statuses.length - 1].name;

      if (taskStatusName != CompanionTaskStatusName.COMPLETED) {
        pendingTasks.push(task.type);
      }
    }

    if (
      pendingTasks.includes(CompanionTaskType.CONSENTS) ||
      pendingTasks.includes(
        CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY
      )
    ) {
      const experiment = await this.getConsentsModuleExperiment(
        link,
        careRequest
      );
      const consentsModuleEnabled = experiment.get('enabled', false);

      if (consentsModuleEnabled) {
        pendingTasks = pendingTasks.filter(
          (t) => t !== CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY
        );
      } else {
        pendingTasks = pendingTasks.filter(
          (t) => t !== CompanionTaskType.CONSENTS
        );
      }
    }

    const taskNameMap: Record<CompanionTaskType, string> = {
      [CompanionTaskType.IDENTIFICATION_IMAGE]: 'ID',
      [CompanionTaskType.INSURANCE_CARD_IMAGES]: 'insurance card',
      [CompanionTaskType.DEFAULT_PHARMACY]: 'pharmacy',
      [CompanionTaskType.PRIMARY_CARE_PROVIDER]: 'primary care provider',
      [CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY]: 'medications',
      [CompanionTaskType.CONSENTS]: 'consents',
    };
    let message = '';

    switch (pendingTasks.length) {
      case 0:
        break;
      case 1:
        message = taskNameMap[pendingTasks[0]];
        break;
      case 2: {
        const task1 = taskNameMap[pendingTasks[0]];
        const task2 = taskNameMap[pendingTasks[1]];

        message = `${task1} and ${task2}`;
        break;
      }
      default:
        message = 'required information';
    }

    return message;
  }

  private async getConsentsModuleExperiment(
    link: CompanionLinkWithTasks,
    careRequest: CareRequestDto
  ) {
    return this.statsig.getExperiment(
      this.buildStatsigUser(careRequest.statsigCareRequestId, link.id),
      'companion_experience_consents_module'
    );
  }

  /** Builds the URL for the given link ID. */
  private buildLinkUrl(linkId: string): string {
    return new URL(`${this.companionUrl}/${linkId}`).toString();
  }

  private async checkIdentificationUploadStatus(
    careRequestId: number
  ): Promise<CompanionTaskStatusName> {
    let result: CompanionTaskStatusName;

    try {
      const driversLicense =
        await this.identificationRepository.getDriversLicenseByCareRequestId(
          careRequestId
        );

      result =
        driversLicense === null
          ? CompanionTaskStatusName.NOT_STARTED
          : CompanionTaskStatusName.COMPLETED;
    } catch (error) {
      result = CompanionTaskStatusName.NOT_STARTED;
    }

    return result;
  }

  private async checkInsuranceUploadStatus(careRequestId: number): Promise<{
    overallStatus: CompanionTaskStatusName;
    metadata: InsuranceImageTaskMetadata;
  }> {
    let metadata: InsuranceImageTaskMetadata;
    let overallStatus: CompanionTaskStatusName;

    try {
      const insurances =
        await this.insurancesRepository.getPatientInsurancesByCareRequestId(
          careRequestId
        );

      metadata = { insuranceStatuses: {} };
      for (const insurance of insurances) {
        const isSelfPay = insurance.company_name === SELF_PAY_COMPANY_NAME;

        metadata.insuranceStatuses[insurance.priority] =
          isSelfPay || (insurance.card_back?.url && insurance.card_front?.url)
            ? CompanionTaskStatusName.COMPLETED
            : CompanionTaskStatusName.NOT_STARTED;
      }

      overallStatus = this.computeInsuranceTaskStatus(metadata);
    } catch (error) {
      overallStatus = CompanionTaskStatusName.COMPLETED;
      metadata = { insuranceStatuses: {} };
    }

    return { overallStatus, metadata };
  }

  private async checkDefaultPharmacyStatus(
    careRequestId: number
  ): Promise<CompanionTaskStatusName> {
    try {
      const pharmacy =
        await this.pharmaciesRepository.getDefaultPharmacyByCareRequestId(
          careRequestId
        );

      if (!pharmacy) {
        return CompanionTaskStatusName.NOT_STARTED;
      }

      return CompanionTaskStatusName.COMPLETED;
    } catch (error) {
      return CompanionTaskStatusName.NOT_STARTED;
    }
  }

  private async checkPrimaryCareProviderStatus(careRequestId: number): Promise<{
    overallStatus: CompanionTaskStatusName;
    metadata: PcpTaskMetadata;
  }> {
    const metadata: PcpTaskMetadata = { socialHistoryResponses: {} };

    try {
      const socialHistory: SocialHistory =
        await this.socialHistoryRepository.getPatientSocialHistory(
          careRequestId
        );

      if (socialHistory && socialHistory.questions?.length) {
        const hasPcpKey = await this.getQuestionKeyFromStatsig(
          QuestionTag.HAS_PCP
        );

        const hasPcpAnswer = this.normalizedSocialHistoryBooleanAnswer(
          hasPcpKey,
          socialHistory.questions
        );

        const seenPcpRecentlyKey = await this.getQuestionKeyFromStatsig(
          QuestionTag.HAS_SEEN_PCP_RECENTLY
        );

        const seenPcpRecentlyAnswer = this.normalizedSocialHistoryBooleanAnswer(
          seenPcpRecentlyKey,
          socialHistory.questions
        );

        if (hasPcpAnswer !== undefined) {
          metadata.socialHistoryResponses[QuestionTag.HAS_PCP] = hasPcpAnswer;
        }

        if (seenPcpRecentlyAnswer !== undefined) {
          metadata.socialHistoryResponses[QuestionTag.HAS_SEEN_PCP_RECENTLY] =
            seenPcpRecentlyAnswer;
        }
      }

      const pcpClinicalProviderId =
        await this.pcpRepository.getPrimaryCareProviderEhrIdByCareRequestId(
          careRequestId
        );

      if (pcpClinicalProviderId) {
        metadata.clinicalProviderId = pcpClinicalProviderId;
      }
    } catch (error) {
      metadata.socialHistoryResponses = {};
    }

    const overallStatus: CompanionTaskStatusName =
      await this.tasksRepository.getPcpTaskStatusFromMetadata(metadata);

    return { overallStatus, metadata };
  }

  private async getQuestionKeyFromStatsig(questionTag: QuestionTag) {
    const questionKey = await this.socialHistoryRepository.getQuestionKey(
      questionTag
    );

    if (typeof questionKey !== 'string') {
      throw new Error(
        `Question key for ${questionTag} does not return a string`
      );
    }

    return questionKey;
  }

  /**
   * If the answer is 'Y', returns true.
   *
   * If the answer is 'N', returns false.
   *
   * If the answer is anything else, returns undefined.
   */
  private normalizedSocialHistoryBooleanAnswer(
    questionKey: string,
    questions: SocialHistoryQuestion[]
  ) {
    const question = questions.find((q) => {
      return (
        q.key === questionKey && q.templateid === SOCIAL_HISTORY_TEMPLATE_ID
      );
    });

    switch (question?.answer) {
      case VALID_YES_ANSWER:
        return true;
      case VALID_NO_ANSWER:
        return false;
      default:
        return undefined;
    }
  }

  private async checkMedicationHistoryConsentStatus(
    careRequestId: number
  ): Promise<CompanionTaskStatusName> {
    try {
      const consent = await this.consentsRepository.getConsentStatusByType(
        careRequestId,
        ConsentType.MEDICATION_HISTORY_AUTHORITY
      );

      if (!consent) {
        return CompanionTaskStatusName.NOT_STARTED;
      }

      return CompanionTaskStatusName.COMPLETED;
    } catch (error) {
      return CompanionTaskStatusName.NOT_STARTED;
    }
  }

  async markIdentificationUploaded(linkId: string) {
    const tasks = await this.tasksRepository.findTasks(
      linkId,
      CompanionTaskType.IDENTIFICATION_IMAGE
    );
    const task = tasks.pop();

    if (!task) {
      this.logger.error(
        `Driver's license uploaded without corresponding task!`,
        {
          companionLinkId: linkId,
        }
      );

      return;
    }

    await this.tasksRepository.updateTaskStatus(
      task,
      CompanionTaskStatusName.COMPLETED
    );
  }

  async markPharmacySet(linkId: string) {
    const tasks = await this.tasksRepository.findTasks(
      linkId,
      CompanionTaskType.DEFAULT_PHARMACY
    );
    const task = tasks.pop();

    if (!task) {
      this.logger.error(`Pharmacy set without corresponding task!`, {
        companionLinkId: linkId,
      });

      return;
    }

    await this.tasksRepository.updateTaskStatus(
      task,
      CompanionTaskStatusName.COMPLETED
    );
  }

  async markMedicationHistoryConsentApplied(linkId: string) {
    const tasks = await this.tasksRepository.findTasks(
      linkId,
      CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY
    );
    const task = tasks.pop();

    if (!task) {
      this.logger.error(
        `Medication history consent applied without corresponding task!`,
        {
          companionLinkId: linkId,
        }
      );

      return;
    }

    await this.tasksRepository.updateTaskStatus(
      task,
      CompanionTaskStatusName.COMPLETED
    );
  }

  async onInsuranceImageUploaded(linkId: string, priority: Priority) {
    const tasks = await this.tasksRepository.findTasks(
      linkId,
      CompanionTaskType.INSURANCE_CARD_IMAGES
    );
    const task = tasks.pop();

    if (!task) {
      this.logger.error(
        `Insurance images uploaded without corresponding task!`,
        {
          companionLinkId: linkId,
        }
      );

      return;
    }

    task.metadata = {
      ...task.metadata,
      insuranceStatuses: {
        ...task.metadata.insuranceStatuses,
        [priority]: CompanionTaskStatusName.COMPLETED,
      },
    };

    const overallStatus = this.computeInsuranceTaskStatus(task.metadata);

    // TODO: move this to task repo
    await this.database.companionTask.update({
      where: {
        id: task.id,
      },
      data: {
        metadata: task.metadata,
      },
    });

    return this.tasksRepository.updateTaskStatus(task, overallStatus);
  }

  async markPrimaryCareProviderSet(
    link: CompanionLinkWithTasks,
    clinicalProviderId: string
  ) {
    const { id: linkId } = link;
    const task = await this.tasksRepository.findTask(
      linkId,
      CompanionTaskType.PRIMARY_CARE_PROVIDER
    );

    if (!task) {
      this.logger.error(
        `Primary care provider set without corresponding task!`,
        {
          companionLinkId: linkId,
        }
      );

      return;
    }

    let newMetadata: PcpTaskMetadata = null;

    if (task.metadata !== null) {
      newMetadata = { ...task.metadata };
      newMetadata.clinicalProviderId = clinicalProviderId;
    }

    await this.tasksRepository.updateById(task.id, {
      data: { metadata: newMetadata ?? undefined },
    });

    const newStatus = await this.tasksRepository.getPcpTaskStatusFromMetadata(
      newMetadata
    );

    await this.tasksRepository.updateTaskStatus(task, newStatus);
  }

  async createNoteForCareRequest(careRequestId: number): Promise<void> {
    const existingLink = await this.findLinkByCareRequestId(careRequestId);

    if (!existingLink) {
      this.logger.debug(`Companion link does not exists for care request.`, {
        careRequestId: careRequestId,
      });

      return;
    }

    const careRequest = await this.careRequestRepository.getByIdWithError(
      careRequestId
    );

    await this.tasksRepository.upsertCompanionNoteMetadata(
      existingLink.id,
      careRequest
    );
  }

  private computeInsuranceTaskStatus(metadata: InsuranceImageTaskMetadata) {
    const statuses = Object.values(metadata.insuranceStatuses);
    const allComplete = statuses.every(
      (status) => status === CompanionTaskStatusName.COMPLETED
    );
    const allNotStarted = statuses.every(
      (status) => status === CompanionTaskStatusName.NOT_STARTED
    );

    let result: CompanionTaskStatusName;

    if (statuses.length === 0 || allComplete) {
      result = CompanionTaskStatusName.COMPLETED;
    } else if (allNotStarted) {
      result = CompanionTaskStatusName.NOT_STARTED;
    } else {
      result = CompanionTaskStatusName.STARTED;
    }

    return result;
  }

  private buildStatsigUser(
    careRequestStatsigId: string,
    linkId?: string
  ): StatsigUser {
    return {
      userID: linkId,
      customIDs: {
        careRequestID: careRequestStatsigId,
      },
    };
  }

  async logTaskCompletionMetrics(careRequestId: number) {
    const careRequest = await this.careRequestRepository.getByIdWithError(
      careRequestId
    );

    const link = await this.findLinkByCareRequestId(careRequestId);

    if (!link) {
      throw new NotFoundException(
        'Companion link associated with care request ID not found'
      );
    }

    const consentsModuleExperiment = await this.getConsentsModuleExperiment(
      link,
      careRequest
    );
    const consentsModuleEnabled = consentsModuleExperiment.get(
      'enabled',
      false
    );

    const eventName = 'task_completion_percentage_on_arrival';
    const statsigUser = this.buildStatsigUser(
      careRequest.statsigCareRequestId,
      link.id
    );
    const companionInfo = await this.getCompanionInfoByCareRequestLink(link);
    const metrics = this.taskCompletionMetrics(
      companionInfo,
      consentsModuleEnabled
    );

    if (!metrics) {
      return this.statsig.logEvent(
        statsigUser,
        eventName,
        'metrics unavailable'
      );
    }

    const { taskCompletionPercentage, ...metadata } = metrics;

    this.statsig.logEvent(statsigUser, eventName, taskCompletionPercentage, {
      careRequestId: careRequest.statsigCareRequestId.toString(),
      totalTaskCount: metadata.totalTaskCount.toString(),
      totalCompletedStatuses: metadata.totalCompletedStatuses.toString(),
      acceptedToOnRouteSeconds:
        metadata.acceptedToOnRouteSeconds?.toString() || '',
      acceptedToOnSceneSeconds:
        metadata.acceptedToOnSceneSeconds?.toString() || '',
    });
  }

  private taskCompletionMetrics(
    companionInfo: CompanionInfoDto,
    consentsModuleEnabled: boolean
  ) {
    const acceptedStatus = companionInfo.currentStates.find(
      (state) => state.name === CareRequestStatusText.Accepted
    );

    const onRouteStatus = companionInfo.currentStates.find(
      (state) => state.name === CareRequestStatusText.OnRoute
    );

    const onSceneStatus = companionInfo.currentStates.find(
      (state) => state.name === CareRequestStatusText.OnScene
    );

    const filteredCheckInTaskStatuses =
      companionInfo.checkInTaskStatuses.filter(
        (status) =>
          (consentsModuleEnabled &&
            status.type !==
              CompanionTaskType.CONSENT_MEDICATION_HISTORY_AUTHORITY) ||
          (!consentsModuleEnabled && status.type !== CompanionTaskType.CONSENTS)
      );

    const totalTaskCount = filteredCheckInTaskStatuses.length;

    if (!totalTaskCount) {
      return null;
    }

    const acceptedToOnRouteSeconds =
      acceptedStatus && onRouteStatus
        ? timeBetween(acceptedStatus.createdAt, onRouteStatus.createdAt)
        : null;

    const acceptedToOnSceneSeconds =
      acceptedStatus && onSceneStatus
        ? timeBetween(acceptedStatus.createdAt, onSceneStatus.createdAt)
        : null;

    const completedStatuses = filteredCheckInTaskStatuses.filter(
      (taskStatus) => {
        return (
          taskStatus.activeStatus.name === CompanionTaskStatusName.COMPLETED
        );
      }
    );

    const totalCompletedStatuses = completedStatuses.length;
    const taskCompletionPercentage = this.taskCompletionPercentage(
      totalTaskCount,
      totalCompletedStatuses
    );

    return {
      totalTaskCount,
      totalCompletedStatuses,
      taskCompletionPercentage,
      acceptedToOnRouteSeconds,
      acceptedToOnSceneSeconds,
    };
  }

  private taskCompletionPercentage(
    totalTaskCount: number,
    totalCompletedStatuses: number
  ) {
    return totalTaskCount
      ? (totalCompletedStatuses / totalTaskCount) * 100
      : 100;
  }
}
