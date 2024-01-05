import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { CompanionTaskType } from '@prisma/client';
import { mockReset, MockProxy, mockDeep } from 'jest-mock-extended';
import { DynamicConfig } from 'statsig-node';

beforeEach(() => {
  mockReset(mockStatsigService);
});

export type MockStatsigService = MockProxy<StatsigService>;

export const mockStatsigService = mockDeep<StatsigService>();

export const buildMockDynamicConfig = (value: unknown) =>
  mockDeep<DynamicConfig>({
    get: jest.fn().mockReturnValue(value),
    getValue: jest.fn().mockResolvedValue(value),
  });

export const mockWebRequestSmsConfig = ({
  smsContactPhoneNumber = 'test phone number',
} = {}) => {
  mockStatsigService.getConfig
    .calledWith(expect.anything(), 'companion_web_request_sms')
    .mockResolvedValue(
      mockDeep<DynamicConfig>({
        get: jest.fn().mockImplementation((val: string) => {
          if (val === 'sms_contact_phone_number') {
            return smsContactPhoneNumber;
          }
        }),
      })
    );
};

export const mockReminderTextExperiment = (enabled: boolean) => {
  mockStatsigService.getExperiment
    .calledWith(expect.anything(), 'companion_experience_reminder_text_v2')
    .mockResolvedValue(
      mockDeep<DynamicConfig>({
        get: jest.fn().mockImplementation((val: string) => {
          if (val === 'reminder_sms_enabled') {
            return enabled;
          }
          if (val === 'twilio_flow_sid') {
            return 'EXPERIMENT_DISABLED_FLOW_SID';
          }
        }),
      })
    );
};

export const mockConsentsModuleExperiment = (enabled: boolean) => {
  mockStatsigService.getExperiment
    .calledWith(expect.anything(), 'companion_experience_consents_module')
    .mockResolvedValue(
      mockDeep<DynamicConfig>({
        get: jest.fn().mockImplementation((val: string) => {
          if (val === 'enabled') {
            return enabled;
          }
        }),
      })
    );
};

export const mockTaskStatusNoteExperiment = (
  enabled: boolean,
  displayedTasks: CompanionTaskType[] = []
) => {
  mockStatsigService.getExperiment
    .calledWith(
      expect.anything(),
      'companion_care_request_timeline_task_status_note'
    )
    .mockResolvedValue(
      mockDeep<DynamicConfig>({
        get: jest.fn().mockImplementation((val: string) => {
          if (val === 'enabled') {
            return enabled;
          }
          if (val === 'displayed_tasks') {
            return displayedTasks;
          }
        }),
      })
    );
};
