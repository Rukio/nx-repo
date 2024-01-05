import { getHookWrapper, renderHook } from '../../../testUtils';
import { mocked } from 'jest-mock';
import { useLocation, Location } from 'react-router-dom';
import { UserFlow, useUserFlow } from '../useUserFlow';
import useRequestStepper from './useRequestStepper';
import { getRoutesByUserFlow } from '../../utils';

export const mockDefaultUserFlow: UserFlow = {
  renderHowItWorksPage: false,
  renderScheduleTimeWindow: false,
};

export const mockScheduleTimeWindowUserFlow: UserFlow = {
  renderHowItWorksPage: false,
  renderScheduleTimeWindow: true,
};

export const mockHowItWorksUserFlow: UserFlow = {
  renderHowItWorksPage: true,
  renderScheduleTimeWindow: false,
};

jest.mock('../useUserFlow', () => ({
  useUserFlow: jest.fn().mockImplementation(() => mockDefaultUserFlow),
}));

const mockLocation: Location = {
  pathname: '/',
  state: undefined,
  key: '',
  search: '',
  hash: '',
};

const mockUseLocation = mocked(useLocation);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn().mockImplementation(() => mockLocation),
}));

const setup = () => {
  return renderHook(() => useRequestStepper(), {
    wrapper: getHookWrapper(),
  });
};

describe('useRequestStepper', () => {
  describe('default user flow', () => {
    const routes = getRoutesByUserFlow();

    it('should return the request help step data as first step', () => {
      const { result } = setup();
      expect(result.current.nextStepUrl).toBe(routes.requestPreferredTime);
      expect(result.current.backBtnOptions).toBeNull();
      expect(result.current.stepProgress).toBe(10);
      expect(result.current.previousStepExists).toBeFalsy();
      expect(result.current.currentStep).toStrictEqual({
        backBtnText: 'Reason to visit',
        href: routes.requestHelp,
        stepCount: 10,
      });
    });

    it('should return the request preferred eta step data if urls are same', () => {
      mockUseLocation.mockReturnValueOnce({
        ...mockLocation,
        pathname: routes.requestHelp,
      });
      const { result } = setup();
      expect(result.current.nextStepUrl).toBe(routes.requestPreferredTime);
      expect(result.current.backBtnOptions).toBeNull();
      expect(result.current.stepProgress).toBe(10);
      expect(result.current.previousStepExists).toBeFalsy();
      expect(result.current.currentStep).toStrictEqual({
        backBtnText: 'Reason to visit',
        href: routes.requestHelp,
        stepCount: 10,
      });
    });
  });

  describe('how it works flow', () => {
    const routes = getRoutesByUserFlow({
      userFlow: mockHowItWorksUserFlow,
    });

    it('should return how it works page data as first step', () => {
      const useUserFlowMock = mocked(useUserFlow);
      useUserFlowMock.mockReturnValue(mockHowItWorksUserFlow);

      const { result } = setup();
      expect(result.current.nextStepUrl).toBe(routes.requestHelp);
      expect(result.current.backBtnOptions).toBeNull();
      expect(result.current.stepProgress).toBe(10);
      expect(result.current.previousStepExists).toBeFalsy();
      expect(result.current.currentStep).toStrictEqual({
        href: routes.howItWorks,
        stepCount: 0,
      });
    });

    it('should return the request help step data as second step if urls are same', () => {
      mockUseLocation.mockReturnValueOnce({
        ...mockLocation,
        pathname: routes.requestHelp,
      });
      const useUserFlowMock = mocked(useUserFlow);
      useUserFlowMock.mockReturnValue(mockHowItWorksUserFlow);

      const { result } = setup();

      expect(result.current.nextStepUrl).toBe(routes.requestPreferredTime);
      expect(result.current.backBtnOptions).toBeNull();
      expect(result.current.stepProgress).toBe(10);
      expect(result.current.previousStepExists).toBeFalsy();
      expect(result.current.currentStep).toStrictEqual({
        backBtnText: 'Reason to visit',
        href: routes.requestHelp,
        stepCount: 10,
      });
    });
  });

  describe('schedule time window flow', () => {
    const routes = getRoutesByUserFlow({
      userFlow: mockScheduleTimeWindowUserFlow,
    });

    it('should return the request help step data as first step', () => {
      const useUserFlowMock = mocked(useUserFlow);
      useUserFlowMock.mockReturnValue(mockScheduleTimeWindowUserFlow);

      const { result } = setup();
      expect(result.current.nextStepUrl).toBe(routes.requestAddress);
      expect(result.current.backBtnOptions).toBeNull();
      expect(result.current.stepProgress).toBe(10);
      expect(result.current.previousStepExists).toBeFalsy();
      expect(result.current.currentStep).toStrictEqual({
        backBtnText: 'Reason to visit',
        href: routes.requestHelp,
        stepCount: 10,
      });
    });

    it('should return the address step data as second step and return request preferred time as next step', () => {
      mockUseLocation.mockReturnValueOnce({
        ...mockLocation,
        pathname: routes.requestAddress,
      });
      const useUserFlowMock = mocked(useUserFlow);
      useUserFlowMock.mockReturnValue(mockScheduleTimeWindowUserFlow);

      const { result } = setup();
      expect(result.current.nextStepUrl).toBe(routes.requestPreferredTime);
      expect(result.current.backBtnOptions).toStrictEqual({
        text: 'Reason to visit',
        url: routes.requestHelp,
      });

      expect(result.current.stepProgress).toBe(20);
      expect(result.current.previousStepExists).toBeTruthy();
      expect(result.current.currentStep).toStrictEqual({
        backBtnText: 'Your location',
        href: routes.requestAddress,
        stepCount: 20,
      });
    });

    it('should return the preferred time data as third step and address as previous step', () => {
      mockUseLocation.mockReturnValueOnce({
        ...mockLocation,
        pathname: routes.requestPreferredTime,
      });

      const useUserFlowMock = mocked(useUserFlow);
      useUserFlowMock.mockReturnValue(mockScheduleTimeWindowUserFlow);

      const { result } = setup();
      expect(result.current.nextStepUrl).toBe(routes.requestContact);
      expect(result.current.backBtnOptions).toStrictEqual({
        text: 'Your location',
        url: routes.requestAddress,
      });
      expect(result.current.stepProgress).toBe(40);
      expect(result.current.previousStepExists).toBeTruthy();
      expect(result.current.currentStep).toStrictEqual({
        backBtnText: 'Preferred time',
        href: routes.requestPreferredTime,
        stepCount: 10,
      });
    });

    it('should return the request contact data as current step, preferred time as previous step and request care for as next step', () => {
      mockUseLocation.mockReturnValueOnce({
        ...mockLocation,
        pathname: routes.requestContact,
      });

      const useUserFlowMock = mocked(useUserFlow);
      useUserFlowMock.mockReturnValue(mockScheduleTimeWindowUserFlow);

      const { result } = setup();
      expect(result.current.nextStepUrl).toBe(routes.requestCareFor);
      expect(result.current.backBtnOptions).toStrictEqual({
        text: 'Preferred time',
        url: routes.requestPreferredTime,
      });
      expect(result.current.stepProgress).toBe(50);
      expect(result.current.previousStepExists).toBeTruthy();
      expect(result.current.currentStep).toStrictEqual({
        backBtnText: 'About you',
        href: routes.requestContact,
        stepCount: 30,
      });
    });
  });
});
