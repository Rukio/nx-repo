import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  initDatadogRum,
  initDatadogLogs,
} from '@*company-data-covered*/shared/datadog/util';
import { StatsigProvider } from '@*company-data-covered*/statsig/feature';
import { LayoutLoader } from '@*company-data-covered*/consumer-web/web-request/ui';
import { SegmentProvider } from '@*company-data-covered*/segment/feature';
import { environment } from '../environments/environment';
import {
  datadogInitConfiguration,
  statsigOptions,
  segmentLoadOptions,
} from './constants';
import { FlowOrchestrator } from '../flows';

export const App = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    initDatadogRum({
      ...datadogInitConfiguration,
      applicationId: environment.datadogApplicationId,
      trackResources: true,
      trackLongTasks: true,
      trackUserInteractions: true,
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100,
    });

    initDatadogLogs(datadogInitConfiguration);
  }, []);

  return (
    <StatsigProvider
      clientKey={environment.statsigClientKey}
      options={statsigOptions}
      user={{
        privateAttributes: {
          referrer: document.referrer,
          marketId: searchParams.get('market') ?? '',
        },
      }}
      loadingComponent={<LayoutLoader />}
    >
      <SegmentProvider loadOptions={segmentLoadOptions}>
        <FlowOrchestrator />
      </SegmentProvider>
    </StatsigProvider>
  );
};

export default App;
