import { setupTestStore } from '../../../testUtils';
import {
  mockAddress,
  mockCaller,
  mockComplaint,
  mockPatient,
  mockPatientPreferredEta,
} from './mocks';
import {
  requestInitialState,
  requestSlice,
  resetRequestState,
  selectAddress,
  selectCaller,
  selectComplaint,
  selectPatient,
  selectPatientPreferredEta,
  selectRequest,
  setAddress,
  setCaller,
  setComplaint,
  setPatient,
  setPatientPreferredEta,
} from './request.slice';

describe('request.slice', () => {
  it('should initialize default reducer state', () => {
    const state = requestSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(requestInitialState);
  });

  describe('reducers', () => {
    it('setAddress should update address state', () => {
      const store = setupTestStore();

      const initialAddress = selectAddress(store.getState());
      expect(initialAddress).toEqual(requestInitialState.address);

      store.dispatch(setAddress(mockAddress));
      const updatedAddress = selectAddress(store.getState());
      expect(updatedAddress).toEqual({
        streetAddress1: mockAddress.streetAddress1,
        streetAddress2: mockAddress.streetAddress2,
        city: mockAddress.city,
        state: mockAddress.state,
        postalCode: mockAddress.postalCode,
      });
    });

    it('setComplaint should update complaint state', () => {
      const store = setupTestStore();

      const initialComplaint = selectComplaint(store.getState());
      expect(initialComplaint).toEqual(requestInitialState.complaint);

      store.dispatch(setComplaint(mockComplaint));
      const updatedComplaint = selectComplaint(store.getState());
      expect(updatedComplaint).toEqual({
        symptoms: mockComplaint.symptoms,
      });
    });

    it('setPatient should update patient state', () => {
      const store = setupTestStore();

      const initialPatient = selectPatient(store.getState());
      expect(initialPatient).toEqual(requestInitialState.patient);

      store.dispatch(setPatient(mockPatient));
      const updatedPatient = selectPatient(store.getState());
      expect(updatedPatient).toEqual({
        birthday: mockPatient.birthday,
        email: mockPatient.email,
        firstName: mockPatient.firstName,
        lastName: mockPatient.lastName,
        phone: mockPatient.phone,
        sex: mockPatient.sex,
      });
    });

    it('setCaller should update caller state', () => {
      const store = setupTestStore();

      const initialCaller = selectCaller(store.getState());
      expect(initialCaller).toEqual(requestInitialState.caller);

      store.dispatch(setCaller(mockCaller));
      const updatedCaller = selectCaller(store.getState());
      expect(updatedCaller).toEqual({
        relationshipToPatient: mockCaller.relationshipToPatient,
        firstName: mockCaller.firstName,
        lastName: mockCaller.lastName,
        phone: mockCaller.phone,
      });
    });

    it('setPatientPreferredEta should update patientPreferredEta state', () => {
      const store = setupTestStore();

      const initialPatientPreferredEta = selectPatientPreferredEta(
        store.getState()
      );
      expect(initialPatientPreferredEta).toEqual(
        requestInitialState.patientPreferredEta
      );

      store.dispatch(setPatientPreferredEta(mockPatientPreferredEta));
      const updatedPatientPreferredEta = selectPatientPreferredEta(
        store.getState()
      );
      expect(updatedPatientPreferredEta).toEqual({
        patientPreferredEtaStart:
          mockPatientPreferredEta.patientPreferredEtaStart,
        patientPreferredEtaEnd: mockPatientPreferredEta.patientPreferredEtaEnd,
      });
    });

    it('resetRequestState should reset state', () => {
      const store = setupTestStore();

      const initialRequest = selectRequest(store.getState());
      expect(initialRequest).toEqual(requestInitialState);

      store.dispatch(setAddress(mockAddress));
      store.dispatch(setComplaint(mockComplaint));
      store.dispatch(setPatient(mockPatient));
      store.dispatch(setCaller(mockCaller));
      store.dispatch(setPatientPreferredEta(mockPatientPreferredEta));

      const updatedRequest = selectRequest(store.getState());
      expect(updatedRequest).toEqual({
        patient: mockPatient,
        caller: mockCaller,
        complaint: mockComplaint,
        address: mockAddress,
        patientPreferredEta: mockPatientPreferredEta,
      });

      store.dispatch(resetRequestState());

      const resetRequest = selectRequest(store.getState());
      expect(resetRequest).toEqual(requestInitialState);
    });
  });
});
