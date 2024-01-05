import {
  InformedRequestor,
  StationInformedRequestorResponse,
} from '@*company-data-covered*/consumer-web-types';

export const MOCK_INFORMED_REQUESTOR_PAYLOAD: InformedRequestor = {
  careRequestId: 612398,
  contactFirstName: 'Joe',
  contactLastName: 'Jones',
  contactPhone: '3035001518',
  response: {
    questions: [
      {
        question: 'Please state your full name.',
        answer: 'yes',
      },
      {
        question: 'Are you the patient or MPOA?',
        answer: 'yes',
      },
      {
        question: 'What is today’s date and time?',
        answer: 'yes',
      },
    ],
  },
};

export const MOCK_INFORMED_REQUESTOR_RESPONSE: InformedRequestor = {
  id: 123,
  ...MOCK_INFORMED_REQUESTOR_PAYLOAD,
};

export const MOCK_STATION_CREATE_INFORMED_REQUESTOR: StationInformedRequestorResponse =
  {
    id: 123,
    care_request_id: 612398,
    response: {
      care_request_id: 612398,
      contact_first_name: 'Joe',
      contact_last_name: 'Jones',
      contact_phone: '3035001518',
      response: {
        questions: [
          {
            question: 'Please state your full name.',
            answer: 'yes',
          },
          {
            question: 'Are you the patient or MPOA?',
            answer: 'yes',
          },
          {
            question: 'What is today’s date and time?',
            answer: 'yes',
          },
        ],
      },
    },
  };
