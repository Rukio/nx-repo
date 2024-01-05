import { NetworkModalityConfig } from '../../lib/types';

export const getModalitiesMock = (): {
  id: string;
  displayName: string;
  type: string;
}[] => [
  { id: '0', displayName: 'In-person', type: 'in_person' },
  { id: '1', displayName: 'Telepresentation', type: 'telepresentation' },
  { id: '2', displayName: 'Virtual', type: 'virtual' },
];

export const getMockedNetworkModalityConfigsList = (
  modalitiesCount: number
): NetworkModalityConfig[] =>
  Array(modalitiesCount)
    .fill(0)
    .map((_, index) => ({
      id: String(index),
      serviceLineId: String(index),
      networkId: String(index),
      modalityId: String(index),
      billingCityId: String(index),
    }));
