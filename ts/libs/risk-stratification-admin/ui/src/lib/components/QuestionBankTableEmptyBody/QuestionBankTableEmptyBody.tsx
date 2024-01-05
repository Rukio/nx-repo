import {
  makeSxStyles,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@*company-data-covered*/design-system';
import { FC, PropsWithChildren } from 'react';
import { QUESTION_BANK_TABLE_EMPTY_BODY_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    tableBody: { boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.12)' },
    emptyBodyWrapper: { textAlign: 'center', border: 'none', paddingY: 4 },
  });

interface Props {
  text: string;
}

const QuestionBankTableEmptyBody: FC<PropsWithChildren<Props>> = ({
  text,
  children,
}) => {
  const styles = makeStyles();

  return (
    <TableBody
      sx={styles.tableBody}
      data-testid={QUESTION_BANK_TABLE_EMPTY_BODY_TEST_IDS.EMPTY_BODY}
    >
      <TableRow>
        <TableCell colSpan={5} sx={styles.emptyBodyWrapper}>
          {children}

          <Typography variant="body1" color="text.secondary">
            {text}
          </Typography>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

export default QuestionBankTableEmptyBody;
