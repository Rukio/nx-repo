import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useIdleTimerContext } from 'react-idle-timer';
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@*company-data-covered*/design-system';
import { TIMER_TIMEOUT } from '@*company-data-covered*/caremanager/utils';

type IdleDialogProps = {
  isOpen: boolean;
};

const IdleDialog: FC<IdleDialogProps> = ({ isOpen }) => {
  const interval = useRef<NodeJS.Timeout>();
  const { getRemainingTime, reset } = useIdleTimerContext();
  const [remainingTime, setRemainingTime] = useState({
    minutes: 0,
    seconds: 0,
  });

  const calculateRemainingTime = useCallback(() => {
    const remainingMilliseconds = getRemainingTime();
    setRemainingTime({
      minutes: Math.floor(remainingMilliseconds / 1000 / 60),
      seconds: Math.floor((remainingMilliseconds / 1000) % 60),
    });
  }, [getRemainingTime]);

  useEffect(() => {
    if (isOpen) {
      calculateRemainingTime();
      interval.current = setInterval(() => {
        calculateRemainingTime();
      }, 1000);
    }
    if (interval.current && !isOpen) {
      clearInterval(interval.current);
      reset();
    }

    return () => interval.current && clearInterval(interval.current);
  }, [isOpen, calculateRemainingTime, reset]);

  const remainingTimeLabel = `${remainingTime.minutes} minutes and ${
    remainingTime.seconds === 60 ? 0 : remainingTime.seconds
  } seconds`;

  return (
    <Dialog open={isOpen} data-testid="idle-logout-modal">
      <DialogTitle
        id="alert-dialog-title"
        data-testid="idle-logout-modal-title"
      >
        Inactivity Log Out
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          <Typography variant="body2" data-testid="idle-logout-modal-message">
            For security reasons Dispatch Health sessions automatically end
            after {TIMER_TIMEOUT} minutes of inactivity.
          </Typography>
          <Typography variant="body2">Click anywhere to continue</Typography>
          <Typography
            variant="body2"
            mt={2}
            data-testid="idle-logout-modal-countdown"
          >
            <strong>Your session will expire in {remainingTimeLabel}</strong>
          </Typography>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default IdleDialog;
