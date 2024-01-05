import { FullScreen } from '@*company-data-covered*/caremanager/ui';

export const AccessDenied = () => {
  const TITLE = "You don't have access to this";
  const MESSAGE = 'To request access, please contact your manager.';

  return (
    <FullScreen title={TITLE} message={MESSAGE} testId="access-denied-mode" />
  );
};
