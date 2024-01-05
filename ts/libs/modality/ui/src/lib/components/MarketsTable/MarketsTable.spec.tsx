import { render, screen, fireEvent, within } from '@testing-library/react';

import MarketsTable, { Market, Modality } from './MarketsTable';
import { MARKETS_TABLE_TEST_IDS } from './testIds';

const mockedMarkets: Market[] = [
  { id: 1, name: 'Atlanta', shortName: 'ATL' },
  { id: 2, name: 'Austin', shortName: 'AUS' },
  { id: 3, name: 'Boise', shortName: 'BOI' },
  { id: 4, name: 'Chicago', shortName: 'CH' },
];

const mockedModalities: Modality[] = [
  { id: 1, displayName: 'In-Person', type: 'in_person' },
  { id: 2, displayName: 'Virtual', type: 'virtual' },
];

const mockedSelectedModalities: Record<number, number[]> = {
  1: [1],
};

const props = {
  markets: mockedMarkets,
  modalities: mockedModalities,
  page: 0,
  onChangePage: jest.fn(),
  rowsPerPage: 10,
  onChangeRowsPerPage: jest.fn(),
  rowsPerPageOptions: [10, 15, 20],
  total: 4,
  onChangeModality: jest.fn(),
  selectedModalities: mockedSelectedModalities,
};

describe('<MarketsTable />', () => {
  it('should render table rows', () => {
    render(<MarketsTable {...props} />);

    const tableRows = screen.getAllByTestId(
      new RegExp(MARKETS_TABLE_TEST_IDS.TABLE_ROW_PREFIX)
    );
    expect(tableRows.length).toEqual(props.markets.length);

    const marketsNameCells = screen.getAllByTestId(
      MARKETS_TABLE_TEST_IDS.TABLE_CELL_NAME
    );
    expect(marketsNameCells.length).toEqual(props.markets.length);

    const marketsNameValues = marketsNameCells.map(
      (market) => market.innerHTML
    );

    expect(marketsNameValues).toEqual(
      props.markets.map((market) => `${market.name} (${market.shortName})`)
    );
  });

  it('should render rows per page options', async () => {
    render(<MarketsTable {...props} />);

    const pageSizeSelect = screen.getByRole('button', { expanded: false });
    fireEvent.mouseDown(pageSizeSelect);

    const pageSizeOptions = await screen.findAllByRole('option');
    expect(pageSizeOptions.length).toEqual(props.rowsPerPageOptions.length);
    const optionsValues = pageSizeOptions.map((opt) =>
      Number(opt.getAttribute('data-value'))
    );
    expect(optionsValues).toEqual(props.rowsPerPageOptions);
  });

  it('should change number of rows per page', async () => {
    render(<MarketsTable {...props} />);

    const pageSizeSelect = screen.getByRole('button', { expanded: false });
    fireEvent.mouseDown(pageSizeSelect);

    const pageSizeOptions = await screen.findAllByRole('option');
    fireEvent.click(pageSizeOptions[1]);

    expect(props.onChangeRowsPerPage).toBeCalledWith(
      props.rowsPerPageOptions[1]
    );
  });

  it('should change table to the next page', async () => {
    render(<MarketsTable {...props} rowsPerPage={1} />);

    const prevPageElement = screen.getByTitle(
      /Go to previous page/
    ) as HTMLButtonElement;
    const nextPageElement = screen.getByTitle(/Go to next page/);

    expect(prevPageElement.disabled).toEqual(true);

    fireEvent.click(nextPageElement);
    expect(props.onChangePage).toHaveBeenCalledWith(props.page + 1);
  });

  it('should change table to the previous page', async () => {
    render(<MarketsTable {...props} rowsPerPage={1} page={3} />);

    const prevPageElement = screen.getByTitle(/Go to previous page/);
    const nextPageElement = screen.getByTitle(
      /Go to next page/
    ) as HTMLButtonElement;

    expect(nextPageElement.disabled).toEqual(true);

    fireEvent.click(prevPageElement);
    expect(props.onChangePage).toHaveBeenCalledWith(2);
  });

  it('should render modalities at table head', async () => {
    render(<MarketsTable {...props} />);

    const modalitiesHeadCells = screen.getAllByTestId(
      MARKETS_TABLE_TEST_IDS.TABLE_CELL_HEAD_MODALITY
    );

    expect(modalitiesHeadCells.length).toEqual(props.modalities.length);

    const modalitiesCellsValues = modalitiesHeadCells.map(
      (modalityHeadCell) => modalityHeadCell.innerHTML
    );

    expect(modalitiesCellsValues).toEqual(
      props.modalities.map(({ displayName }) => displayName)
    );
  });

  it('should render modalities switch', async () => {
    render(<MarketsTable {...props} />);

    const mockedMarket = mockedMarkets[0];
    const tableMarketRow = screen.getByTestId(
      MARKETS_TABLE_TEST_IDS.getMarketRowTestId(mockedMarket.id)
    );
    const { getByTestId } = within(tableMarketRow);
    mockedModalities.forEach((modality) => {
      const modalityToggleCell = getByTestId(
        MARKETS_TABLE_TEST_IDS.getModalityCellTestId(modality.id)
      );
      const toggleElement = within(modalityToggleCell).getByRole('checkbox');
      const isDefaultChecked = !!mockedSelectedModalities[
        mockedMarket.id
      ].includes(modality.id);
      expect(toggleElement).toHaveProperty('checked', isDefaultChecked);

      toggleElement.click();

      expect(props.onChangeModality).toBeCalledWith({
        modalityId: modality.id,
        marketId: mockedMarket.id,
      });
    });
  });
});
