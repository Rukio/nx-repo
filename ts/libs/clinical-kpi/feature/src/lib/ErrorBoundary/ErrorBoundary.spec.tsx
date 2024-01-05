import { render, screen } from '@testing-library/react';

import ErrorBoundary, { ErrorBoundaryProps } from './ErrorBoundary';
import {
  AlertButton,
  AlertButtonProps,
  TEST_IDS,
} from '@*company-data-covered*/clinical-kpi/ui';
import {
  GoodChild,
  BadChild,
  FAKE_COMPONENTS_TEST_IDS,
  GOOD_CHILD_TEXT,
} from './mocks';

const errorProps: AlertButtonProps = {
  text: 'Looks like something went wrong. Please check back later.',
  buttonText: 'Continue to Dashboard',
  buttonLink: '/',
};

const props: Omit<ErrorBoundaryProps, 'children'> = {
  errorComponent: <AlertButton {...errorProps} />,
};

describe('ErrorBoundary', () => {
  it('should render children correctly', () => {
    const { asFragment } = render(
      <ErrorBoundary {...props}>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(FAKE_COMPONENTS_TEST_IDS.GOOD_CHILD).textContent
    ).toContain(GOOD_CHILD_TEXT);
  });

  it('should render error correctly', () => {
    const { asFragment } = render(
      <ErrorBoundary {...props}>
        <BadChild />
      </ErrorBoundary>
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(TEST_IDS.ALERT_BUTTON.TEXT).textContent
    ).toContain(errorProps.text);
    expect(
      screen.getByTestId(TEST_IDS.ALERT_BUTTON.BUTTON).textContent
    ).toContain(errorProps.buttonText);
    expect(
      screen.getByTestId(TEST_IDS.ALERT_BUTTON.BUTTON).getAttribute('href')
    ).toContain(errorProps.buttonLink);
  });
});
