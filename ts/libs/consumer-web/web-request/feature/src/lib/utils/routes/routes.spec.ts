import { WEB_REQUEST_ROUTES } from '../../constants';
import { getRoutesByUserFlow } from './routes';

describe('routes', () => {
  describe('getRoutesByUserFlow', () => {
    it.each([
      {
        name: 'empty user flow',
        mockUserFlow: undefined,
        expectedResult: { ...WEB_REQUEST_ROUTES, requestHelp: '/' },
      },
      {
        name: 'default user flow',
        mockUserFlow: {
          renderHowItWorksPage: false,
          renderScheduleTimeWindow: false,
        },
        expectedResult: { ...WEB_REQUEST_ROUTES, requestHelp: '/' },
      },
      {
        name: 'how it works user flow',
        mockUserFlow: {
          renderHowItWorksPage: true,
          renderScheduleTimeWindow: false,
        },
        expectedResult: { ...WEB_REQUEST_ROUTES, howItWorks: '/' },
      },
    ])('should return routes correctly', ({ mockUserFlow, expectedResult }) => {
      const result = getRoutesByUserFlow({ userFlow: mockUserFlow });
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
