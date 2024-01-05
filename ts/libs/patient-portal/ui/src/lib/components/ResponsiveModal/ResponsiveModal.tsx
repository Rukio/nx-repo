import { FC, PropsWithChildren } from 'react';
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  CloseIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { Drawer } from '../Drawer';
import { Modal } from '../Modal';
import { RESPONSIVE_MODAL_TEST_IDS } from './testIds';

export type ResponsiveModalProps = PropsWithChildren<{
  testIdPrefix: string;
  open: boolean;
  onClose: () => void;
  title: string;
}>;

const makeStyles = () =>
  makeSxStyles({
    headerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

const ResponsiveModal: FC<ResponsiveModalProps> = ({
  children,
  onClose,
  open,
  title,
  testIdPrefix,
}) => {
  const styles = makeStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const ContentWrapper = isMobile ? Drawer : Modal;

  return (
    <ContentWrapper testIdPrefix={testIdPrefix} open={open} onClose={onClose}>
      <>
        <Box sx={styles.headerContainer}>
          <Typography
            data-testid={RESPONSIVE_MODAL_TEST_IDS.getResponsiveModalTitleTestId(
              testIdPrefix
            )}
            variant="h5"
          >
            {title}
          </Typography>
          <IconButton
            data-testid={RESPONSIVE_MODAL_TEST_IDS.getResponsiveCloseButtonTestId(
              testIdPrefix
            )}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {children}
      </>
    </ContentWrapper>
  );
};

export default ResponsiveModal;
