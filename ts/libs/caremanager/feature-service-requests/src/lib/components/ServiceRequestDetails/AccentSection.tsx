import {
  Box,
  SxProps,
  Theme,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: {
    backgroundColor: (theme) => theme.palette.grey[50],
    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
  },
});

type Props = {
  sx?: SxProps<Theme>;
  'data-testid'?: string;
};

export const AccentSection: React.FC<React.PropsWithChildren<Props>> = ({
  sx,
  'data-testid': testId,
  children,
}) => (
  <Box sx={{ ...styles.container, ...sx }} data-testid={testId}>
    {children}
  </Box>
);
