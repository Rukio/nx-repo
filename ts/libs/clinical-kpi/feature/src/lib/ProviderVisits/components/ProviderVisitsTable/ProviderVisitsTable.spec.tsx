import { mockedVisitsResponse } from '@*company-data-covered*/clinical-kpi/data-access';
import { renderWithUserProvider, screen } from '../../../util/testUtils';
import ProviderVisitsTable, {
  ProviderVisitsTableProps,
  getChipState,
  tableConfiguration,
} from './ProviderVisitsTable';
import { PROVIDER_VISITS_TABLE_TEST_IDS } from './testIds';
import { PLACEHOLDER_COUNT } from './constants';

const defaultProps: ProviderVisitsTableProps = {
  providerVisits: mockedVisitsResponse.providerVisits,
  isLoading: false,
};

const setup = (props: Partial<ProviderVisitsTableProps> = {}) => {
  return renderWithUserProvider(
    <ProviderVisitsTable {...defaultProps} {...props} />
  );
};

const firstVisit = mockedVisitsResponse.providerVisits[0];
const firstVisitId = firstVisit.careRequestId;

describe('ProviderVisitsTable', () => {
  it.each([
    {
      id: PROVIDER_VISITS_TABLE_TEST_IDS.getPatientName(firstVisitId),
      expected: `${firstVisit.patientFirstName} ${firstVisit.patientLastName}`,
    },
    {
      id: PROVIDER_VISITS_TABLE_TEST_IDS.getAthenaId(firstVisitId),
      expected: `ID: ${firstVisit.patientAthenaId}`,
    },
    {
      id: PROVIDER_VISITS_TABLE_TEST_IDS.getDate(firstVisitId),
      expected: `${firstVisit.serviceDate.month}/${firstVisit.serviceDate.day}/${firstVisit.serviceDate.year}`,
    },
    {
      id: PROVIDER_VISITS_TABLE_TEST_IDS.getChiefComplaint(firstVisitId),
      expected: firstVisit.chiefComplaint,
    },
    {
      id: PROVIDER_VISITS_TABLE_TEST_IDS.getDiagnosis(firstVisitId),
      expected: firstVisit.diagnosis,
    },
    {
      id: PROVIDER_VISITS_TABLE_TEST_IDS.getEscalated(firstVisitId),
      expected: getChipState(firstVisit.isEscalated),
    },
    {
      id: PROVIDER_VISITS_TABLE_TEST_IDS.getAbx(firstVisitId),
      expected: getChipState(firstVisit.isAbxPrescribed),
    },
  ])('renders visit data correctly', async ({ id, expected }) => {
    setup();

    const element = await screen.findByTestId(id);

    expect(element).toBeVisible();
    expect(element).toHaveTextContent(expected);
  });

  it('should render table and columns properly', async () => {
    setup();

    const table = await screen.findByTestId(
      PROVIDER_VISITS_TABLE_TEST_IDS.TABLE
    );
    expect(table).toBeVisible();

    await Promise.all(
      tableConfiguration.map(async ({ key }) => {
        const columnCell = await screen.findByTestId(
          PROVIDER_VISITS_TABLE_TEST_IDS.buildHeaderColumnTestId(key)
        );
        expect(columnCell).toBeVisible();
      })
    );
  });

  it('should render skeletons correctly', async () => {
    setup({
      isLoading: true,
    });

    const table = await screen.findByTestId(
      PROVIDER_VISITS_TABLE_TEST_IDS.TABLE
    );
    expect(table).toBeVisible();

    for (
      let tableRowIndex = 0;
      tableRowIndex < PLACEHOLDER_COUNT;
      tableRowIndex++
    ) {
      for (const { key } of tableConfiguration) {
        const skeleton = screen.getByTestId(
          PROVIDER_VISITS_TABLE_TEST_IDS.getCellSkeleton(tableRowIndex, key)
        );
        expect(skeleton).toBeVisible();
      }
    }
  });
});
