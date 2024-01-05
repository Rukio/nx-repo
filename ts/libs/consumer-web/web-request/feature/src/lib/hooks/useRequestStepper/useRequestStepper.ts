import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { useSelector } from 'react-redux';
import { UserFlow, useUserFlow } from '../useUserFlow';
import { useLocation } from 'react-router-dom';
import {
  getLocalStorageItem,
  LocalStorageKeys,
  selectAddress,
  selectAddressAvailability,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { getRoutesByUserFlow } from '../../utils';
import { format } from 'date-fns';

const INITIAL_PROGRESS_STEP = 10;

type RequestStepName =
  | 'requestContact'
  | 'requestAddress'
  | 'requestCareFor'
  | 'requestPersonalInfo'
  | 'requestHelp'
  | 'requestDetails'
  | 'requestPreferredTime'
  | 'howItWorks';

type RequestSteps = {
  [key in RequestStepName]: {
    stepCount: number;
    href: string;
  };
};

interface NeededRequestStep {
  stepCount: number;
  href: string;
  backBtnText?: string;
}

const getNeededSteps = ({
  requestSteps,
  userFlow,
}: {
  userFlow: UserFlow;
  requestSteps: RequestSteps;
}) => {
  const steps: NeededRequestStep[] = [];

  if (userFlow.renderHowItWorksPage) {
    steps.push(requestSteps.howItWorks);
  }

  steps.push(requestSteps.requestHelp);

  if (userFlow.renderScheduleTimeWindow) {
    steps.push(requestSteps.requestAddress);
  }

  steps.push(requestSteps.requestPreferredTime);
  steps.push(requestSteps.requestContact);

  if (!userFlow.renderScheduleTimeWindow) {
    steps.push(requestSteps.requestAddress);
  }

  steps.push(
    ...[
      requestSteps.requestCareFor,
      requestSteps.requestPersonalInfo,
      requestSteps.requestDetails,
    ]
  );

  return steps;
};

const getStepProgressByPrevSteps = (prevSteps: NeededRequestStep[]) =>
  prevSteps.reduce((acc, step) => acc + step.stepCount, INITIAL_PROGRESS_STEP);

const useRequestStepper = () => {
  const userFlow = useUserFlow();
  const { pathname } = useLocation();

  const address = useSelector(selectAddress);

  const routes = getRoutesByUserFlow({ userFlow });

  const requestSteps = useMemo(
    () => ({
      requestContact: {
        stepCount: 30,
        backBtnText: 'About you',
        href: routes.requestContact,
      },
      requestAddress: {
        stepCount: 20,
        backBtnText: 'Your location',
        href: routes.requestAddress,
      },
      requestCareFor: {
        stepCount: 10,
        backBtnText: 'Who needs care?',
        href: routes.requestCareFor,
      },
      requestPersonalInfo: {
        stepCount: 10,
        backBtnText: 'Who needs care?',
        href: routes.requestPersonalInfo,
      },
      requestHelp: {
        stepCount: 10,
        href: routes.requestHelp,
        backBtnText: 'Reason to visit',
      },
      requestDetails: {
        stepCount: 0,
        href: routes.requestDetails,
      },
      requestPreferredTime: {
        stepCount: 10,
        href: routes.requestPreferredTime,
        backBtnText: 'Preferred time',
      },
      howItWorks: {
        stepCount: 0,
        href: routes.howItWorks,
      },
    }),
    [
      routes.howItWorks,
      routes.requestAddress,
      routes.requestCareFor,
      routes.requestContact,
      routes.requestDetails,
      routes.requestHelp,
      routes.requestPersonalInfo,
      routes.requestPreferredTime,
    ]
  );

  const { isAddressAvailabilityOpen } = useSelector(
    selectAddressAvailability(
      address?.postalCode
        ? {
            zipcode: address.postalCode,
            clientTime: format(new Date(), 'H:mm:ssXXXX'),
          }
        : skipToken
    )
  );

  return useMemo(() => {
    const steps = getNeededSteps({ userFlow, requestSteps });

    const currentStepIdx = steps.findIndex((step) => step.href === pathname);
    const currentStep = steps[currentStepIdx];

    const isAddressSetByUrl = getLocalStorageItem(
      LocalStorageKeys.isAddressSetByUrl,
      false
    );

    const nextStep =
      (steps[currentStepIdx + 1]?.href === requestSteps.requestAddress.href &&
        (!isAddressAvailabilityOpen || !isAddressSetByUrl)) ||
      steps[currentStepIdx + 1]?.href !== requestSteps.requestAddress.href
        ? steps[currentStepIdx + 1]
        : steps[currentStepIdx + 2];

    const previousSteps = steps.slice(0, currentStepIdx);
    const previousStep = previousSteps[previousSteps.length - 1];

    const stepProgress = getStepProgressByPrevSteps(previousSteps);

    return {
      backBtnOptions:
        previousStep &&
        currentStep?.href !== routes.requestDetails &&
        previousStep.backBtnText
          ? {
              url: previousStep.href,
              text: previousStep.backBtnText,
            }
          : null,
      nextStepUrl: nextStep?.href,
      stepProgress: stepProgress !== 100 ? stepProgress : null,
      previousStepExists: !!previousStep && previousStep.backBtnText,
      currentStep,
      finalStep: nextStep?.href === routes.requestDetails,
    };
  }, [
    userFlow,
    requestSteps,
    isAddressAvailabilityOpen,
    routes.requestDetails,
    pathname,
  ]);
};

export default useRequestStepper;
