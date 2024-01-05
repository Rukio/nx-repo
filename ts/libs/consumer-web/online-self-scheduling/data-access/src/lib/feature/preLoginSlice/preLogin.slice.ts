import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PURGE } from 'redux-persist';
import { RootState } from '../../store';
import { RelationToPatient } from '../../types';
import { PreLoginState } from './types';

export const PRE_LOGIN_SLICE_KEY = 'preLogin';

export const preLoginInitialState: PreLoginState = {
  requester: {
    relationToPatient: RelationToPatient.Patient,
    symptoms: '',
    isSymptomsConfirmChecked: false,
  },
  channelItemId: '',
  preferredEtaRange: {},
};

export const preLoginSlice = createSlice({
  name: PRE_LOGIN_SLICE_KEY,
  initialState: preLoginInitialState,
  reducers: {
    updateRequesterFormField(
      state,
      action: PayloadAction<Partial<PreLoginState['requester']>>
    ) {
      state.requester = {
        ...state.requester,
        ...action.payload,
      };
    },
    updatePrefferedEtaRangeFormField(
      state,
      action: PayloadAction<Partial<PreLoginState['preferredEtaRange']>>
    ) {
      state.preferredEtaRange = {
        ...state.preferredEtaRange,
        ...action.payload,
      };
    },
    updateChannelItemId(
      state,
      action: PayloadAction<PreLoginState['channelItemId']>
    ) {
      state.channelItemId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(PURGE, () => {
      return preLoginInitialState;
    });
  },
});

export const selectPreLoginData = createSelector(
  (state: RootState) => state[PRE_LOGIN_SLICE_KEY],
  (preLoginState) => preLoginState
);

export const selectPreLoginRequester = createSelector(
  selectPreLoginData,
  (preLoginState) => preLoginState.requester
);

export const selectPreLoginIsRequesterRelationshipSelf = createSelector(
  selectPreLoginData,
  (preLoginState) =>
    preLoginState.requester.relationToPatient === RelationToPatient.Patient
);

export const selectPreLoginPreferredEtaRange = createSelector(
  selectPreLoginData,
  (preLoginState) => preLoginState.preferredEtaRange
);

export const selectPreLoginChannelItemId = createSelector(
  selectPreLoginData,
  (preLoginState) => preLoginState.channelItemId
);

export const selectIsPreLoginDataEmpty = createSelector(
  selectPreLoginData,
  (preLoginState) =>
    preLoginState.requester.relationToPatient ===
      preLoginInitialState.requester.relationToPatient &&
    preLoginState.requester.symptoms ===
      preLoginInitialState.requester.symptoms &&
    preLoginState.preferredEtaRange.startsAt ===
      preLoginInitialState.preferredEtaRange.startsAt &&
    preLoginState.preferredEtaRange.endsAt ===
      preLoginInitialState.preferredEtaRange.endsAt
);

export const {
  updateRequesterFormField,
  updatePrefferedEtaRangeFormField,
  updateChannelItemId,
} = preLoginSlice.actions;
