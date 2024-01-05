import { SignerRelationToPatient } from '../../consents/dto/signature.dto';

export interface DashboardMedicationHistoryConsent {
  medical_history_consent: {
    /** The name of the signer. */
    signed_by: string;

    /**
     * The times at which the consent was signed in ISO 8061 format.
     *
     * @example '2021-07-08T20:39:08.305Z'
     */
    signed_at: string;

    /** The value indicating if consent was provided or explicitly not provided. */
    consent_given: boolean;

    /** Indicates who the signer is in relation to the patient. */
    consent_given_by?: SignerRelationToPatient;
  };
}
