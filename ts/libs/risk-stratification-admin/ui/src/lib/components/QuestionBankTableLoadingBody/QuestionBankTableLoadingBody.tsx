import {
  makeSxStyles,
  Skeleton,
  TableBody,
  TableCell,
  TableRow,
} from '@*company-data-covered*/design-system';
import { FC } from 'react';
import { QUESTION_BANK_TABLE_LOADING_BODY_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    skeleton: { marginY: 0.5 },
    tableBody: { boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.12)' },
  });

const TableCellLoading = () => {
  const styles = makeStyles();

  return (
    <TableCell>
      <Skeleton variant="rectangular" />
      <Skeleton variant="rectangular" sx={styles.skeleton} />
      <Skeleton variant="rectangular" />
    </TableCell>
  );
};

interface Props {
  rows?: number;
  columns: number;
}

const QuestionBankTableLoadingBody: FC<Props> = ({ columns, rows = 7 }) => {
  const styles = makeStyles();

  return (
    <TableBody
      sx={styles.tableBody}
      data-testid={QUESTION_BANK_TABLE_LOADING_BODY_TEST_IDS.BODY}
    >
      {new Array(rows).fill(0).map((_, i) => (
        <TableRow key={i}>
          {new Array(columns).fill(0).map((_, j) => (
            <TableCellLoading key={j} />
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
};

export default QuestionBankTableLoadingBody;
