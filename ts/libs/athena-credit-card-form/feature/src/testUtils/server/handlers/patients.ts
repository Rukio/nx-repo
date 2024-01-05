import {
  environment,
  mockPayment,
  mockSavedCreditCard,
  mockCreditCards,
  PATIENTS_PATH,
  PAYMENT_SEGMENT,
  CREDIT_CARD_SEGMENT,
  CREDIT_CARDS_SEGMENT,
  mockDeleteCreditCardResult,
} from '@*company-data-covered*/athena-credit-card-form/data-access';
import { rest, RestHandler } from 'msw';

export const patientsHandlers: RestHandler[] = [
  rest.post(
    `${environment.serviceURL}${PATIENTS_PATH}/:patientId${PAYMENT_SEGMENT}`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockPayment));
    }
  ),
  rest.post(
    `${environment.serviceURL}${PATIENTS_PATH}/:patientId${CREDIT_CARD_SEGMENT}`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json(mockSavedCreditCard));
    }
  ),
  rest.get(
    `${environment.serviceURL}${PATIENTS_PATH}/:patientId${CREDIT_CARDS_SEGMENT}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ creditCards: mockCreditCards }),
        ctx.delay(100)
      );
    }
  ),
  rest.delete(
    `${environment.serviceURL}${PATIENTS_PATH}/:patientId${CREDIT_CARD_SEGMENT}/:creditCardID`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(mockDeleteCreditCardResult),
        ctx.delay(100)
      );
    }
  ),
];
