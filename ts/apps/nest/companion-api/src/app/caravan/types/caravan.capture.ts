export interface CaravanConsentCapture {
  id: number;
  definition_id: number;
  document_image: unknown | null;
  episode_id: string;
  patient_id: string;
  reason_for_verbal?: string;
  revoked_at: string | null;
  service_line: string;
  signature_image: unknown | null; // TODO: update this type
  signer: string;
  verbal: boolean;
  visit_id: string;
  witness_1?: string; // TODO: is this undefined or null?
  witness_2?: string; // TODO: is this undefined or null?
}

export type CreateCaravanCapture = Omit<
  CaravanConsentCapture,
  'id' | 'revoked_at'
>;
