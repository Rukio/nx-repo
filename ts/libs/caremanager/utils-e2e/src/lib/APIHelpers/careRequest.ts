import { sendPOSTRequest } from './request';

function createCareRequest(careRequest: Record<string, unknown>) {
  return sendPOSTRequest({
    url: 'api/care_requests',
    form: true,
    body: careRequest,
  });
}

export { createCareRequest };
