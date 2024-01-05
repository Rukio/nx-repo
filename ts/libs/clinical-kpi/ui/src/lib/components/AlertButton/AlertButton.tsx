import {
  Button,
  Container,
  Alert,
  makeSxStyles,
  ErrorOutlineIcon,
  Typography,
} from '@*company-data-covered*/design-system';
import React from 'react';
import { ALERT_BUTTON_TEST_IDS } from './TestIds';

export type AlertButtonProps = {
  text: string;
  buttonText: string;
  buttonLink: string;
};

const makeStyles = () =>
  makeSxStyles({
    container: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      paddingTop: '5%',
      backgroundColor: 'inherit',
    },
    alert: {
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      width: 300,
      backgroundColor: 'inherit',
    },
    icon: {
      scale: '1.5',
    },
  });

const AlertButton: React.FC<AlertButtonProps> = ({
  text,
  buttonText,
  buttonLink,
}) => {
  const styles = makeStyles();

  return (
    <Container sx={styles.container}>
      <Alert
        sx={styles.alert}
        icon={<ErrorOutlineIcon color="action" sx={styles.icon} />}
        variant="outlined"
        message={
          <Typography
            data-testid={ALERT_BUTTON_TEST_IDS.TEXT}
            color="text.secondary"
            variant="body1"
          >
            {text}
          </Typography>
        }
      />
      <Button
        href={buttonLink}
        data-testid={ALERT_BUTTON_TEST_IDS.BUTTON}
        size="large"
        variant="contained"
      >
        {buttonText}
      </Button>
    </Container>
  );
};

export default AlertButton;
