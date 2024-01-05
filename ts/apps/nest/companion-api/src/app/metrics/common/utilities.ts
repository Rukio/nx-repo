export enum HttpOutcome {
  INFORMATIONAL = 'INFORMATIONAL',
  SUCCESS = 'SUCCESS',
  REDIRECTION = 'REDIRECTION',
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Converts an HTTP status code into a generalized outcome.
 *
 * @param httpStatus The numeric status of the HTTP response
 */
export function getHttpOutcome(httpStatus: number): HttpOutcome {
  if (httpStatus >= 100 && httpStatus < 200) {
    return HttpOutcome.INFORMATIONAL;
  } else if (httpStatus >= 200 && httpStatus < 300) {
    return HttpOutcome.SUCCESS;
  } else if (httpStatus >= 300 && httpStatus < 400) {
    return HttpOutcome.REDIRECTION;
  } else if (httpStatus >= 400 && httpStatus < 500) {
    return HttpOutcome.CLIENT_ERROR;
  } else if (httpStatus >= 500 && httpStatus < 600) {
    return HttpOutcome.SERVER_ERROR;
  }

  return HttpOutcome.UNKNOWN;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getException(exception?: any): string {
  if (!exception) {
    return '';
  }

  if (exception.constructor?.name) {
    return exception.constructor.name;
  } else if (exception.name) {
    return exception.name;
  } else if (exception.message) {
    return exception.message;
  }

  return 'UNKNOWN';
}
