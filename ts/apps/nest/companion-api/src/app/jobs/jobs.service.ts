import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { differenceInMilliseconds, isFuture, subMinutes } from 'date-fns';
import { Logger } from 'winston';
import { CareRequestRepository } from '../care-request/care-request.repository';
import { EtaRangeDto } from '../care-request/dto/eta-range.dto';
import {
  RUNNING_LATE_NOTE_TEXT,
  RUNNING_LATE_NOTE_TYPE,
  RUNNING_LATE_SMS_QUEUE,
  SEND_SMS_JOB_NAME,
} from './common/jobs.constants';
import { InjectLogger } from '../logger/logger.decorator';
import { StatsigUser } from 'statsig-node';
import { DUMMY_USER_ID, StatsigService } from '@*company-data-covered*/nest-statsig';
import { RunningLateSmsJobData } from './interfaces/jobs-running-late-sms.interface';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardCareRequestNoteUpsert } from '../dashboard/types/dashboard-care-request-note';
import { InjectQueue } from './common';

@Injectable()
export class JobsService {
  constructor(
    private careRequestRepository: CareRequestRepository,
    private dashboardService: DashboardService,
    private statsig: StatsigService,
    @InjectLogger() private logger: Logger,
    @InjectQueue(RUNNING_LATE_SMS_QUEUE)
    private runningLateSmsQueue: Queue
  ) {}

  async queueRunningLateSmsJob(careRequestId: number) {
    const careRequest = await this.careRequestRepository.getByIdWithError(
      careRequestId
    );
    const latestEta = await this.getLatestEtaRange(careRequest.etaRanges);
    const voicemailConsent = !!careRequest.patient?.voicemailConsent;

    if (latestEta && voicemailConsent) {
      const delay = this.runningLateSmsJobDelayMs(latestEta);

      if (Number.isInteger(delay)) {
        await this.runningLateSmsQueue.add(
          SEND_SMS_JOB_NAME,
          { careRequestId },
          { attempts: 3, delay, jobId: this.runningLateSmsJobId(careRequestId) }
        );
      }
    } else {
      this.logger.error(
        `Failed to add ${SEND_SMS_JOB_NAME} Job to ${this.runningLateSmsQueue.name}. No valid ETA Ranges for Care Request`,
        {
          careRequestId,
        }
      );
    }
  }

  async updateRunningLateSmsJob(careRequestId: number) {
    await this.removeRunningLateSmsJob(careRequestId);
    const runningLateSmsGate = await this.checkRunningLateSmsGate();

    if (runningLateSmsGate) {
      await this.queueRunningLateSmsJob(careRequestId);
    }
  }

  async removeRunningLateSmsJob(careRequestId: number) {
    const job = await this.getRunningLateSmsJob(careRequestId);

    if (job) {
      await job.remove();
    }
  }

  async getRunningLateSmsJob(
    careRequestId: number
  ): Promise<Job<RunningLateSmsJobData> | null> {
    return this.runningLateSmsQueue.getJob(
      this.runningLateSmsJobId(careRequestId)
    );
  }

  async checkRunningLateSmsGate() {
    const statsigUser: StatsigUser = { userID: DUMMY_USER_ID };

    return this.statsig.checkGate(statsigUser, 'companion_running_late_sms');
  }

  async createRunningLateSmsCareRequestNote(careRequestId: number) {
    const note: DashboardCareRequestNoteUpsert = {
      care_request_id: careRequestId,
      note: RUNNING_LATE_NOTE_TEXT,
      note_type: RUNNING_LATE_NOTE_TYPE,
      in_timeline: true,
    };

    await this.dashboardService.createNoteForCareRequest(careRequestId, note);
  }

  private async getLatestEtaRange(etaRanges: EtaRangeDto[]) {
    const sortedEtas = [...etaRanges].sort(function (a, b) {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      return dateA.getTime() - dateB.getTime();
    });

    return sortedEtas.at(-1);
  }

  private runningLateSmsJobId(careRequestId: number): string {
    return `${RUNNING_LATE_SMS_QUEUE}:${careRequestId}`;
  }

  private runningLateSmsJobDelayMs(etaRange: EtaRangeDto) {
    const { endsAt } = etaRange;
    const endsAtDateTime = new Date(endsAt);
    const sendSmsDateTime = subMinutes(endsAtDateTime, 15);

    if (isFuture(sendSmsDateTime)) {
      return differenceInMilliseconds(sendSmsDateTime, new Date());
    }
  }
}
