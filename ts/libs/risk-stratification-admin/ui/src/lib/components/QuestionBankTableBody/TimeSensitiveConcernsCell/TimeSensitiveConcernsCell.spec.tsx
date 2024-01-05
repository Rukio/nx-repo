import { render, screen } from '../../../../testUtils';
import { Table, TableBody, TableRow } from '@*company-data-covered*/design-system';
import TimeSensitiveConcernsCell from './TimeSensitiveConcernsCell';
import { QUESTION_BANK_TABLE_BODY_CONCERNS_CELL_TEST_IDS as TEST_IDS } from '../testIds';
import { QuestionBankTimeSensitiveConcern } from '../../../types';

const setup = (
  timeSensitiveConcerns: QuestionBankTimeSensitiveConcern[],
  maxConcerns?: number
) => {
  return render(
    <Table>
      <TableBody>
        <TableRow>
          <TimeSensitiveConcernsCell
            maxConcerns={maxConcerns}
            timeSensitiveConcerns={timeSensitiveConcerns}
          />
        </TableRow>
      </TableBody>
    </Table>
  );
};

describe('<TimeSensitiveConcernsCell />', () => {
  it('should render properly', () => {
    setup([
      { value: 'Heart Attack', isBranch: true },
      { value: 'Nausea / Vomiting', isBranch: true },
    ]);

    expect(screen.getByTestId(TEST_IDS.CONCERN_CELL)).toBeVisible();
    expect(screen.getAllByTestId(TEST_IDS.DISPLAYED_CONCERN)).toHaveLength(2);
  });

  it('should display icon if concern is branch', () => {
    setup([
      { value: 'Heart Attack', isBranch: true },
      { value: 'Nausea / Vomiting', isBranch: false },
    ]);

    expect(screen.getAllByTestId('KeyboardOptionKeyIcon')).toHaveLength(1);
    expect(screen.getAllByTestId(TEST_IDS.DISPLAYED_CONCERN)).toHaveLength(2);
  });

  it('should render correct number of Time Sensitive Concerns', () => {
    const maxConcerns = 2;

    setup(
      [
        { value: 'Heart Attack', isBranch: true },
        { value: 'Nausea / Vomiting', isBranch: true },
        { value: 'Shortness of Breath', isBranch: true },
      ],
      maxConcerns
    );

    expect(screen.getAllByTestId(TEST_IDS.DISPLAYED_CONCERN)).toHaveLength(
      maxConcerns
    );
    expect(screen.getByTestId(TEST_IDS.CONCERN_HIDDEN_BUTTON)).toBeVisible();
    expect(
      screen.getByTestId(TEST_IDS.CONCERN_HIDDEN_BUTTON)
    ).toHaveTextContent('+1');
  });

  it('should render all concerns when hidden button is clicked', async () => {
    const maxConcerns = 2;
    const concerns = [
      { value: 'Heart Attack', isBranch: true },
      { value: 'Nausea / Vomiting', isBranch: true },
      { value: 'Shortness of Breath', isBranch: true },
    ];

    const { user } = setup(concerns, maxConcerns);

    expect(screen.getAllByTestId(TEST_IDS.DISPLAYED_CONCERN)).toHaveLength(
      maxConcerns
    );

    await user.click(screen.getByTestId(TEST_IDS.CONCERN_HIDDEN_BUTTON));

    expect(screen.getAllByTestId(TEST_IDS.DISPLAYED_CONCERN)).toHaveLength(
      concerns.length
    );
  });
});
