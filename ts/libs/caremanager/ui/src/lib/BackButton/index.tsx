import {
  Button,
  KeyboardBackspaceIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const styles = makeSxStyles({
  button: {
    color: (theme) => theme.palette.text.secondary,
    paddingLeft: 0,
    fontSize: 12,
    fontWeight: 400,
    lineHeight: '16px',
    marginBottom: 1,
  },
});

type Props = { testId?: string };

export const BackButton: React.FC<React.PropsWithChildren<Props>> = ({
  testId = 'episode-header',
  children,
}) => {
  const navigate = useNavigate();

  const handleClick = () => navigate(-1);

  return (
    <Button
      startIcon={<KeyboardBackspaceIcon />}
      size="small"
      sx={styles.button}
      onClick={handleClick}
      data-testid={`${testId}-back-button`}
    >
      {children}
    </Button>
  );
};
