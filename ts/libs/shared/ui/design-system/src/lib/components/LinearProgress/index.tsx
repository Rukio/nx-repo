import MuiLinearProgress, {
  LinearProgressProps as MuiLinearProgressProps,
} from '@mui/material/LinearProgress';
import Typography, { TypographyProps } from '../Typography';

const Title = (props: TypographyProps) => {
  const { children, ...rest } = props;

  return (
    <Typography
      sx={{
        fontSize: '12px',
        mb: 1,
      }}
      {...rest}
    >
      {children}
    </Typography>
  );
};

const TitleUppercase = (props: TypographyProps) => {
  const { children, ...rest } = props;

  return (
    <Title textTransform="uppercase" {...rest}>
      {children}
    </Title>
  );
};

export interface LinearProgressProps extends MuiLinearProgressProps {
  title?: string;
  titleUppercase?: boolean;
}

const LinearProgress = ({
  title,
  titleUppercase,
  ...rest
}: LinearProgressProps) => {
  const TitleComponent = titleUppercase ? (
    <TitleUppercase>{title}</TitleUppercase>
  ) : (
    <Title>{title}</Title>
  );

  return (
    <>
      {!!title && TitleComponent}
      <MuiLinearProgress {...rest} />
    </>
  );
};

export default LinearProgress;
