import { PatientPreferredEta } from '@*company-data-covered*/consumer-web-types';
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import {
  RequestAddress,
  RequestCaller,
  RequestComplaint,
  RequestPatient,
  RequestState,
} from './types';

export const REQUEST_KEY = 'request';

export const requestInitialState: RequestState = {
  patient: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    sex: '',
  },
  caller: {
    relationshipToPatient: '',
    firstName: '',
    lastName: '',
    phone: '',
  },
  complaint: {
    symptoms: '',
  },
  address: {
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    state: '',
    postalCode: '',
  },
  patientPreferredEta: {
    patientPreferredEtaStart: '',
    patientPreferredEtaEnd: '',
  },
};

export const requestSlice = createSlice({
  name: REQUEST_KEY,
  initialState: requestInitialState,
  reducers: {
    setAddress(state, action: PayloadAction<RequestAddress>) {
      state.address = action.payload;
    },
    setComplaint(state, action: PayloadAction<RequestComplaint>) {
      state.complaint = action.payload;
    },
    setPatient(state, action: PayloadAction<Partial<RequestPatient>>) {
      state.patient = { ...state.patient, ...action.payload };
    },
    setCaller(state, action: PayloadAction<Partial<RequestCaller>>) {
      state.caller = { ...state.caller, ...action.payload };
    },
    setPatientPreferredEta(
      state,
      action: PayloadAction<Partial<PatientPreferredEta>>
    ) {
      state.patientPreferredEta = {
        ...state.patientPreferredEta,
        ...action.payload,
      };
    },
    resetRequestState() {
      return requestInitialState;
    },
  },
});

export const selectRequest = createSelector(
  (state: RootState) => state[REQUEST_KEY],
  (requestState) => requestState
);

export const selectAddress = createSelector(
  selectRequest,
  (requestState) => requestState.address
);

export const selectComplaint = createSelector(
  selectRequest,
  (requestState) => requestState.complaint
);

export const selectCaller = createSelector(
  selectRequest,
  (requestState) => requestState.caller
);

export const selectPatient = createSelector(
  selectRequest,
  (requestState) => requestState.patient
);

export const selectPatientPreferredEta = createSelector(
  selectRequest,
  (requestState) => requestState.patientPreferredEta
);

export const {
  setAddress,
  setComplaint,
  setPatient,
  setCaller,
  setPatientPreferredEta,
  resetRequestState,
} = requestSlice.actions;
