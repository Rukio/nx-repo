import {
  Container,
  ContainerProps,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: {
    marginBottom: {
      xs: 5,
      md: 0,
    },
  },
});

export const PageContainer: React.FC<
  React.PropsWithChildren<ContainerProps>
> = ({ sx, children, ...props }) => (
  <Container
    sx={{
      ...styles.container,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Container>
);
