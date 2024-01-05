import { sendDELETERequest, sendGETRequest, sendPOSTRequest } from './request';

function createInsurance(
  insurance: Record<string, unknown>,
  patientId: number
) {
  return sendPOSTRequest({
    url: `/api/patients/${patientId}/insurances`,
    form: true,
    body: insurance,
  });
}

function searchInsurances(patientId: number) {
  return sendGETRequest({
    url: `/api/patients/${patientId}/insurances`,
  });
}

function deleteInsurance(
  patientId: number,
  careRequestId: number,
  insuranceId: number
) {
  return sendDELETERequest({
    url: `/api/patients/${patientId}/care_requests/${careRequestId}/insurances/${insuranceId}`,
  });
}

function deleteInsuranceIfExist(patientId: number, careRequestId: number) {
  return searchInsurances(patientId).then((searchInsurancesResp) => {
    if (searchInsurancesResp.body.length > 0) {
      searchInsurancesResp.body.forEach((insurance: { id: number }) => {
        deleteInsurance(patientId, careRequestId, insurance.id);
      });
    }
  });
}

function createInsuranceIfNotExist(patientId: number, careRequestId: number) {
  return cy.fixture('apiBody/createInsurance').then((insuranceFixture) => {
    return cy.deleteInsuranceIfExist(patientId, careRequestId).then(() => {
      return createInsurance(insuranceFixture, patientId);
    });
  });
}

export { deleteInsuranceIfExist, createInsuranceIfNotExist };
