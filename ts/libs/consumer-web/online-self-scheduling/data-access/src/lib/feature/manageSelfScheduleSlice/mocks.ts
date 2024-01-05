import { RelationToPatient } from '../../types';
import { CreateSelfSchedulingCareRequestPayload } from './types';

export const mockCreateSelfSchedulingCareRequestPayload: CreateSelfSchedulingCareRequestPayload =
  {
    careRequest: {
      patientId: 1,
      marketId: 1,
      placeOfService: 'Home',
      address: {
        city: 'Denver',
        state: 'CO',
        zip: '80216-4656',
        streetAddress1: '6211 E 42nd Ave',
        streetAddress2: '',
      },
      complaint: {
        symptoms: 'cough',
      },
      channelItemId: 1,
      requester: {
        firstName: 'John',
        lastName: 'Doe',
        relationToPatient: RelationToPatient.Patient,
        phone: '1234567890',
        organizationName: 'Digital',
      },
      patientPreferredEta: {
        patientPreferredEtaStart: '2023-07-05T12:00:00-04:00',
        patientPreferredEtaEnd: '2023-07-05T17:00:00-04:00',
      },
    },
    riskAssessment: {
      dob: '1901-01-10',
      gender: 'Male',
      overrideReason: 'General Complaint',
      protocolId: 0,
      protocolName: 'General Complaint',
      responses: {
        questions: [
          {
            weightYes: 5.5,
            weightNo: 0,
            required: false,
            protocolId: 111,
            order: 0,
            name: 'Due to the recent Coronavirus world-wide concerns we are screening patients for potential exposure. Have you tested positive for COVID-19?',
            id: 123232,
            allowNa: false,
            answer: 'No',
            hasNotes: false,
          },
        ],
      },
      score: 5,
      worstCaseScore: 0,
      complaint: {
        symptom: 'Vision problem',
        selectedSymptoms: 'Headache',
      },
    },
    mpoaConsent: {
      powerOfAttorneyId: 90380,
    },
  };
