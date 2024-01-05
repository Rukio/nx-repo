import {
  preLoginInitialState,
  preLoginSlice,
  PRE_LOGIN_SLICE_KEY,
  selectIsPreLoginDataEmpty,
  selectPreLoginData,
  selectPreLoginIsRequesterRelationshipSelf,
  selectPreLoginPreferredEtaRange,
  selectPreLoginRequester,
  updatePrefferedEtaRangeFormField,
  updateRequesterFormField,
  selectPreLoginChannelItemId,
  updateChannelItemId,
} from './preLogin.slice';
import { setupTestStore } from '../../../testUtils';
import {
  mockPreLoginChannelItemId,
  mockPreLoginPreferredEtaRange,
  mockPreLoginRequester,
} from './mocks';

import { PreLoginState } from './types';
import { RelationToPatient } from '../../types';

describe('preLogin.slice', () => {
  it('should initialize default reducer state', () => {
    const state = preLoginSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(preLoginInitialState);
  });

  describe('reducers', () => {
    it('should update requester state on updateRequesterFormField action', () => {
      const { store } = setupTestStore();

      const initialRequester = selectPreLoginRequester(store.getState());
      expect(initialRequester).toEqual(preLoginInitialState.requester);

      store.dispatch(updateRequesterFormField(mockPreLoginRequester));
      const updatedPreLoginRequester = selectPreLoginRequester(
        store.getState()
      );
      expect(updatedPreLoginRequester).toEqual({
        isSymptomsConfirmChecked:
          mockPreLoginRequester.isSymptomsConfirmChecked,
        relationToPatient: mockPreLoginRequester.relationToPatient,
        symptoms: mockPreLoginRequester.symptoms,
      });
    });

    it('should update preferred eta range state on updatePrefferedEtaRangeFormField action', () => {
      const { store } = setupTestStore();

      const initialPreferredEtaRange = selectPreLoginPreferredEtaRange(
        store.getState()
      );
      expect(initialPreferredEtaRange).toEqual(
        preLoginInitialState.preferredEtaRange
      );

      store.dispatch(
        updatePrefferedEtaRangeFormField(mockPreLoginPreferredEtaRange)
      );
      const updatedPreLoginPreferredEtaRange = selectPreLoginPreferredEtaRange(
        store.getState()
      );
      expect(updatedPreLoginPreferredEtaRange).toEqual({
        startsAt: mockPreLoginPreferredEtaRange.startsAt,
        endsAt: mockPreLoginPreferredEtaRange.endsAt,
      });
    });

    it('should reset pre login slice state on persistor purge action', async () => {
      const mockPreLoginState: PreLoginState = {
        requester: mockPreLoginRequester,
        preferredEtaRange: mockPreLoginPreferredEtaRange,
        channelItemId: mockPreLoginChannelItemId,
      };
      const { store, persistor } = setupTestStore({
        [PRE_LOGIN_SLICE_KEY]: mockPreLoginState,
      });

      const initialPreLoginState = selectPreLoginData(store.getState());
      expect(initialPreLoginState).toEqual(
        expect.objectContaining(mockPreLoginState)
      );

      await persistor.purge();

      const updatedPreLoginState = selectPreLoginData(store.getState());
      expect(updatedPreLoginState).toEqual(
        expect.objectContaining(preLoginInitialState)
      );
    });

    it('should update channelItemId on updateChannelItemId action', () => {
      const { store } = setupTestStore();

      const initialChannelItemId = selectPreLoginChannelItemId(
        store.getState()
      );
      expect(initialChannelItemId).toEqual(preLoginInitialState.channelItemId);

      store.dispatch(updateChannelItemId(mockPreLoginChannelItemId));
      const updatedChannelItemId = selectPreLoginChannelItemId(
        store.getState()
      );
      expect(updatedChannelItemId).toEqual(mockPreLoginChannelItemId);
    });
  });

  describe('selectors', () => {
    describe('selectPreLoginIsRequesterRelationshipSelf', () => {
      it.each([
        {
          relationToPatient: RelationToPatient.Patient,
          expected: true,
        },
        {
          relationToPatient: RelationToPatient.Clinician,
          expected: false,
        },
        {
          relationToPatient: RelationToPatient.FamilyFriend,
          expected: false,
        },
        {
          relationToPatient: RelationToPatient.Other,
          expected: false,
        },
      ])(
        'should select correct isRequesterRelationshipSelf value for $relationToPatient',
        ({ relationToPatient, expected }) => {
          const { store } = setupTestStore({
            [preLoginSlice.name]: {
              ...preLoginInitialState,
              requester: {
                ...preLoginInitialState.requester,
                relationToPatient,
              },
            },
          });

          const result = selectPreLoginIsRequesterRelationshipSelf(
            store.getState()
          );
          expect(result).toBe(expected);
        }
      );
    });

    describe('selectIsPreLoginDataEmpty', () => {
      it.each([
        {
          preLoginState: {
            ...preLoginInitialState,
            requester: mockPreLoginRequester,
          },
          expected: false,
        },
        {
          preLoginState: preLoginInitialState,
          expected: true,
        },
      ])('should select correct value', ({ preLoginState, expected }) => {
        const { store } = setupTestStore({
          [preLoginSlice.name]: preLoginState,
        });

        const result = selectIsPreLoginDataEmpty(store.getState());
        expect(result).toBe(expected);
      });
    });
  });
});
