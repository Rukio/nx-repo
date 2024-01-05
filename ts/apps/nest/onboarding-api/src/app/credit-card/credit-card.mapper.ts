import {
  StationCreditCard,
  CreditCard,
  CreditCardParams,
  StationCreditCardParams,
  UpdateCreditCardParams,
} from '@*company-data-covered*/consumer-web-types';

const StationCreditCardToCreditCard = (
  input: StationCreditCard
): CreditCard => {
  const output: CreditCard = {
    id: input.id,
    patientId: input.patient_id,
    expiration: input.expiration,
    cardType: input.card_type,
    lastFour: input.last_four,
    saveForFutureUse: input.save_for_future_use,
  };

  return output;
};

const CreditCardToStationCreditCard = (
  input: CreditCard
): StationCreditCard => {
  const output: StationCreditCard = {
    id: input.id,
    patient_id: input.id,
    expiration: input.expiration,
    save_for_future_use: input.saveForFutureUse,
    card_type: input.cardType,
    last_four: input.lastFour,
  };

  return output;
};

const CreditCardParamsToStationCreditCardParams = (
  input: CreditCardParams | UpdateCreditCardParams
): StationCreditCardParams => {
  const output: StationCreditCardParams = {
    billing_city_id: input.billingCityId,
    place_of_service: input.placeOfService,
    save_for_future_use: input.saveForFutureUse,
    cvv: input.cvv,
    expiration: input.expiration,
    number: input.number,
  };

  return output;
};

const StationCreditCardParamsToCreditCardParams = (
  input: StationCreditCardParams
): CreditCardParams => {
  const output: CreditCardParams = {
    saveForFutureUse: input.save_for_future_use,
    billingCityId: input.billing_city_id,
    cvv: input.cvv,
    expiration: input.expiration,
    number: input.number,
    placeOfService: input.place_of_service,
  };

  return output;
};

const transformErrors = (errorList): Array<string> => {
  const errorMessage = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries<Array<string>>(errorList)) {
    value.forEach((message) => {
      switch (key) {
        case 'card_number':
          errorMessage.push(`Card Number ${message}`);
          break;
        case 'cvv2':
          errorMessage.push(`CVV ${message}`);
          break;
        case 'expiration':
          errorMessage.push(`Card expiration ${message}`);
          break;
        default:
          errorMessage.push(`${key} error: ${message}`);
          break;
      }
    });
  }

  return errorMessage;
};

export default {
  transformErrors,
  StationCreditCardToCreditCard,
  CreditCardToStationCreditCard,
  CreditCardParamsToStationCreditCardParams,
  StationCreditCardParamsToCreditCardParams,
};
