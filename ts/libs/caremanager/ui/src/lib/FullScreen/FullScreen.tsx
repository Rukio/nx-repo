import { isValidElement } from 'react';
import { Box, Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import { assets } from '../assets';

const MAIN_PADDING = '10%';
const CONTENT_PADDING_TOP_MOBILE = '30%';
const LOGO_WIDTH = '200px';

const styles = makeSxStyles({
  container: { display: 'flex', justifyContent: 'space-between' },
  leftContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  verticalLayoutContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: MAIN_PADDING,
    height: '100%',
  },
  verticalCenterContainer: {
    flexGrow: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: { sm: 0, xs: CONTENT_PADDING_TOP_MOBILE },
  },
  sideBar: { display: { xs: 'none', sm: 'block' }, img: { height: '100vh' } },
  bottomBar: {
    display: { xs: 'block', sm: 'none' },
    position: 'absolute',
    bottom: 0,
    lineHeight: 0,
    img: { bottomBarImg: { width: '100vw' } },
  },
});

type FullScreenProps = {
  title: string;
  message: string | React.ReactElement;
  testId: string;
};

export const FullScreen = ({ title, message, testId }: FullScreenProps) => (
  <Box sx={styles.container} data-testid={testId}>
    <Box sx={styles.leftContainer}>
      <Box sx={styles.verticalLayoutContainer}>
        <Box data-testid={`${testId}-logo`}>
          <img
            alt="logo"
            src={assets.DHLogoInline}
            style={{ width: LOGO_WIDTH }}
          />
        </Box>
        <Box sx={styles.verticalCenterContainer}>
          <Box sx={{ margin: 'auto 0' }}>
            <Typography
              variant="h3"
              gutterBottom
              data-testid={`${testId}-title`}
            >
              {title}
            </Typography>
            {isValidElement(message) ? (
              message
            ) : (
              <Typography variant="body1" data-testid={`${testId}-message`}>
                {message}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={styles.bottomBar}>
        <img alt="bottom bar" src={assets.abstractBottomBar} />
      </Box>
    </Box>
    <Box sx={styles.sideBar}>
      <img alt="side bar" src={assets.abstractSideBar} />
    </Box>
  </Box>
);
