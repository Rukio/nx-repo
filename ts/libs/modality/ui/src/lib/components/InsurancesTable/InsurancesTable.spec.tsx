import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { format } from 'date-fns';

import InsurancesTable, {
  Modality,
  Insurance,
  SortBy,
  SortOrder,
} from './InsurancesTable';
import { INSURANCE_TABLE_TEST_IDS } from './testIds';

const mockedInsurances: Insurance[] = [
  {
    id: 1,
    name: 'AMN - American Medical Network',
    packageId: '12345',
    insuranceClassification: 'Commercial',
    updatedAt: '2022-09-28',
  },
  {
    id: 2,
    name: 'BCBS Commercial (All States)',
    packageId: '12345',
    insuranceClassification: 'Commercial',
    updatedAt: '2022-09-24',
  },
  {
    id: 3,
    name: 'BCBS-GA - FEP Commercial',
    packageId: '12345',
    insuranceClassification: 'Commercial',
    updatedAt: '2022-09-27',
  },
  {
    id: 4,
    name: 'BCBS Medicare Advantage (All States)',
    packageId: '12345',
    insuranceClassification: 'Commercial',
    updatedAt: '2022-09-26',
  },
];

const mockedSelectedModalities: Record<number, number[]> = {
  1: [2],
};

const mockedModalities: Modality[] = [
  { id: 1, displayName: 'In-Person', type: 'in_person' },
  { id: 2, displayName: 'Virtual', type: 'virtual' },
];

const props = {
  insurances: mockedInsurances,
  modalities: mockedModalities,
  page: 0,
  onChangePage: jest.fn(),
  rowsPerPage: 10,
  onChangeRowsPerPage: jest.fn(),
  rowsPerPageOptions: [10, 15, 20],
  total: 4,
  sortBy: SortBy.NAME,
  sortOrder: SortOrder.ASC,
  onChangeSortBy: jest.fn(),
  onChangeSortOrder: jest.fn(),
  onChangeModality: jest.fn(),
  selectedModalities: mockedSelectedModalities,
};

describe('<InsurancesTable />', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  it('should render table rows', () => {
    render(<InsurancesTable {...props} />);

    const tableRows = screen.getAllByTestId(
      new RegExp(INSURANCE_TABLE_TEST_IDS.TABLE_ROW_PREFIX)
    );
    expect(tableRows.length).toEqual(props.insurances.length);

    const insurancesLastUpdatedCells = screen.getAllByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_CELL_LAST_UPDATED
    );
    expect(insurancesLastUpdatedCells.length).toEqual(props.insurances.length);

    const insurancesLastUpdatedValues = insurancesLastUpdatedCells.map(
      (insurance) => insurance.innerHTML
    );

    expect(insurancesLastUpdatedValues).toEqual(
      props.insurances.map((insurance) =>
        format(new Date(insurance.updatedAt), 'M/d/yyyy')
      )
    );
  });

  it('should render rows per page options', async () => {
    render(<InsurancesTable {...props} />);

    const pageSizeSelect = screen.getByRole('button', { expanded: false });
    fireEvent.mouseDown(pageSizeSelect);

    const pageSizeOptions = await screen.findAllByRole('option');
    expect(pageSizeOptions.length).toEqual(props.rowsPerPageOptions.length);
    const optionsValues = pageSizeOptions.map((opt) =>
      Number(opt.getAttribute('data-value'))
    );

    await waitFor(() => {
      expect(optionsValues).toEqual(props.rowsPerPageOptions);
    });
  });

  it('should change number of rows per page', async () => {
    render(<InsurancesTable {...props} />);

    const pageSizeSelect = screen.getByRole('button', { expanded: false });
    fireEvent.mouseDown(pageSizeSelect);

    const pageSizeOptions = await screen.findAllByRole('option');
    fireEvent.click(pageSizeOptions[1]);

    expect(props.onChangeRowsPerPage).toBeCalledWith(
      props.rowsPerPageOptions[1]
    );
  });

  it('should change table to the next page', async () => {
    render(<InsurancesTable {...props} rowsPerPage={1} />);

    const prevPageElement = screen.getByTitle(
      /Go to previous page/
    ) as HTMLButtonElement;
    const nextPageElement = screen.getByTitle(/Go to next page/);

    expect(prevPageElement.disabled).toEqual(true);

    fireEvent.click(nextPageElement);
    expect(props.onChangePage).toHaveBeenCalledWith(props.page + 1);
  });

  it('should change table to the previous page', async () => {
    render(<InsurancesTable {...props} rowsPerPage={1} page={3} />);

    const prevPageElement = screen.getByTitle(/Go to previous page/);
    const nextPageElement = screen.getByTitle(
      /Go to next page/
    ) as HTMLButtonElement;

    expect(nextPageElement.disabled).toEqual(true);

    fireEvent.click(prevPageElement);
    expect(props.onChangePage).toHaveBeenCalledWith(2);
  });

  it('should change sort directions', async () => {
    render(<InsurancesTable {...props} rowsPerPage={1} page={3} />);

    const nameSortLabel = screen.getByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_NAME_SORT_LABEL
    );
    const lastUpdatedSortLabel = screen.getByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_LAST_UPDATED_SORT_LABEL
    );

    fireEvent.click(nameSortLabel);
    fireEvent.click(lastUpdatedSortLabel);

    expect(nameSortLabel).toBeTruthy();
    expect(lastUpdatedSortLabel).toBeTruthy();
  });

  it('should render modalities at table head', async () => {
    render(<InsurancesTable {...props} />);

    const modalitiesHeadCells = screen.getAllByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_CELL_HEAD_MODALITY
    );

    expect(modalitiesHeadCells.length).toEqual(props.modalities.length);

    const modalitiesCellsValues = modalitiesHeadCells.map(
      (modalityHeadCell) => modalityHeadCell.innerHTML
    );

    expect(modalitiesCellsValues).toEqual(
      props.modalities.map(({ displayName }) => displayName)
    );
  });

  it('should toggle modality enabled when the switch is clicked', async () => {
    render(<InsurancesTable {...props} />);

    const mockedInsurancePlan = mockedInsurances[0];
    const tableInsuranceRow = screen.getByTestId(
      INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(mockedInsurancePlan.id)
    );
    const { getByTestId } = within(tableInsuranceRow);
    mockedModalities.forEach((modality) => {
      const modalityToggleCell = getByTestId(
        INSURANCE_TABLE_TEST_IDS.getModalityCellTestId(modality.id)
      );
      const toggleElement = within(modalityToggleCell).getByRole('checkbox');
      const isDefaultChecked = !!mockedSelectedModalities[
        mockedInsurancePlan.id
      ].includes(modality.id);
      expect(toggleElement).toHaveProperty('checked', isDefaultChecked);

      toggleElement.click();

      expect(props.onChangeModality).toBeCalledWith({
        modalityId: modality.id,
        insurancePlanId: mockedInsurancePlan.id,
      });
    });
  });

  it('should show no search results section', async () => {
    render(<InsurancesTable {...{ ...props, total: 0, insurances: [] }} />);

    const tableRows = screen.queryAllByTestId(
      new RegExp(INSURANCE_TABLE_TEST_IDS.TABLE_ROW_PREFIX)
    );
    expect(tableRows.length).toEqual(0);

    const noSearchResultsText = screen.getByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_NO_RESULTS_TEXT
    );
    expect(noSearchResultsText).toBeVisible();
  });
});
