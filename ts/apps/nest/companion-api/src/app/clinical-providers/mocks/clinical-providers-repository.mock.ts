import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { ClinicalProvidersRepository } from '../clinical-providers.repository';

beforeEach(() => {
  mockReset(mockClinicalProvidersRepository);
});

export type MockClinicalProvidersRepository =
  MockProxy<ClinicalProvidersRepository>;

export const mockClinicalProvidersRepository =
  mockDeep<ClinicalProvidersRepository>();
