import { sendPOSTRequest } from './request';

function createMPOAConsent(careRequestId: number) {
  return cy.fixture('apiBody/createMPOAConsent').then((mpoaConsentFixture) => {
    const mpoaConsent = mpoaConsentFixture;
    mpoaConsentFixture.care_request_id = careRequestId;

    return sendPOSTRequest({
      url: '/api/onboarding/mpoa_consents.json',
      form: true,
      body: mpoaConsent,
    });
  });
}

export default createMPOAConsent;
