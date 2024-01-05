import { PersistPartial } from 'redux-persist/es/persistReducer';
import { PreLoginState } from '..';
import { RelationToPatient } from '../../types';

export const mockPreLoginRequester: PreLoginState['requester'] = {
  relationToPatient: RelationToPatient.Patient,
  symptoms: 'Cough',
  isSymptomsConfirmChecked: true,
};

export const mockPreLoginPreferredEtaRange: PreLoginState['preferredEtaRange'] =
  {
    startsAt: '2023-07-05T12:00:00-04:00',
    endsAt: '2023-07-05T17:00:00-04:00',
  };

export const mockPersistPartial: PersistPartial = {
  _persist: { version: 1, rehydrated: true },
};

export const mockPreLoginChannelItemId: PreLoginState['channelItemId'] =
  '123456';
