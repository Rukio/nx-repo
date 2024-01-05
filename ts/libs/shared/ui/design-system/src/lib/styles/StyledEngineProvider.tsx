import MuiStyledEngineProvider, {
  StyledEngineProviderProps as MuiStyledEngineProviderProps,
} from '@mui/styled-engine/StyledEngineProvider';

export type StyledEngineProviderProps = MuiStyledEngineProviderProps;

const StyledEngineProvider = (props: StyledEngineProviderProps) => (
  <MuiStyledEngineProvider {...props} />
);

export default StyledEngineProvider;
