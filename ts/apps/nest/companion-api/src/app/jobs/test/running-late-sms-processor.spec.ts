import { RunningLateSmsProcessor } from '../processors/running-late-sms-processor';
import { Test, TestingModule } from '@nestjs/testing';
import { mockSmsService } from '../../communications/mocks/sms.service.mock';
import { SmsService } from '../../communications/sms.service';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { mockConfigService } from '../../common/mocks/config.service.mock';
import { ConfigService } from '@nestjs/config';
import { CommonModule } from '../../common/common.module';
import {
  buildMockActiveStatus,
  buildMockCareRequest,
} from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestNotFoundException } from '../../care-request/common';
import { Job } from 'bull';
import { mockDeep } from 'jest-mock-extended';
import { JobsModule } from '../jobs.module';
import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import * as faker from 'faker';
import { RUNNING_LATE_STATUS } from '../common/jobs.constants';
import { JobsService } from '../jobs.service';
import { mockJobsService } from '../mocks/jobs.service.mock';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';
import { MessageType } from '../../communications/enums/message-type.enum';

describe(`${RunningLateSmsProcessor.name}`, () => {
  describe('without flow SID env var', () => {
    test('should throw MissingEnvironmentVariableException', async () => {
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'TWILIO_COMPANION_FLOW_SID') {
          return undefined;
        }

        return process.env[key];
      });

      const moduleRef = await Test.createTestingModule({
        imports: [JobsModule, CommonModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .overrideProvider(DashboardService)
        .useValue(mockDashboardService)
        .overrideProvider(SmsService)
        .useValue(mockSmsService);

      const processor = moduleRef.compile();

      await expect(processor).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
      await expect(processor).rejects.toThrow(
        `Missing required environment variable: TWILIO_COMPANION_FLOW_SID`
      );
    });
  });

  describe('with flow SID env var', () => {
    let processor: RunningLateSmsProcessor;

    [CareRequestStatusText.Committed, CareRequestStatusText.Accepted].forEach(
      (status: string) => {
        const mockCareRequest = buildMockCareRequest({
          id: faker.datatype.number(),
          activeStatus: buildMockActiveStatus({ name: status }),
        });
        const mockJob = mockDeep<Job>({
          id: `test:${mockCareRequest.id}`,
          data: { careRequestId: mockCareRequest.id },
        });

        beforeEach(async () => {
          const module: TestingModule = await Test.createTestingModule({
            imports: [JobsModule, CommonModule],
          })
            .overrideProvider(DashboardService)
            .useValue(mockDashboardService)
            .overrideProvider(SmsService)
            .useValue(mockSmsService)
            .overrideProvider(JobsService)
            .useValue(mockJobsService)
            .compile();

          processor = await module.resolve(RunningLateSmsProcessor);
        });

        describe(`${RunningLateSmsProcessor.prototype.sendSms.name}`, () => {
          describe('With Care Request', () => {
            beforeEach(() => {
              mockDashboardService.getCareRequestById.mockResolvedValue(
                mockCareRequest
              );
            });

            test('executes flow for SMS using running late flow SID var', async () => {
              await processor.sendSms(mockJob);
              expect(mockSmsService.executeFlow).toBeCalledWith(
                process.env.TWILIO_COMPANION_FLOW_SID,
                mockCareRequest.caller.origin_phone,
                {
                  status: RUNNING_LATE_STATUS,
                  messageType: MessageType.RunningLateSms,
                }
              );
            });

            test('creates note on Care Request for running late', async () => {
              await processor.sendSms(mockJob);
              expect(
                mockJobsService.createRunningLateSmsCareRequestNote
              ).toBeCalledTimes(1);
            });
          });

          describe('Without Care Request', () => {
            test(`should throw CareRequestNotFoundException`, async () => {
              await expect(processor.sendSms(mockJob)).rejects.toBeInstanceOf(
                CareRequestNotFoundException
              );

              expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(0);
            });
          });
        });
      }
    );

    [
      CareRequestStatusText.Requested,
      CareRequestStatusText.Scheduled,
      CareRequestStatusText.OnRoute,
      CareRequestStatusText.OnScene,
      CareRequestStatusText.Complete,
      CareRequestStatusText.Archived,
    ].forEach((status: string) => {
      const mockCareRequest = buildMockCareRequest({
        id: faker.datatype.number(),
        activeStatus: buildMockActiveStatus({ name: status }),
      });
      const mockJob = mockDeep<Job>({
        id: `test:${mockCareRequest.id}`,
        data: { careRequestId: mockCareRequest.id },
      });

      beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
          imports: [JobsModule, CommonModule],
        })
          .overrideProvider(DashboardService)
          .useValue(mockDashboardService)
          .overrideProvider(SmsService)
          .useValue(mockSmsService)
          .overrideProvider(JobsService)
          .useValue(mockJobsService)
          .compile();

        processor = await module.resolve(RunningLateSmsProcessor);
      });

      describe(`${RunningLateSmsProcessor.prototype.sendSms.name}`, () => {
        describe('With Care Request', () => {
          beforeEach(() => {
            mockDashboardService.getCareRequestById.mockResolvedValue(
              mockCareRequest
            );
          });

          test('does not execute flow for SMS using running late flow SID var', async () => {
            await processor.sendSms(mockJob);
            expect(mockSmsService.executeFlow).not.toBeCalled();
          });

          test('does not create note on Care Request for running late', async () => {
            await processor.sendSms(mockJob);
            expect(
              mockJobsService.createRunningLateSmsCareRequestNote
            ).not.toBeCalled();
          });
        });

        describe('Without Care Request', () => {
          test(`should throw CareRequestNotFoundException`, async () => {
            await expect(processor.sendSms(mockJob)).rejects.toBeInstanceOf(
              CareRequestNotFoundException
            );

            expect(mockSmsService.executeFlow).toHaveBeenCalledTimes(0);
          });
        });
      });
    });
  });
});
