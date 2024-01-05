import { interceptQuery, render, screen } from '../util/testUtils';
import { LEADS_PROVIDER_SHIFTS_INTERCEPT_URL } from '../util/testUtils/server/handlers';
import ProviderShiftsTable, {
  ProviderShiftsTableProps,
  calculateSubDaysTimestamp,
} from './ProviderShiftsTable';
import {
  PROVIDER_SHIFTS_TABLE_CONFIGURATION,
  PROVIDER_SHIFTS_TABLE_ALERT,
} from './constants';
import { PROVIDER_SHIFTS_TABLE_TEST_IDS } from './testIds';

const providerId = '110212';

const setup = (props: ProviderShiftsTableProps) => {
  return render(<ProviderShiftsTable {...props} />);
};

describe('<ProviderShiftsTable />', () => {
  describe('Integration tests', () => {
    it('should render correctly', async () => {
      setup({
        providerId,
      });

      const table = await screen.findByTestId(
        PROVIDER_SHIFTS_TABLE_TEST_IDS.PROVIDER_SHIFTS_TABLE_ROOT
      );
      expect(table).toBeVisible();

      PROVIDER_SHIFTS_TABLE_CONFIGURATION.map(async ({ dataTestId }) => {
        const element = await screen.findByTestId(dataTestId);
        expect(element).toBeInTheDocument();
      });
    });

    it('should render alert', async () => {
      interceptQuery({
        url: LEADS_PROVIDER_SHIFTS_INTERCEPT_URL,
        data: {},
      });
      setup({
        providerId,
      });
      const alert = await screen.findByText(PROVIDER_SHIFTS_TABLE_ALERT);
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Unit tests', () => {
    describe('calculateSubDaysTimestamp()', () => {
      beforeEach(() => {
        jest
          .useFakeTimers()
          .setSystemTime(new Date('2023-07-21T15:00:00.000Z'));
      });

      it.each([
        { daysCount: undefined, expectedResult: undefined },
        { daysCount: 7, expectedResult: '2023-07-14T15:00:00.000Z' },
        { daysCount: 30, expectedResult: '2023-06-21T15:00:00.000Z' },
      ])(
        'should return a correct timestamp',
        ({ daysCount, expectedResult }) => {
          expect(calculateSubDaysTimestamp(daysCount)).toEqual(expectedResult);
        }
      );
    });
  });
});
