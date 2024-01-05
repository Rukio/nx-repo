import { ServiceUnavailableException } from '@nestjs/common';
import { getException, getHttpOutcome, HttpOutcome } from '../common';

describe('Utilities', () => {
  describe(`${getHttpOutcome.name}`, () => {
    const tcs = [
      {
        code: 98,
        expected: HttpOutcome.UNKNOWN,
      },
      {
        code: 102,
        expected: HttpOutcome.INFORMATIONAL,
      },
      {
        code: 202,
        expected: HttpOutcome.SUCCESS,
      },
      {
        code: 302,
        expected: HttpOutcome.REDIRECTION,
      },
      {
        code: 402,
        expected: HttpOutcome.CLIENT_ERROR,
      },
      {
        code: 502,
        expected: HttpOutcome.SERVER_ERROR,
      },
      {
        code: 602,
        expected: HttpOutcome.UNKNOWN,
      },
    ];

    for (const tc of tcs) {
      const { code, expected } = tc;

      it(`should return ${expected} for codes in the ${code}`, () => {
        expect(getHttpOutcome(code)).toStrictEqual(expected);
      });
    }
  });

  describe(`${getException.name}`, () => {
    const tcs: {
      description: string;
      input: unknown;
      expected: unknown;
    }[] = [
      {
        description: 'should return empty string',
        input: undefined,
        expected: '',
      },
      {
        description: 'should return constructor name',
        input: new ServiceUnavailableException(),
        expected: ServiceUnavailableException.name,
      },
      {
        description: 'should return name property without constructor name',
        input: { name: 'without_constructor_name', constructor: undefined },
        expected: 'without_constructor_name',
      },
      {
        description:
          'should return message property without name or constructor name',
        input: {
          message: 'without_name_or_constructor_name',
          name: undefined,
          constructor: undefined,
        },
        expected: 'without_name_or_constructor_name',
      },
      {
        description:
          'should return "UNKNOWN" without message, name, or constructor name',
        input: {
          message: undefined,
          name: undefined,
          constructor: undefined,
        },
        expected: 'UNKNOWN',
      },
    ];

    for (const tc of tcs) {
      const { description, input, expected } = tc;

      it(`${description}`, () => {
        expect(getException(input)).toStrictEqual(expected);
      });
    }
  });
});
