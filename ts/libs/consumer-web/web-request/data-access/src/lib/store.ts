import { stationApiSlice } from '@*company-data-covered*/station/data-access';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import {
  PersistConfig,
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';
import storage from 'redux-persist/lib/storage';
import {
  requestSlice,
  RequestState,
  careRequestsConfigurationSlice,
} from './feature';

const persistConfig: PersistConfig<RequestState> = {
  key: 'root',
  storage,
  stateReconciler: hardSet,
};

export const store = configureStore({
  reducer: {
    [stationApiSlice.reducerPath]: stationApiSlice.reducer,
    [careRequestsConfigurationSlice.name]:
      careRequestsConfigurationSlice.reducer,
    [requestSlice.name]: persistReducer<RequestState>(
      persistConfig,
      requestSlice.reducer
    ),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(stationApiSlice.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default { store, persistor };
