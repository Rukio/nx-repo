import statsig from 'statsig-js';
import { OnlineSelfSchedulingFlow } from '../OnlineSelfSchedulingFlow';
import { WebRequestFlow } from '../WebRequestFlow';

export const FlowOrchestrator = () => {
  const onlineSelfSchedulingFlow = statsig.getExperiment(
    'online_self_scheduling_flow'
  );

  const isOnlineSelfSchedulingFlowDisplayed = onlineSelfSchedulingFlow.get(
    'renderOnlineSelfSchedulingFlow',
    false
  );

  if (isOnlineSelfSchedulingFlowDisplayed) {
    return <OnlineSelfSchedulingFlow />;
  }

  return <WebRequestFlow />;
};
