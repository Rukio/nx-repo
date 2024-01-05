import { REQUEST_CARE_WIDGET_TEST_IDS } from '@*company-data-covered*/widgets/request-care/ui';
import { render, screen } from '@testing-library/react';
import { mockConsoleWarn } from '../../setupTests';
import { init } from './index';

describe('RequestCareWidgetEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render widget if no element was found', () => {
    init({ elementSelector: '#element' }).render();

    expect(mockConsoleWarn).toBeCalledWith(
      `[Widgets app] can't find element with the following selector "#element"`,
      { elementSelector: '#element' }
    );
  });

  it('should render widget correctly if element was found', async () => {
    render(<div id="element" />);
    init({ elementSelector: '#element' }).render();

    const requestCareWidgetContainer = await screen.findByTestId(
      REQUEST_CARE_WIDGET_TEST_IDS.CONTAINER
    );

    expect(requestCareWidgetContainer).not.toBeNull();
    expect(mockConsoleWarn).not.toBeCalled();
  });
});
