import { sendPOSTRequest } from './request';

function createRiskAssessment(careRequestId: number) {
  return cy
    .fixture('apiBody/createRiskAssessment')
    .then((riskAssessmentFixture) => {
      return sendPOSTRequest({
        url: `/api/care_requests/${careRequestId}/risk_assessment.json`,
        body: riskAssessmentFixture,
      });
    });
}

export default createRiskAssessment;
