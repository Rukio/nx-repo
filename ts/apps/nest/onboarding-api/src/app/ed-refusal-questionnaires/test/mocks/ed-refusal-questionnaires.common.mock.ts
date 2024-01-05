import { StationEdRefusalQuestionnaire } from '@*company-data-covered*/consumer-web-types';
import EdRefusalQuestionnairesQueryDto from '../../dto/ed-refusal-questionnaires-query.dto';
import EdRefusalQuestionnariesDto from '../../dto/ed-refusal-questionnaries.dto';

export const REFUSAL_QUESTIONNAIRES_QUERY_MOCK: EdRefusalQuestionnairesQueryDto =
  {
    careRequestId: 612398,
  };

export const REFUSAL_QUESTIONNAIRES_BODY_MOCK: EdRefusalQuestionnariesDto = {
  secondaryScreeningId: null,
  type: null,
  responses: [
    {
      id: 1,
      question: 'Please state your full name.',
      answer: true,
    },
    {
      id: 2,
      question: 'Are you the patient or MPOA?',
      answer: true,
    },
    {
      id: 3,
      question: 'What is today’s date and time?',
      answer: true,
    },
  ],
};

export const REFUSAL_QUESTIONNAIRES_ID_MOCK = 913;

export const STATION_REFUSAL_QUESTIONNAIRES_MOCK: StationEdRefusalQuestionnaire =
  {
    id: 913,
    care_request_id: 612398,
    user_id: 82858,
    responses: [
      {
        id: 1,
        question: 'Please state your full name.',
        answer: 'yes',
      },
      {
        id: 2,
        question: 'Are you the patient or MPOA?',
        answer: 'yes',
      },
      {
        id: 3,
        question: 'What is today’s date and time?',
        answer: 'yes',
      },
    ],
    acceptable: true,
    created_at: '2021-10-06T18:04:03.368Z',
    updated_at: '2021-10-06T18:04:03.368Z',
    secondary_screening_id: null,
    type: null,
  };

export const REFUSAL_QUESTIONNAIRES_MOCK = {
  id: 913,
  userId: 82858,
  careRequestId: 612398,
  secondaryScreeningId: null,
  acceptable: true,
  type: null,
  responses: [
    {
      id: 1,
      question: 'Please state your full name.',
      answer: true,
    },
    {
      id: 2,
      question: 'Are you the patient or MPOA?',
      answer: true,
    },
    {
      id: 3,
      question: 'What is today’s date and time?',
      answer: true,
    },
  ],
};
