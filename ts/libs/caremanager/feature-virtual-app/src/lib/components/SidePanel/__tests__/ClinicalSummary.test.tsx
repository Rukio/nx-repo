import { screen, render } from '../../../../test/testUtils';
import { ClinicalSummary, MOCKED_CLINICAL_SUMMARY } from '../ClinicalSummary';
import { CLINICAL_SUMMARY_TEST_IDS } from '../testIds';

const setup = () => render(<ClinicalSummary {...MOCKED_CLINICAL_SUMMARY} />);

describe('Clinical Summary', () => {
  it('should render correctly', () => {
    setup();

    expect(
      screen.getByTestId(CLINICAL_SUMMARY_TEST_IDS.CONTAINER)
    ).toBeVisible();

    expect(
      screen.getByTestId(CLINICAL_SUMMARY_TEST_IDS.CHIEF_COMPLAINT)
    ).toBeVisible();

    expect(
      screen.getByTestId(CLINICAL_SUMMARY_TEST_IDS.SYMPTOMS)
    ).toBeVisible();

    expect(
      screen.getByTestId(CLINICAL_SUMMARY_TEST_IDS.RISK_STRAT_SCORE)
    ).toBeVisible();

    expect(
      screen.getByTestId(CLINICAL_SUMMARY_TEST_IDS.SECONDARY_SCREENING_NOTE)
    ).toBeVisible();

    expect(
      screen.getByTestId(CLINICAL_SUMMARY_TEST_IDS.SCREENER)
    ).toBeVisible();
  });

  it('should render all content', async () => {
    setup();

    expect(
      await screen.findByText(MOCKED_CLINICAL_SUMMARY.chiefComplaint)
    ).toBeVisible();

    expect(
      await screen.findByText(MOCKED_CLINICAL_SUMMARY.symptoms)
    ).toBeVisible();

    expect(
      await screen.findByText(MOCKED_CLINICAL_SUMMARY.secondaryScreeningNote)
    ).toBeVisible();

    expect(
      await screen.findByText(MOCKED_CLINICAL_SUMMARY.screener)
    ).toBeVisible();
  });
});
