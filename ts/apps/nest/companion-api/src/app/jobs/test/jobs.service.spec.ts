import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { DeepMockProxy, mockClear, mockDeep } from 'jest-mock-extended';
import { CareRequestNotFoundException } from '../../care-request/common';
import {
  buildMockCareRequest,
  buildMockEtaRange,
} from '../../care-request/mocks/care-request.repository.mock';
import { CommonModule } from '../../common/common.module';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import {
  RUNNING_LATE_NOTE_TEXT,
  RUNNING_LATE_NOTE_TYPE,
  RUNNING_LATE_SMS_QUEUE,
} from '../common/jobs.constants';
import { JobsModule } from '../jobs.module';
import { JobsService } from '../jobs.service';
import * as faker from 'faker';
import { mockRunningLateSmsQueue } from '../mocks/queues.mock';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { mockStatsigService } from '../../statsig/mocks/statsig.service.mock';

describe(`${JobsService.name}`, () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobsModule, CommonModule],
    })
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    service = module.get<JobsService>(JobsService);
  });

  describe(`${JobsService.prototype.queueRunningLateSmsJob.name}`, () => {
    describe('Care Request and ETA Ranges exist', () => {
      describe('Single ETA', () => {
        const mockCareRequest = buildMockCareRequest({
          id: faker.datatype.number(),
        });

        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
        });

        test(`should add job to running late SMS queue`, async () => {
          await service.queueRunningLateSmsJob(mockCareRequest.id);

          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(1);
        });
      });

      describe('Latest ETA Range ends in the past', () => {
        const mockCareRequest = buildMockCareRequest({
          id: faker.datatype.number(),
          etaRanges: [buildMockEtaRange({ endsAt: new Date().toISOString() })],
        });

        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
        });

        test(`should not add job to running late SMS queue`, async () => {
          await service.queueRunningLateSmsJob(mockCareRequest.id);

          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('Care Request or ETA Ranges do not exist', () => {
      describe('Care Request does not exist', () => {
        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(null);
        });

        test(`should throw a CareRequestNotFoundException`, async () => {
          await expect(
            service.queueRunningLateSmsJob(faker.datatype.number())
          ).rejects.toBeInstanceOf(CareRequestNotFoundException);

          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(0);
        });
      });

      describe('ETA Ranges do not exist', () => {
        const mockCareRequest = buildMockCareRequest({
          id: faker.datatype.number(),
          etaRanges: [],
        });

        beforeEach(() => {
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
        });

        test(`should not add job to running late SMS queue`, async () => {
          await service.queueRunningLateSmsJob(mockCareRequest.id);

          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('patient is undefined', () => {
      const mockCareRequest = buildMockCareRequest({
        id: faker.datatype.number(),
        patient: undefined,
      });

      beforeEach(() => {
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
      });

      test(`should not add job to running late SMS queue`, async () => {
        await service.queueRunningLateSmsJob(mockCareRequest.id);

        expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe(`${JobsService.prototype.removeRunningLateSmsJob.name}`, () => {
    const careRequestId = faker.datatype.number();
    const mockRunningLateJob = mockDeep<Job>();

    describe('job exists', () => {
      beforeEach(async () => {
        mockRunningLateJob.remove.mockResolvedValue();
        mockRunningLateSmsQueue.getJob.mockResolvedValue(mockRunningLateJob);
      });

      it('removes job found in running late queue', async () => {
        await service.removeRunningLateSmsJob(careRequestId);
        expect(mockRunningLateJob.remove).toHaveBeenCalledTimes(1);
      });
    });

    describe('job does not exist', () => {
      beforeEach(async () => {
        mockClear(mockRunningLateJob);

        mockRunningLateJob.remove.mockResolvedValue();
        mockRunningLateSmsQueue.getJob.mockResolvedValue(null);
      });

      it('does not remove a job from the running late queue', async () => {
        await service.removeRunningLateSmsJob(careRequestId);
        expect(mockRunningLateJob.remove).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe(`${JobsService.prototype.updateRunningLateSmsJob.name}`, () => {
    const careRequestId = faker.datatype.number();
    const mockCareRequest = buildMockCareRequest({
      id: careRequestId,
    });
    const mockRunningLateJob: DeepMockProxy<Job> = mockDeep<Job>({
      id: `${RUNNING_LATE_SMS_QUEUE}:${careRequestId}`,
    });

    beforeEach(() => {
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
    });

    describe('job exists', () => {
      beforeEach(async () => {
        mockClear(mockRunningLateJob);

        mockRunningLateJob.remove.mockResolvedValue();
        mockRunningLateSmsQueue.getJob.mockResolvedValue(mockRunningLateJob);
      });

      describe('running late sms gate is on', () => {
        beforeEach(() => {
          mockStatsigService.checkGate.mockResolvedValue(true);
        });

        it('removes and re-adds job found in running late queue', async () => {
          await service.updateRunningLateSmsJob(careRequestId);
          expect(mockRunningLateJob.remove).toHaveBeenCalledTimes(1);
          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(1);
        });
      });

      describe('running late sms gate is off', () => {
        beforeEach(() => {
          mockStatsigService.checkGate.mockResolvedValue(false);
        });

        it('removes job found in running late queue without re-adding', async () => {
          await service.updateRunningLateSmsJob(careRequestId);
          expect(mockRunningLateJob.remove).toHaveBeenCalledTimes(1);
          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('job does not exist', () => {
      beforeEach(async () => {
        mockClear(mockRunningLateJob);

        mockRunningLateJob.remove.mockResolvedValue();
        mockRunningLateSmsQueue.getJob.mockResolvedValue(null);
      });

      describe('running late sms gate is on', () => {
        beforeEach(() => {
          mockStatsigService.checkGate.mockResolvedValue(true);
        });

        it('adds but does not remove a job from the running late queue', async () => {
          await service.updateRunningLateSmsJob(careRequestId);
          expect(mockRunningLateJob.remove).toHaveBeenCalledTimes(0);
          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(1);
        });
      });

      describe('running late sms gate is off', () => {
        beforeEach(() => {
          mockStatsigService.checkGate.mockResolvedValue(false);
        });

        it('does not remove a job from or add a job to the running late queue', async () => {
          await service.updateRunningLateSmsJob(careRequestId);
          expect(mockRunningLateJob.remove).toHaveBeenCalledTimes(0);
          expect(mockRunningLateSmsQueue.add).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe(`${JobsService.prototype.createRunningLateSmsCareRequestNote.name}`, () => {
    const careRequestId = faker.datatype.number();

    it('create a note for a Care Request with Running Late SMS data', async () => {
      await service.createRunningLateSmsCareRequestNote(careRequestId);
      expect(
        mockDashboardService.createNoteForCareRequest
      ).toHaveBeenCalledWith(careRequestId, {
        care_request_id: careRequestId,
        note: RUNNING_LATE_NOTE_TEXT,
        note_type: RUNNING_LATE_NOTE_TYPE,
        in_timeline: true,
      });
    });
  });
});
