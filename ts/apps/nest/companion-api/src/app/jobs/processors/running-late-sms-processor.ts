import {
  Processor,
  Process,
  OnQueueFailed,
  OnQueueRemoved,
} from '@nestjs/bull';
import { Job } from 'bull';
import {
  RUNNING_LATE_SMS_QUEUE,
  RUNNING_LATE_STATUS,
  SEND_SMS_JOB_NAME,
} from '../common/jobs.constants';
import { RunningLateSmsJobData } from '../interfaces/jobs-running-late-sms.interface';
import { CareRequestRepository } from '../../care-request/care-request.repository';
import { SmsService } from '../../communications/sms.service';
import { ConfigService } from '@nestjs/config';
import { getRequiredEnvironmentVariable } from '../../utility/utils';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { JobsService } from '../jobs.service';
import { InjectLogger } from '../../logger/logger.decorator';
import { Logger } from 'winston';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { MessageType } from '../../communications/enums/message-type.enum';
import { MetricType } from '../../communications/enums/metric-type.enum';

@Processor(RUNNING_LATE_SMS_QUEUE)
export class RunningLateSmsProcessor {
  private runningLateTwilioFlowSid: string;

  constructor(
    config: ConfigService,
    private careRequestRepository: CareRequestRepository,
    private smsService: SmsService,
    private readonly jobsService: JobsService,
    private datadog: DatadogService,
    @InjectLogger() private logger: Logger
  ) {
    const runningLateTwilioFlowSidKey = 'TWILIO_COMPANION_FLOW_SID';
    const runningLateTwilioFlowSid = getRequiredEnvironmentVariable(
      runningLateTwilioFlowSidKey,
      config
    );

    this.runningLateTwilioFlowSid = runningLateTwilioFlowSid;
  }

  @Process(SEND_SMS_JOB_NAME)
  async sendSms(job: Job<RunningLateSmsJobData>) {
    const careRequestId = parseInt(job.data.careRequestId);
    const careRequest = await this.getCareRequestById(careRequestId);

    if (careRequest) {
      switch (careRequest.activeStatus.name) {
        case CareRequestStatusText.Accepted:
        case CareRequestStatusText.Committed: {
          const flowSid = this.runningLateTwilioFlowSid;
          const toNumber = careRequest.caller.origin_phone;
          const flowParameters = {
            status: RUNNING_LATE_STATUS,
            messageType: MessageType.RunningLateSms,
          };

          await this.smsService.executeFlow(flowSid, toNumber, flowParameters);
          this.logger.debug(`Running late SMS sent.`, careRequestId);

          await this.jobsService.createRunningLateSmsCareRequestNote(
            careRequestId
          );
          this.logger.debug(
            `Running late SMS sent note posted in CR timeline.`,
            careRequestId
          );

          this.datadog.increment(
            MetricType.CompanionCareRequestTimelineNotes,
            1,
            {
              messageType: MessageType.RunningLateNote,
              careRequestId: careRequestId.toString(),
            }
          );

          return;
        }

        default:
          this.logger.info(
            'Care Request status not approved for sending running late SMS.',
            {
              careRequestId: careRequestId,
              careRequestStatus: careRequest.activeStatus.name,
              jobId: job.id,
            }
          );
      }
    }
  }

  @OnQueueRemoved()
  async onQueueRemoved(job: Job<RunningLateSmsJobData>) {
    this.logger.info(`Removed ${job.name} Job from ${job.queue.name}:`, {
      jobId: job.id,
    });
  }

  @OnQueueFailed()
  async onQueueFailed(job: Job<RunningLateSmsJobData>) {
    this.logger.error(
      `Failed to process ${job.name} Job in ${job.queue.name}:`,
      {
        jobId: job.id,
        failedReason: job.failedReason,
      }
    );
  }

  private async getCareRequestById(
    careRequestId: number
  ): Promise<void | CareRequestDto> {
    try {
      return await this.careRequestRepository.getByIdWithError(careRequestId);
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Unable to fetch Care Request during RunningLateSmsProcessor Job execution. ${error.message}`;
      }
      throw error;
    }
  }
}
