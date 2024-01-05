import { mocked } from 'jest-mock';
import { render, screen } from '../../testUtils';
import { AuthLoader } from './AuthLoader';
import { useAuth0 } from '@auth0/auth0-react';
import { AUTH_LOADER_TEST_IDS } from './testIds';

const mockChildTestId = 'mock-child';

const MockChild = () => <div data-testid={mockChildTestId}>test</div>;

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isLoading: false,
  }),
}));

const mockedUseAuth0 = mocked(useAuth0);

const setup = () => {
  return render(
    <AuthLoader>
      <MockChild />
    </AuthLoader>
  );
};

describe('<AuthLoader />', () => {
  describe('with loader displayed', () => {
    beforeEach(() => {
      mockedUseAuth0.mockImplementation(() => ({
        ...jest.requireActual('@auth0/auth0-react').useAuth0,
        isLoading: true,
      }));
    });

    it('should render correctly if isLoading of useAuth0 is true', async () => {
      setup();

      const loader = await screen.findByTestId(AUTH_LOADER_TEST_IDS.LOADER);
      expect(loader).toBeVisible();
    });
  });

  describe('with children displayed', () => {
    beforeEach(() => {
      mockedUseAuth0.mockImplementation(() => ({
        ...jest.requireActual('@auth0/auth0-react').useAuth0,
        isLoading: false,
      }));
    });

    it('should render correctly if isLoading of useAuth0 is false', async () => {
      setup();

      const child = await screen.findByTestId(mockChildTestId);
      expect(child).toBeVisible();
    });
  });
});
