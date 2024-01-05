export interface CaravanConsentDefinition {
  id: number;
  active: boolean;
  all_service_lines: boolean;
  all_states: boolean;
  capture_method_id: number;
  category_id: number;
  document_content: string;
  expires_number: number;
  expires_unit: string;
  frequency_id: number;
  language_id: number;
  name: string;
  required: boolean;
  revocable: boolean;
  service_lines: number[];
  signer_ids: number[];
  states: string[];
  version_name: string;
}
