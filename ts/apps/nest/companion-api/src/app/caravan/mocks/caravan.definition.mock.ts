import { instanceToPlain } from 'class-transformer';
import { Definition } from '../../consents/domain/definition';
import { buildMockConsentDefinition } from '../../consents/mocks/definition.mock';
import { CaravanConsentDefinition } from '../types/caravan.definition';

export function buildMockCaravanConsentDefinition(
  init: Partial<Definition> = {}
): CaravanConsentDefinition {
  return instanceToPlain(
    buildMockConsentDefinition(init)
  ) as CaravanConsentDefinition;
}
