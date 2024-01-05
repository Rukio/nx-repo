import statsig from 'statsig-js';
import { StatsigExperiments } from '../../utils';

export interface UserFlow {
  renderHowItWorksPage: boolean;
  renderScheduleTimeWindow: boolean;
}

const useUserFlow = (): UserFlow => {
  const isOrganicTrafficGroup = statsig.checkGate('organic_traffic_group');

  const isScheduleTimeWindowExperimentEnabled = statsig
    .getExperiment(
      StatsigExperiments.web_request_schedule_time_window_page.name
    )
    .get(
      StatsigExperiments.web_request_schedule_time_window_page.params
        .render_time_window_page,
      false
    );

  return {
    renderHowItWorksPage: isOrganicTrafficGroup,
    renderScheduleTimeWindow: isScheduleTimeWindowExperimentEnabled,
  };
};

export default useUserFlow;
