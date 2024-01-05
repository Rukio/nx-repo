import { AxiosHeaders, AxiosResponse } from 'axios';

export const emptyHeaders: AxiosHeaders = {
  set: jest.fn(),
  get: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  normalize: jest.fn(),
  concat: jest.fn(),
  toJSON: jest.fn(),
  setContentType: jest.fn(),
  getContentType: jest.fn(),
  hasContentType: jest.fn(),
  setContentLength: jest.fn(),
  getContentLength: jest.fn(),
  hasContentLength: jest.fn(),
  setAccept: jest.fn(),
  getAccept: jest.fn(),
  hasAccept: jest.fn(),
  setUserAgent: jest.fn(),
  getUserAgent: jest.fn(),
  hasUserAgent: jest.fn(),
  setContentEncoding: jest.fn(),
  getContentEncoding: jest.fn(),
  hasContentEncoding: jest.fn(),
  setAuthorization: jest.fn(),
  getAuthorization: jest.fn(),
  hasAuthorization: jest.fn(),
  [Symbol.iterator]: jest.fn(),
};

export const wrapInAxiosResponse = <T, D>(
  response: T,
  statusCode?: number,
  statusText?: string
): AxiosResponse<T, D> => {
  return {
    data: response,
    status: statusCode ?? 200,
    statusText: statusText ?? '',
    headers: {},
    config: {
      headers: emptyHeaders,
    },
  };
};

export default {
  wrapInAxiosResponse,
};
