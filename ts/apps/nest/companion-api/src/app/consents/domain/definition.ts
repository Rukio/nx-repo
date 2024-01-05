import { Expose } from 'class-transformer';

export type AbbreviatedState = string;

export enum ConsentDefinitionLanguage {
  ENGLISH = 1,
  SPANISH = 2,
}

export class Definition {
  @Expose()
  id: number;

  @Expose()
  active: boolean;

  @Expose({ name: 'all_service_lines', toPlainOnly: true })
  allServiceLines: boolean;

  @Expose({ name: 'all_states', toPlainOnly: true })
  allStates: boolean;

  @Expose({ name: 'capture_method_id', toPlainOnly: true })
  captureMethodId: number;

  @Expose({ name: 'category_id', toPlainOnly: true })
  categoryId: number;

  @Expose({ name: 'document_content', toPlainOnly: true })
  documentContent: string;

  @Expose({ name: 'expires_number', toPlainOnly: true })
  expiresNumber: number;

  @Expose({ name: 'expires_unit', toPlainOnly: true })
  expiresUnit: string; // TODO: see if we can make a string literal for this

  @Expose({ name: 'frequency_id', toPlainOnly: true })
  frequencyId: number;

  @Expose({ name: 'language_id', toPlainOnly: true })
  languageId: number;

  @Expose()
  name: string;

  @Expose()
  required: boolean;

  @Expose()
  revocable: boolean;

  @Expose({ name: 'service_lines', toPlainOnly: true })
  serviceLines: number[];

  @Expose({ name: 'signer_ids', toPlainOnly: true })
  signerIds: number[];

  @Expose()
  states: AbbreviatedState[];

  @Expose({ name: 'version_name', toPlainOnly: true })
  versionName: string;
}
