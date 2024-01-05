import {
  makeSxStyles,
  TableCell,
  TableHead,
  TableRow,
} from '@*company-data-covered*/design-system';
import { QUESTION_BANK_TABLE_HEAD_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    tableHead: { boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.12)' },
    tableHeadQuestion: { width: '37.06%', maxWidth: 510, border: 'none' },
    tableHeadCreatedBy: { width: '11.77%', maxWidth: 162, border: 'none' },
    tableHeadLastUpdated: { width: '10.02%', maxWidth: 13, border: 'none' },
    tableHeadMenu: { width: '4.06%', maxWidth: 56, border: 'none' },
  });

const QuestionBankTableHead = () => {
  const styles = makeStyles();

  return (
    <TableHead
      sx={styles.tableHead}
      data-testid={QUESTION_BANK_TABLE_HEAD_TEST_IDS.HEAD}
    >
      <TableRow>
        <TableCell sx={styles.tableHeadQuestion}>Question</TableCell>
        <TableCell sx={styles.tableHeadQuestion}>
          Time Sensitive Concerns
        </TableCell>
        <TableCell sx={styles.tableHeadCreatedBy}>Created By</TableCell>
        <TableCell sx={styles.tableHeadLastUpdated}>Last Updated</TableCell>
        <TableCell sx={styles.tableHeadMenu} />
      </TableRow>
    </TableHead>
  );
};

export default QuestionBankTableHead;
