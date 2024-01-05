/* eslint-disable import/no-extraneous-dependencies */
import { sendPOSTRequest } from './request';
import { faker } from '@faker-js/faker';

const PATIENT_BODY = {
  first_name: 'Testor',
  last_name: 'McTest',
  date_of_birth: new Date('2000/05/05').toISOString(),
  sex: 'female',
  phone_number: '303-500-1518',
  athena_medical_record_number: '21789057',
  address_city: 'Denver',
  address_state: 'CO',
  address_zipcode: '80205',
};

function createPatient() {
  return sendPOSTRequest({
    url: `${Cypress.env('API_URL')}/v1/patients`,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
    body: PATIENT_BODY,
  }).then((createPatientResp) => {
    Cypress.env('currentPatientBody', createPatientResp.body.patient);

    return createPatientResp.body;
  });
}

function createDashboardPatient(patient: Record<string, unknown>) {
  return sendPOSTRequest({
    url: '/api/patients',
    body: patient,
  });
}
function createAthenaPatient(patientId: number) {
  return sendPOSTRequest({
    url: `/api/patients/${patientId}/ehr_create`,
    body: {
      market_id: Cypress.env('daytonaBeachId'),
      billing_city_id: 5,
    },
  });
}

function createAPIPatient() {
  return cy
    .fixture('apiBody/createPatient')
    .then((patientFixture) => {
      const randomFirstName = faker.name.firstName();
      const randomLastName = faker.name.lastName();

      const randomPatient = {
        patient: {
          ...Cypress._.cloneDeep(patientFixture.patient),
          first_name: randomFirstName,
          last_name: randomLastName,
        },
      };
      Cypress.env('currentPatientFirstName', randomFirstName);

      return createDashboardPatient(randomPatient);
    })
    .then((createPatientResp) => {
      return createAthenaPatient(createPatientResp.body.id).then(
        () => createPatientResp.body
      );
    });
}

export { createPatient, createAPIPatient };
