import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InsuranceFilters from './InsuranceFilters';
import { INSURANCE_FILTERS_TESTS_IDS } from './testIds';

const props = {
  filterOptions: [
    { name: 'Classification', id: 1 },
    { name: 'Type', id: 2 },
  ],
  filterBy: { name: 'Classification', id: 1 },
  onFilterByChange: jest.fn(),
  searchText: '',
  onChangeSearch: jest.fn(),
};

const setup = () => {
  return {
    ...render(<InsuranceFilters {...props} />),
    user: userEvent.setup(),
  };
};

describe('<InsuranceFilters />', () => {
  it('should render properly', () => {
    const { asFragment } = setup();

    expect(asFragment()).toMatchSnapshot();
  });

  it('should change search', async () => {
    const { user } = setup();

    const searchField = screen.getByTestId(
      INSURANCE_FILTERS_TESTS_IDS.SEARCH_FIELD
    ) as HTMLInputElement;

    await user.type(searchField, 'search');

    expect(props.onChangeSearch).toHaveBeenCalled();
  });

  it('should change filter option', async () => {
    const { user } = setup();

    const filterByButton = screen.getByTestId(
      INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_SELECT
    );

    await user.click(filterByButton);

    const filterByOptions = await screen.findAllByTestId(
      new RegExp(INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_OPTION_PREFIX)
    );
    expect(filterByOptions.length).toBeTruthy();
    await user.click(filterByOptions[1]);

    expect(props.onFilterByChange).toHaveBeenCalledWith(props.filterOptions[1]);
  });

  it('should deselect active filter option', async () => {
    const { user } = setup();

    const filterByButton = screen.getByTestId(
      INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_SELECT
    );

    await user.click(filterByButton);

    const filterByOptions = await screen.findAllByTestId(
      new RegExp(INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_OPTION_PREFIX)
    );
    expect(filterByOptions.length).toBeTruthy();
    await user.click(filterByOptions[0]);

    expect(props.onFilterByChange).toHaveBeenCalledWith(undefined);
  });
});
