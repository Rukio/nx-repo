import {
  LocalizationProviderProps as MuiLocalizationProviderProps,
  LocalizationProvider as MuiLocalizationProvider,
} from '@mui/x-date-pickers';
import AdapterDateFns from '../AdapterDateFns';

export type LocalizationProviderProps = Omit<
  MuiLocalizationProviderProps,
  'dateAdapter' | 'dateLibInstance'
>;

/** The MUI LocalizationProvider with the date-fns adapter loaded. */
const LocalizationProvider = (props: LocalizationProviderProps) => (
  <MuiLocalizationProvider dateAdapter={AdapterDateFns} {...props} />
);

export default LocalizationProvider;
