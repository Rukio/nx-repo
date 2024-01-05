import { HttpService } from '@nestjs/axios';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { mockClear, mockDeep } from 'jest-mock-extended';
import { of } from 'rxjs';

beforeEach(() => {
  mockClear(mockHttpService);
});

export const MOCK_POLICY_HOST = 'http://localhost:8181';

// eslint-disable-next-line
const policyQuery = (_url: string, data: any) => {
  const query = data.query;
  const actor = data.input.actor;

  if (query == 'result = data.policies.bad_query') {
    return {};
  } else if (actor.type != 'm2m') {
    if (query == 'result = data.policies.audit.create_audit_event') {
      return {
        result: [
          {
            result: false,
          },
        ],
      };
    } else {
      return {
        result: [
          {
            result: {
              create_audit_event: false,
            },
          },
        ],
      };
    }
  } else if (query == 'result = data.policies.audit') {
    return {
      result: [
        {
          result: {
            create_audit_event: true,
          },
        },
      ],
    };
  } else if (query == 'result = data.policies.audit.create_audit_event') {
    return {
      result: [
        {
          result: true,
        },
      ],
    };
  } else {
    return {};
  }
};

export const mockHttpService = mockDeep<HttpService>({
  post: jest.fn().mockImplementation((url: string, body) => {
    const host = url.slice(0, url.indexOf('/', 7));
    if (!host.startsWith(MOCK_POLICY_HOST)) {
      throw new Error(`Error: connect ECONNREFUSED ${url}`);
    }

    const data = policyQuery(url, body);

    // eslint-disable-next-line
    const response: AxiosResponse<any> = {
      data,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      config: {
        url: `${MOCK_POLICY_HOST}/v1/query`,
        headers: new AxiosHeaders(),
      },

      status: 200,
      statusText: 'OK',
    };

    return of(response);
  }),
});
