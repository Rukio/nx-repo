import {
  CreditCard,
  StationCreditCard,
} from '@*company-data-covered*/consumer-web-types';
import CreditCardParamsDto from '../../dto/credit-card-params.dto';
import UpdateCreditCardParamsDto from '../../dto/update-credit-card-params.dto';

export const MOCK_PATIENT_ID = 3124;
export const MOCK_CARE_REQUEST_ID = 1243;

export const MOCK_ERROR_MESSAGE = 'Test message';

export const CREDIT_CARD_INFO = {
  number: '4242424242424242',
  expiration: '2022-11-01',
  cvv: '101',
  placeOfService: 'Home',
  billingCityId: 5,
  saveForFutureUse: true,
  patientId: 394412,
};

export const MOCK_SINGLE_ERROR_MESSAGE = 'Test message from station';

export const MOCK_STATION_CREDIT_CARD_ERRORS_DATA = {
  response: {
    data: {
      errors: {
        card_number: [
          'is invalid. Double check the Card Number you have entered',
        ],
        expiration: ['cannot be in the past.'],
        cvv2: ['must be 3 digits'],
        payment_method_id: ['cannot be null'],
      },
    },
  },
  status: 400,
};

export const MOCK_STATION_CREDIT_CARD_SIGNLE_ERROR_DATA = {
  response: {
    data: {
      error: MOCK_SINGLE_ERROR_MESSAGE,
    },
  },
  status: 400,
};

export const MOCK_STATION_CREDIT_CARD_EMPTY_RESPONSE_DATA = {
  response: {},
  message: MOCK_ERROR_MESSAGE,
  status: 400,
};

export const MOCK_STATION_CREDIT_CARD_ERROR: Error = {
  name: 'Test',
  message: MOCK_ERROR_MESSAGE,
};

export const MOCK_CREDIT_CARD_ERRORS_TRANSFORMED = [
  'Card Number is invalid. Double check the Card Number you have entered',
  'Card expiration cannot be in the past.',
  'CVV must be 3 digits',
  'payment_method_id error: cannot be null',
];

export const MOCK_STATION_CREDIT_CARD_IFRAME_ERRORS_DATA = {
  response: {
    data: {
      error: 'Ehr record not found',
    },
  },
  status: 404,
};

export const MOCK_UPDATE_CREDIT_CARD_PARAMS: UpdateCreditCardParamsDto =
  CREDIT_CARD_INFO;

export const MOCK_CREDIT_CARD_PARAMS: CreditCardParamsDto = {
  ...CREDIT_CARD_INFO,
  careRequestId: 555617,
};

export const MOCK_CREDIT_CARD: CreditCard = {
  expiration: '2022-11-01',
  saveForFutureUse: true,
  id: 124,
  patientId: 394412,
  lastFour: '4242',
  cardType: 'VISA',
};

export const MOCK_STATION_CREDIT_CARD: StationCreditCard = {
  expiration: '2022-11-01',
  save_for_future_use: true,
  id: 124,
  patient_id: 394412,
  last_four: '4242',
  card_type: 'VISA',
};
