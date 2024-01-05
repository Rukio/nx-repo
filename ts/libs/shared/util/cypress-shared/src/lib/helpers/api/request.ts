const DEFAULT_HEADERS = {
  Accept: 'application/vnd.*company-data-covered*.com; version=1',
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/json',
};

function sendRequest(options: Partial<Cypress.RequestOptions>) {
  return cy.request(options);
}

function sendGETRequest(
  options: Partial<Omit<Cypress.RequestOptions, 'method'>>
) {
  return sendRequest({
    method: 'GET',
    headers: DEFAULT_HEADERS,
    ...options,
  });
}

function sendPOSTRequest(
  options: Partial<Omit<Cypress.RequestOptions, 'method'>>
) {
  return sendRequest({
    method: 'POST',
    headers: DEFAULT_HEADERS,
    ...options,
  });
}

function sendPATCHRequest(
  options: Partial<Omit<Cypress.RequestOptions, 'method'>>
) {
  return sendRequest({
    method: 'PATCH',
    headers: DEFAULT_HEADERS,
    ...options,
  });
}

function sendPUTRequest(
  options: Partial<Omit<Cypress.RequestOptions, 'method'>>
) {
  return sendRequest({
    method: 'PUT',
    headers: DEFAULT_HEADERS,
    ...options,
  });
}

function sendDELETERequest(
  options: Partial<Omit<Cypress.RequestOptions, 'method'>>
) {
  return sendRequest({
    method: 'DELETE',
    headers: DEFAULT_HEADERS,
    ...options,
  });
}

export {
  sendRequest,
  sendGETRequest,
  sendPOSTRequest,
  sendPATCHRequest,
  sendPUTRequest,
  sendDELETERequest,
};
