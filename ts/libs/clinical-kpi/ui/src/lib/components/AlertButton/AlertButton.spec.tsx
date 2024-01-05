import { render, screen } from '@testing-library/react';

import AlertButton, { AlertButtonProps } from './AlertButton';
import { ALERT_BUTTON_TEST_IDS } from './TestIds';

const props: AlertButtonProps = {
  text: 'Looks like something went wrong. Please check back later.',
  buttonText: 'Continue to Dashboard',
  buttonLink: '/',
};

describe('Error', () => {
  it('should render error correctly', () => {
    const { asFragment } = render(<AlertButton {...props} />);
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(ALERT_BUTTON_TEST_IDS.TEXT).textContent
    ).toContain(props.text);
    expect(
      screen.getByTestId(ALERT_BUTTON_TEST_IDS.BUTTON).textContent
    ).toContain(props.buttonText);
    expect(
      screen.getByTestId(ALERT_BUTTON_TEST_IDS.BUTTON).getAttribute('href')
    ).toContain(props.buttonLink);
  });
});
