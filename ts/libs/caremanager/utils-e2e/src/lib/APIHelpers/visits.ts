import { sendPOSTRequest } from './request';

export const createVisitFromStationCR = (
  careRequestId: number,
  sourceCareRequestId: number,
  status?: string
) =>
  cy
    .fixture('apiBody/visitCreate')
    .then((body) =>
      sendPOSTRequest({
        url: `${Cypress.env('API_URL')}/v1/visits/from-station-care-request`,
        headers: {
          authorization: `Bearer ${Cypress.env('CAREMANAGER_M2M_TOKEN')}`,
        },
        body: {
          ...body,
          status: status || 'requested',
          care_request_id: careRequestId.toString(),
          source_care_request_id: sourceCareRequestId.toString(),
        },
      })
    )
    .then((response) => {
      Cypress.env('currentVisitBody', response.body.visit);

      return response.body;
    });
