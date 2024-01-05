import { render, screen } from '@testing-library/react';
import LoadingContainer from './LoadingContainer';
import { LOADING_CONTAINER_TEST_IDS } from './testIds';

describe('<LoadingContainer />', () => {
  it('should render properly', () => {
    const mockedTestIdPrefix = 'page-container';
    render(<LoadingContainer testIdPrefix={mockedTestIdPrefix} />);

    expect(
      screen.getByTestId(
        LOADING_CONTAINER_TEST_IDS.getProgressTestId(mockedTestIdPrefix)
      )
    ).toBeVisible();
  });
});
