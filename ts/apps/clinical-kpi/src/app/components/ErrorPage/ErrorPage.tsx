import { AlertButton } from '@*company-data-covered*/clinical-kpi/ui';
import { AppBar } from '@*company-data-covered*/clinical-kpi/feature';

import { environment } from '../../../environments/environment';

const ErrorPage = () => {
  return (
    <>
      <AppBar stationURL={environment.stationURL} />
      <AlertButton
        text="Looks like something went wrong. Please check back later."
        buttonLink={environment.stationURL}
        buttonText="Continue to Dashboard"
      />
    </>
  );
};

export default ErrorPage;
