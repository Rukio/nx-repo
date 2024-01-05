import { State } from '../../lib/types';
import * as faker from 'faker';

export const getStatesMock = (
  statesCount: number,
  billingCitiesCount: number
): State[] =>
  Array(statesCount)
    .fill(0)
    .map((_, index) => ({
      id: String(index),
      name: faker.address.state(),
      abbreviation: faker.address.stateAbbr(),
      billingCities: Array(billingCitiesCount)
        .fill(0)
        .map((__, cityIndex) => ({
          id: String(cityIndex),
          name: faker.address.cityName(),
          shortName: faker.address.state(),
        })),
    }));
