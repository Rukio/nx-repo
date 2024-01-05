import {
  AbbreviatedState,
  ConsentDefinitionLanguage,
} from '../../consents/domain/definition';

export class ConsentDefinitionsQuery {
  active?: boolean;
  state: AbbreviatedState;
  serviceLine: number;
  signerIds?: string[];
  languageId: ConsentDefinitionLanguage;
  required?: boolean;
}
