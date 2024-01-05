import { renderWithUserProvider, screen, within } from '../util/testUtils';
import CareTeamRankings from './CareTeamRankings';
import {
  chartClosureTabConfiguration,
  npsTabConfiguration,
  onSceneTabConfiguration,
} from '../constants';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import { CARE_TEAM_RANKINGS_TEST_IDS } from './TestIds';

describe('<CareTeamRankings  />', () => {
  it('should render correctly tabs', async () => {
    renderWithUserProvider(<CareTeamRankings />);
    expect(
      await screen.findByTestId(onSceneTabConfiguration.dataTestId)
    ).toBeVisible();
    expect(
      await screen.findByTestId(chartClosureTabConfiguration.dataTestId)
    ).toBeVisible();
    expect(
      await screen.findByTestId(npsTabConfiguration.dataTestId)
    ).toBeVisible();
  });

  it('pagination should work', async () => {
    const { user } = renderWithUserProvider(<CareTeamRankings />);
    const onSceneTimeTab = await screen.findByTestId('tab-on-scene-time');
    const chartClosureTab = await screen.findByTestId('tab-chart-closure-rate');

    expect(onSceneTimeTab).toHaveAttribute('aria-selected', 'true');
    await user.click(chartClosureTab);
    expect(chartClosureTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should changed search field', async () => {
    const searchValue = 'Some text';
    const { user } = renderWithUserProvider(<CareTeamRankings />);
    const searchField = await screen.findByTestId(TEST_IDS.SEARCH_FIELD.ROOT);
    expect(searchField).toBeVisible();
    const searchFieldInput = await screen.findByTestId(
      TEST_IDS.SEARCH_FIELD.INPUT
    );
    expect(searchFieldInput).toBeVisible();
    await user.type(searchFieldInput, searchValue);
    expect.objectContaining({
      target: expect.objectContaining({
        value: searchValue,
      }),
    });
  });

  it('should render search field with searchText correctly after switching tab', async () => {
    const searchValue = 'Some text';
    const { user } = renderWithUserProvider(<CareTeamRankings />);
    const searchField = await screen.findByTestId(TEST_IDS.SEARCH_FIELD.ROOT);
    expect(searchField).toBeVisible();
    const searchFieldInput = await screen.findByTestId(
      TEST_IDS.SEARCH_FIELD.INPUT
    );
    expect(searchFieldInput).toBeVisible();
    await user.type(searchFieldInput, searchValue);
    expect(searchFieldInput).toHaveValue(searchValue);
    const button = await screen.findByTestId(npsTabConfiguration.dataTestId);
    await user.click(button);
    expect(screen.getByTestId(TEST_IDS.SEARCH_FIELD.INPUT)).toHaveValue(
      searchValue
    );
  });

  it('should render pagination', async () => {
    const { user } = renderWithUserProvider(<CareTeamRankings />);
    const paginationBlock = await screen.findByTestId(
      CARE_TEAM_RANKINGS_TEST_IDS.PAGINATION
    );
    expect(paginationBlock).toBeVisible();
    const navigateNextIcon = await screen.findByTestId('NavigateNextIcon');
    await user.click(navigateNextIcon);
    expect(within(paginationBlock).getByText('2')).toBeVisible();
  });
});
