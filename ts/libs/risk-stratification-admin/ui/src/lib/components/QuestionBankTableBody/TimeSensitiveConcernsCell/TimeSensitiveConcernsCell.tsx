import { FC, useState } from 'react';
import {
  Box,
  Chip,
  KeyboardOptionKeyIcon,
  makeSxStyles,
  TableCell,
} from '@*company-data-covered*/design-system';
import { QuestionBankTimeSensitiveConcern } from '../../../types';
import { QUESTION_BANK_TABLE_BODY_CONCERNS_CELL_TEST_IDS as TEST_IDS } from '../testIds';

const MAX_CONCERNS = 5;

interface TimeSensitiveConcernsCellProps {
  maxConcerns?: number;
  timeSensitiveConcerns: QuestionBankTimeSensitiveConcern[];
}

const makeStyles = () =>
  makeSxStyles({
    cell: { gap: 1, flexWrap: 'wrap', display: 'flex', alignItems: 'center' },
  });

const TimeSensitiveConcernsCell: FC<TimeSensitiveConcernsCellProps> = ({
  timeSensitiveConcerns,
  maxConcerns = MAX_CONCERNS,
}) => {
  const styles = makeStyles();
  const [concernsToDisplay, setConcernsToDisplay] = useState<
    QuestionBankTimeSensitiveConcern[]
  >(() => timeSensitiveConcerns.slice(0, maxConcerns));
  const hiddenConcerns =
    timeSensitiveConcerns.length - concernsToDisplay.length;

  const displayAllConcerns = () => setConcernsToDisplay(timeSensitiveConcerns);

  return (
    <TableCell data-testid={TEST_IDS.CONCERN_CELL}>
      <Box sx={styles.cell}>
        {concernsToDisplay.map((concern) => (
          <Chip
            key={concern.value}
            label={concern.value}
            avatar={concern.isBranch ? <KeyboardOptionKeyIcon /> : undefined}
            data-testid={TEST_IDS.DISPLAYED_CONCERN}
          />
        ))}
        {hiddenConcerns ? (
          <Chip
            clickable
            onClick={displayAllConcerns}
            label={`+${hiddenConcerns}`}
            data-testid={TEST_IDS.CONCERN_HIDDEN_BUTTON}
          />
        ) : null}
      </Box>
    </TableCell>
  );
};

export { TimeSensitiveConcernsCellProps };
export default TimeSensitiveConcernsCell;
