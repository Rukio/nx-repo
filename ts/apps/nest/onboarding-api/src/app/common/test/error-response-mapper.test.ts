import errorMapper from '../error-response-mapper';

describe('Error Response mapper', () => {
  it('should map correctly', () => {
    const data = errorMapper.TransformErrors({
      street_address_1: ["can't be blank."],
      city: ["can't be blank."],
      state: ["can't be blank."],
      latitude: ["can't be blank."],
      longitude: ["can't be blank."],
      chief_complaint: ["can't be blank."],
      'patient.first_name': ["can't be blank."],
      'patient.last_name': ["can't be blank."],
      'patient.mobile_number': ["can't be blank."],
      'patient.dob': ["can't be blank."],
      'patient.gender': ["can't be blank."],
      'patient.ehr_id': ["can't be blank."],
      'patient.voicemail_consent': ["can't be blank."],
      'risk_assessment.protocol_name': ["can't be blank."],
      'onboarding/mpoa_consent.consented': ["can't be false."],
    });
    expect(data).toEqual([
      "StreetAddress can't be blank.",
      "city can't be blank.",
      "state can't be blank.",
      "latitude can't be blank.",
      "longitude can't be blank.",
      "Complaint can't be blank.",
      "Patient's first name can't be blank.",
      "Patient's last name can't be blank.",
      "Patient's Phone Number can't be blank.",
      "Patient's dob can't be blank.",
      "Patient's gender can't be blank.",
      "Patient's EHR id can't be blank.",
      "Patient's Voicemail consent can't be blank.",
      "Risk Assessment can't be blank.",
      "Patient's MPOA consent can't be false.",
    ]);
  });

  it('should map to a single item in an array', () => {
    const data = errorMapper.TransformErrors('Test');
    expect(data).toEqual(['Test']);
  });

  it('should return empty array when errorList is null or undefined', () => {
    expect(errorMapper.TransformErrors(null)).toEqual(undefined);
    expect(errorMapper.TransformErrors(undefined)).toEqual(undefined);
  });
});
