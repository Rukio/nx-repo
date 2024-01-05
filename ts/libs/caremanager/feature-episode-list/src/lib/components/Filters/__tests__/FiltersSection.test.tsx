import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import { FiltersSection } from '../FiltersSection';

const setup = (newProps: object) => {
  const props = {
    setSelectedMarkets: vi.fn(),
    setSelectedCarePhases: vi.fn(),
    setSelectedServiceLines: vi.fn(),
    setIncompleteTasksSelected: vi.fn(),
    selectedMarkets: [],
    selectedCarePhases: [],
    selectedServiceLines: [],
    incompleteTasksSelected: false,
    handleClearAll: vi.fn(),
    ...newProps,
  };

  return renderWithClient(<FiltersSection {...props} />);
};

describe('FiltersSection', () => {
  it('renders care phase filter', () => {
    setup({});
    expect(screen.getByTestId('care-phase-filter')).toBeInTheDocument();
    expect(screen.getByTestId('market-filter')).toBeInTheDocument();
    expect(screen.getByTestId('incomplete-task-filter')).toBeInTheDocument();
    expect(screen.getByTestId('service-line-filter')).toBeInTheDocument();
    expect(screen.getByTestId('filters-section')).toBeInTheDocument();
    expect(screen.queryByTestId('clear-all-button')).not.toBeInTheDocument();
  });

  it('renders task templates filter', () => {
    setup({
      setSelectedMarkets: undefined,
      setSelectedCarePhases: vi.fn(),
      setSelectedServiceLines: vi.fn(),
      setIncompleteTasksSelected: undefined,
      selectedMarkets: undefined,
      selectedCarePhases: [],
      selectedServiceLines: undefined,
      incompleteTasksSelected: undefined,
      handleClearAll: vi.fn(),
    });
    expect(screen.getByTestId('care-phase-filter')).toBeInTheDocument();
    expect(screen.queryByTestId('market-filter')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('incomplete-task-filter')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('service-line-filter')).toBeInTheDocument();
    expect(screen.getByTestId('filters-section')).toBeInTheDocument();
    expect(screen.queryByTestId('clear-all-button')).not.toBeInTheDocument();
  });

  describe('renders service line chip correctly', () => {
    it('with three or less selected', () => {
      setup({
        selectedServiceLines: ['1', '2', '3'],
        configData: {
          serviceLines: [
            {
              id: '1',
              shortName: 'C',
            },
            {
              id: '2',
              shortName: 'B',
            },
            {
              id: '3',
              shortName: 'A',
            },
          ],
          carePhases: [],
        },
      });
      expect(screen.getByTestId('service-line-filter')).toHaveTextContent(
        'A, B, C'
      );
    });

    it('with four or more selected', () => {
      setup({
        selectedServiceLines: ['1', '2', '3', '4'],
        configData: {
          serviceLines: [
            {
              id: '1',
              shortName: 'E',
            },
            {
              id: '2',
              shortName: 'D',
            },
            {
              id: '3',
              shortName: 'C',
            },
            {
              id: '4',
              shortName: 'B',
            },
            {
              id: '5',
              shortName: 'A',
            },
          ],
          carePhases: [],
        },
      });
      expect(screen.getByTestId('service-line-filter')).toHaveTextContent(
        '4 Selected'
      );
    });

    it('with all selected', () => {
      setup({
        selectedServiceLines: ['1', '2', '3', '4'],
        configData: {
          serviceLines: [
            {
              id: '1',
              shortName: 'E',
            },
            {
              id: '2',
              shortName: 'D',
            },
            {
              id: '3',
              shortName: 'C',
            },
            {
              id: '4',
              shortName: 'B',
            },
          ],
          carePhases: [],
        },
      });
      expect(screen.getByTestId('service-line-filter')).toHaveTextContent(
        'All 4 Service Lines'
      );
    });
  });

  it('renders care phase filter with incomplete tasks filter selected, clear button enabled', () => {
    const newProps = { incompleteTasksSelected: true };
    setup(newProps);

    expect(screen.getByTestId('clear-all-button')).toBeInTheDocument();
  });

  it('renders care phase filter with other filters selected, clear button enabled', () => {
    const newProps = { selectedMarkets: [JSONMocks.config.markets[0]] };
    setup(newProps);

    expect(screen.getByTestId('clear-all-button')).toBeInTheDocument();
  });

  it('renders care phase filter with show closed Chip', () => {
    const newProps = {
      configData: {
        serviceLines: [],
        carePhases: [
          JSONMocks.config.care_phases[4],
          JSONMocks.config.care_phases[7],
        ],
      },
    };
    setup(newProps);

    expect(screen.getByText('Show Closed')).toBeInTheDocument();
  });

  it('renders care phase filter with hide closed Chip', () => {
    const newProps = {
      configData: {
        serviceLines: [],
        carePhases: [
          JSONMocks.config.care_phases[4],
          JSONMocks.config.care_phases[7],
        ],
      },
      selectedCarePhases: [
        JSONMocks.config.care_phases[4].id,
        JSONMocks.config.care_phases[7].id,
      ],
    };
    setup(newProps);

    expect(screen.getByText('Hide Closed')).toBeInTheDocument();
  });
});
