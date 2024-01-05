export type UserActor = {
  type: 'user';
  properties: {
    id?: string;
    email?: string;
    identity_provider_user_id?: string;
    groups?: Array<string>;
    roles?: Array<string>;
    markets?: Array<number>;
    market_role?: string;
  };
};

export type M2MActor = {
  type: 'm2m';
  properties: {
    client_name: string;
  };
};

export type PatientActor = {
  type: 'patient';
  properties: {
    email?: string;
    identity_provider_user_id?: string;
  };
};

export type ProviderActor = {
  type: 'provider';
  properties: {
    provider_type: string;
    groups: Array<string>;
  };
};

export type PolicyActor = UserActor | M2MActor | PatientActor | ProviderActor;
