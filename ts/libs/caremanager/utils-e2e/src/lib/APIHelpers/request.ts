import { Request } from '@*company-data-covered*/cypress-shared';

const DEFAULT_HEADERS = {
  Accept: 'application/vnd.*company-data-covered*.com; version=1',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/json',
};

const sendPOSTRequest = ({
  headers = DEFAULT_HEADERS,
  ...rest
}: Partial<Cypress.RequestOptions>) =>
  Request.sendPOSTRequest({ headers, ...rest });

const sendGETRequest = ({
  headers = DEFAULT_HEADERS,
  ...rest
}: Partial<Cypress.RequestOptions>) =>
  Request.sendGETRequest({ headers, ...rest });

const sendPATCHRequest = ({
  headers = DEFAULT_HEADERS,
  ...rest
}: Partial<Cypress.RequestOptions>) =>
  Request.sendPATCHRequest({ headers, ...rest });

const sendDELETERequest = ({
  headers = DEFAULT_HEADERS,
  ...rest
}: Partial<Cypress.RequestOptions>) =>
  Request.sendDELETERequest({ headers, ...rest });

export { sendPOSTRequest, sendGETRequest, sendPATCHRequest, sendDELETERequest };
