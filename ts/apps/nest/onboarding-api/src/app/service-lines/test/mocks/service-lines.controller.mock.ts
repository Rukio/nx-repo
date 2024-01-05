import {
  AppointmentType,
  ServiceLineQuestionResponse,
  QuestionResponse,
  ServiceLine,
} from '@*company-data-covered*/consumer-web-types';
import ServiceLineDto from '../../dto/service-lines.dto';

export const FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK: ServiceLineDto[] = [
  {
    id: 1,
    name: 'Acute Care',
    newPatientAppointmentType: {
      id: '87',
      name: 'D06 New Patient',
    },
    existingPatientAppointmentType: {
      id: '88',
      name: 'D06 Established Patient',
    },
    createdAt: '2019-03-28T05:26:31.093Z',
    updatedAt: '2021-05-07T19:37:40.703Z',
    followup2Day: true,
    followup_14_30_day: true,
    outOfNetworkInsurance: true,
    is911: false,
    requireCheckout: true,
    requireConsentSignature: true,
    requireMedicalNecessity: true,
    shiftTypeId: 1,
    parentId: null,
    upgradeableWithScreening: false,
    default: true,
    serviceLineQuestions: [],
    insurancePlanServiceLines: [
      {
        id: 535,
        serviceLineId: 1,
        insurancePlanId: 268,
        scheduleNow: true,
        scheduleFuture: true,
        captureCcOnScene: true,
        note: 'Your current insurance processes this claim against your out of network benefits, and your maximum responsibility will be $350. You may pre-pay a discounted, self-pay rate of $275.',
        createdAt: '2019-03-28T05:34:04.190Z',
        updatedAt: '2020-11-20T05:23:36.960Z',
        allChannelItems: true,
        enabled: true,
        newPatientAppointmentType: {
          id: '87',
          name: 'D06 New Patient',
        },
        existingPatientAppointmentType: {
          id: '88',
          name: 'D06 Established Patient',
        },
        onboardingCcPolicy: 'OPTIONAL',
      },
    ],
    subServiceLines: [],
    protocolRequirements: [],
  },
];

export const QUESTION_RESPONSE_MOCK: QuestionResponse = {
  id: 324,
  serviceLineId: 5463,
  questionType: 'type',
  questionText: 'text',
  syncToAthena: true,
  order: 14567,
  createdAt: '2021-07-08T20:39:08.305Z',
  updatedAt: '2021-07-08T20:39:08.305Z',
};

export const FETCH_RESPONSE_MOCK: ServiceLineQuestionResponse = {
  id: 123,
  serviceLineId: 555322,
  userId: 13259,
  careRequestId: 5003569,
  responses: [QUESTION_RESPONSE_MOCK],
  createdAt: '2021-07-08T20:39:08.305Z',
  updatedAt: '2021-07-08T20:39:08.305Z',
};

export const APPOINTMENT_TYPE_MOCK: AppointmentType = {
  id: 'id',
  name: 'name',
};

export const FETCH_911_RESPONSE_MOCK: ServiceLine = {
  id: 123,
  name: 'Acute Care',
  newPatientAppointmentType: APPOINTMENT_TYPE_MOCK,
  existingPatientAppointmentType: APPOINTMENT_TYPE_MOCK,
  createdAt: '2021-07-08T20:39:08.305Z',
  updatedAt: '2021-07-08T20:39:08.305Z',
  followup2Day: false,
  followup_14_30_day: false,
  outOfNetworkInsurance: false,
  is911: false,
  requireCheckout: false,
  requireConsentSignature: false,
  requireMedicalNecessity: false,
  shiftTypeId: 1,
  parentId: 322,
  upgradeableWithScreening: false,
  default: false,
  serviceLineQuestions: [],
  insurancePlanServiceLines: [],
  subServiceLines: [],
};
