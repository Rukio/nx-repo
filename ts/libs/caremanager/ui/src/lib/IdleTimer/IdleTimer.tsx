import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { IdleTimerProvider } from 'react-idle-timer';
import {
  TIMER_UNTIL_IDLE,
  TIMER_UNTIL_PROMPT,
} from '@*company-data-covered*/caremanager/utils';
import IdleDialog from './IdleDialog';

export const IdleTimer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { logout } = useAuth0();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onLogout = async () => {
    setIsDialogOpen(false);
    await logout({ logoutParams: { returnTo: window.location.origin } });
  };
  const onOpenDialog = () => setIsDialogOpen(true);
  const onCloseDialog = () => setIsDialogOpen(false);

  return (
    <IdleTimerProvider
      timeout={TIMER_UNTIL_PROMPT * 60 * 1000}
      onIdle={onLogout}
      onPrompt={onOpenDialog}
      promptTimeout={TIMER_UNTIL_IDLE * 60 * 1000}
      onAction={onCloseDialog}
      events={['mousedown']}
    >
      <IdleDialog isOpen={isDialogOpen} />
      {children}
    </IdleTimerProvider>
  );
};
