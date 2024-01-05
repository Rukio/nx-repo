import { render, screen } from '@testing-library/react';

import LoadingContainer from './LoadingContainer';
import { LOADING_CONTAINER_TEST_IDS } from './TestIds';

describe('LoadingContainer', () => {
  it('should render correctly with default props (full container size)', () => {
    const testIdPrefix = 'full-screen';
    const { asFragment } = render(
      <div style={{ width: '100vw', height: '100vh' }}>
        <LoadingContainer testIdPrefix={testIdPrefix} />
      </div>
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(LOADING_CONTAINER_TEST_IDS.SPINNER(testIdPrefix))
    ).toBeTruthy();
  });

  it('should render correctly with custom container size', () => {
    const testIdPrefix = 'pixel-sized';
    const { asFragment } = render(
      <div style={{ width: '90vw', height: '90vh' }}>
        <LoadingContainer
          testIdPrefix={testIdPrefix}
          cssWidth="300px"
          cssHeight="400px"
        />
      </div>
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(LOADING_CONTAINER_TEST_IDS.SPINNER(testIdPrefix))
    ).toBeTruthy();
  });

  it('should render correctly with custom container and spinner size', () => {
    const testIdPrefix = 'spinner-sized';
    const { asFragment } = render(
      <div style={{ width: '90vw', height: '90vh' }}>
        <LoadingContainer
          testIdPrefix={testIdPrefix}
          cssWidth="300px"
          cssHeight="400px"
          spinnerSize={50}
        />
      </div>
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(LOADING_CONTAINER_TEST_IDS.SPINNER(testIdPrefix))
    ).toBeTruthy();
  });
});
