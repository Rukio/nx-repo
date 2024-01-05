const TransformErrors = (errorList): Array<string> => {
  const errorMessage = [];

  if (!errorList) {
    return undefined;
  }

  if (typeof errorList === 'string') {
    return [errorList];
  }

  for (const [key, value] of Object.entries<Array<string>>(errorList)) {
    value.forEach((message) => {
      switch (key) {
        case 'street_address_1':
          errorMessage.push(`StreetAddress ${message}`);
          break;
        case 'chief_complaint':
          errorMessage.push(`Complaint ${message}`);
          break;
        case 'patient.first_name':
          errorMessage.push(`Patient's first name ${message}`);
          break;
        case 'patient.last_name':
          errorMessage.push(`Patient's last name ${message}`);
          break;
        case 'patient.dob':
          errorMessage.push(`Patient's dob ${message}`);
          break;
        case 'patient.mobile_number':
          errorMessage.push(`Patient's Phone Number ${message}`);
          break;
        case 'patient.gender':
          errorMessage.push(`Patient's gender ${message}`);
          break;
        case 'patient.ehr_id':
          errorMessage.push(`Patient's EHR id ${message}`);
          break;
        case 'patient.voicemail_consent':
          errorMessage.push(`Patient's Voicemail consent ${message}`);
          break;
        case 'risk_assessment.protocol_name':
          errorMessage.push(`Risk Assessment ${message}`);
          break;
        case 'onboarding/mpoa_consent.consented':
          errorMessage.push(`Patient's MPOA consent ${message}`);
          break;
        default:
          errorMessage.push(`${key} ${message}`);
          break;
      }
    });
  }

  return errorMessage;
};

export default {
  TransformErrors,
};
