import { screen } from '@testing-library/react';
import * as UtilsReact from '@*company-data-covered*/caremanager/utils-react';
import * as DesignSystem from '@*company-data-covered*/design-system';
import { FiltersProvider } from '../FiltersContext';
import { ReviewQueue } from '../ReviewQueue';

const mediaQuerySpy = vi.spyOn(DesignSystem, 'useMediaQuery');
const setSearchParamsSpy = vi.fn();
vi.spyOn(UtilsReact, 'useSearchParams').mockReturnValue({
  searchParams: new URLSearchParams(),
  searchParamsObject: {},
  setSearchParams: setSearchParamsSpy,
});

const setup = (isMobile = false) => {
  mediaQuerySpy.mockReturnValue(isMobile);
  UtilsReact.renderWithClient(
    <FiltersProvider>
      <ReviewQueue />
    </FiltersProvider>
  );
};

describe('ReviewQueue', () => {
  afterEach(() => vi.clearAllMocks());

  it('should render the four columns', async () => {
    setup();
    expect(
      await screen.findByTestId('requested-review-queue-column')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('clinical_screening-review-queue-column')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('secondary_screening-review-queue-column')
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('accepted-review-queue-column')
    ).toBeInTheDocument();
  });

  it('should set status id filter in mobile and show requested status column', async () => {
    setup(true);

    expect(
      await screen.findByTestId('requested-review-queue-column')
    ).toBeInTheDocument();
    expect(setSearchParamsSpy).toHaveBeenCalledWith({
      statusId: '1',
    });
  });
});
