import { RelationToPatient } from '../../types';

type PreLoginEtaRange = {
  startsAt?: string;
  endsAt?: string;
};

type PreLoginRequester = {
  relationToPatient: RelationToPatient;
  symptoms: string;
  isSymptomsConfirmChecked: boolean;
};

export type PreLoginState = {
  requester: PreLoginRequester;
  preferredEtaRange: PreLoginEtaRange;
  channelItemId: string;
};
