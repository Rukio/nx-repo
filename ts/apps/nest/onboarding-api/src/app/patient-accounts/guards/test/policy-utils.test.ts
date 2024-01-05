import { Request } from 'express';
import {
  REQUIRED_ACCOUNT_ID_MSG,
  REQUIRED_PATIENT_ID_MSG,
  REQUIRED_UNVERIFIED_PATIENT_ID_MSG,
  accountIdFromRequest,
  patientIdFromRequest,
  unverifiedPatientIdFromRequest,
} from '../policy-utils';
import { BadRequestException } from '@nestjs/common';

const MOCK_STRING_ID = '12345';
const MOCK_NUMBER_ID = 12345;

export const mockExpressRequest = ({ params, query, body }: Partial<Request>) =>
  ({
    user: {},
    params: {
      ...params,
    },
    query: {
      ...query,
    },
    body: { ...body },
  } as Request);

describe(`${accountIdFromRequest.name}`, () => {
  it('should parse string accountId to number', () => {
    expect(
      accountIdFromRequest(
        mockExpressRequest({ params: { accountId: MOCK_STRING_ID } })
      )
    ).toEqual(MOCK_NUMBER_ID);
  });

  it('should throw error when missing accountId param', () => {
    expect(() =>
      accountIdFromRequest(mockExpressRequest({ params: {} }))
    ).toThrow(new BadRequestException(REQUIRED_ACCOUNT_ID_MSG));
  });

  it('should throw error when accountId is not a number', () => {
    expect(() =>
      accountIdFromRequest(
        mockExpressRequest({ params: { accountId: '&3@nAnum' } })
      )
    ).toThrow(new BadRequestException(REQUIRED_ACCOUNT_ID_MSG));
  });
});

describe(`${patientIdFromRequest.name}`, () => {
  it('should return patientId from params', () => {
    expect(
      patientIdFromRequest(
        mockExpressRequest({ params: { patientId: MOCK_STRING_ID } })
      )
    ).toEqual(MOCK_STRING_ID);
  });

  it('should return patientId from query', () => {
    expect(
      patientIdFromRequest(
        mockExpressRequest({ query: { patientId: MOCK_STRING_ID } })
      )
    ).toEqual(MOCK_STRING_ID);
  });

  it('should return patientId from body', () => {
    expect(
      patientIdFromRequest(
        mockExpressRequest({ body: { patientId: MOCK_STRING_ID } })
      )
    ).toEqual(MOCK_STRING_ID);
  });

  it('should throw error when missing patientId', () => {
    expect(() => patientIdFromRequest(mockExpressRequest({}))).toThrow(
      new BadRequestException(REQUIRED_PATIENT_ID_MSG)
    );
  });
});

describe(`${unverifiedPatientIdFromRequest.name}`, () => {
  it('should return patientId from params', () => {
    expect(
      unverifiedPatientIdFromRequest(
        mockExpressRequest({ params: { unverifiedPatientId: MOCK_STRING_ID } })
      )
    ).toEqual(MOCK_STRING_ID);
  });

  it('should return patientId from query', () => {
    expect(
      unverifiedPatientIdFromRequest(
        mockExpressRequest({ query: { unverifiedPatientId: MOCK_STRING_ID } })
      )
    ).toEqual(MOCK_STRING_ID);
  });

  it('should return patientId from body', () => {
    expect(
      unverifiedPatientIdFromRequest(
        mockExpressRequest({ body: { unverifiedPatientId: MOCK_STRING_ID } })
      )
    ).toEqual(MOCK_STRING_ID);
  });

  it('should throw error when missing patientId', () => {
    expect(() =>
      unverifiedPatientIdFromRequest(mockExpressRequest({}))
    ).toThrow(new BadRequestException(REQUIRED_UNVERIFIED_PATIENT_ID_MSG));
  });
});
