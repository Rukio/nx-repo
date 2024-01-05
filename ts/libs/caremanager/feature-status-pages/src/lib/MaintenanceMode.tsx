import { FullScreen } from '@*company-data-covered*/caremanager/ui';

export const MaintenanceMode = () => {
  const TITLE = 'Care Manager is under Maintenance';
  const DEFAULT_MESSAGE = 'Please check back in a bit.';

  return (
    <FullScreen
      title={TITLE}
      message={DEFAULT_MESSAGE}
      testId="maintenance-mode"
    />
  );
};
