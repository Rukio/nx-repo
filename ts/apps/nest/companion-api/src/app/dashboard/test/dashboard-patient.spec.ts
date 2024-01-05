import { PatientDto } from '../../care-request/dto/care-request.dto';
import { buildMockDashboardPatient } from '../mocks/dashboard-patient.mock';
import { DashboardPatient } from '../types/dashboard-patient';

describe(`${DashboardPatient.name}`, () => {
  describe(`${DashboardPatient.prototype.toPatientDto.name}`, () => {
    test(`Transforms correctly`, () => {
      const patient = buildMockDashboardPatient(true, { dob: '1994-09-22' });

      const result = patient.toPatientDto();

      expect(result).toStrictEqual({
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        voicemailConsent: patient.voicemail_consent,
        mobileNumber: patient.mobile_number,
        dob: '09/22/1994',
        gender: patient.gender,
        ehrId: patient.ehr_id,
        email: patient.patient_email,
      } as PatientDto);
    });

    describe(`Patient DOB is defined`, () => {
      test(`DOB is formatted correctly`, () => {
        const patient = buildMockDashboardPatient(true, { dob: '1994-09-22' });

        const result = patient.toPatientDto();

        expect(result.dob).toStrictEqual('09/22/1994');
      });
    });

    describe(`Patient DOB is not defined`, () => {
      test(`DOB is undefined`, () => {
        const patient = buildMockDashboardPatient(true, { dob: undefined });

        const result = patient.toPatientDto();

        expect(result.dob).toStrictEqual(undefined);
      });
    });
  });
});
