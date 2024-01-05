import { FullScreen } from '@*company-data-covered*/caremanager/ui';
import { Box, Link, makeSxStyles } from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  link: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
});

export const SomethingWentWrong = () => (
  <FullScreen
    title="Something went wrong"
    message={
      <Box>
        <p data-testid="something-went-wrong-error-message">
          Please try again. If the issue persists, please contact
          support@*company-data-covered*.com.
        </p>
        <Link href="/" sx={styles.link}>
          Return to home
        </Link>
      </Box>
    }
    testId="something-went-wrong-mode"
  />
);
