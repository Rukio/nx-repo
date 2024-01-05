import MuiTypography, {
  TypographyProps as MuiTypographyProps,
} from '@mui/material/Typography';

export interface TypographyProps extends MuiTypographyProps {
  component?: string;
}

const Typography = (props: TypographyProps) => <MuiTypography {...props} />;

export default Typography;
