import MuiLoadingButton, {
  LoadingButtonProps as MuiLoadingButtonProps,
} from '@mui/lab/LoadingButton';

export type LoadingButtonProps = MuiLoadingButtonProps;

const LoadingButton = (props: LoadingButtonProps) => (
  <MuiLoadingButton {...props} />
);

export default LoadingButton;
