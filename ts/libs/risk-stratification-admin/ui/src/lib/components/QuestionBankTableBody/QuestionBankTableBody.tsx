import {
  makeSxStyles,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@*company-data-covered*/design-system';
import { format } from 'date-fns';
import { ActionsCell } from './ActionsCell';
import { FC } from 'react';
import { QuestionBankQuestion } from '../../types';
import {
  TimeSensitiveConcernsCell,
  TimeSensitiveConcernsCellProps,
} from './TimeSensitiveConcernsCell';
import { QUESTION_BANK_TABLE_BODY_TEST_IDS as TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    tableBody: { boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.12)' },
    questionCell: { verticalAlign: 'top' },
  });

interface Props {
  onDelete: (id: QuestionBankQuestion['id']) => void;
  questions: QuestionBankQuestion[];
  maxConcerns?: TimeSensitiveConcernsCellProps['maxConcerns'];
  onEdit: (
    questionId: QuestionBankQuestion['id'],
    patientQuestion: string,
    noPatientQuestion?: string
  ) => void;
}

const QuestionBankTableBody: FC<Props> = ({
  onEdit,
  questions,
  maxConcerns,
  onDelete,
}) => {
  const styles = makeStyles();

  const createHandleOnDelete = (question: QuestionBankQuestion) => () =>
    onDelete(question.id);

  const createHandleOnEdit =
    (question: QuestionBankQuestion) =>
    (patientQuestion: string, noPatientQuestion?: string) =>
      onEdit(question.id, patientQuestion, noPatientQuestion);

  return (
    <TableBody sx={styles.tableBody} data-testid={TEST_IDS.BODY}>
      {questions.map((question) => (
        <TableRow key={question.id}>
          <TableCell sx={styles.questionCell}>
            <Typography variant="subtitle2" color="primary">
              {question.patientQuestion}
            </Typography>
            <Typography variant="label" color="secondary">
              {question.id} • v{question.version}
            </Typography>
          </TableCell>

          <TimeSensitiveConcernsCell
            maxConcerns={maxConcerns}
            timeSensitiveConcerns={question.timeSensitiveConcerns}
          />

          <TableCell>
            <Typography variant="body2" color="text.primary">
              {question.createdBy}
            </Typography>
          </TableCell>

          <TableCell>
            <Typography variant="body2" color="text.primary">
              {format(new Date(question.lastUpdated), 'MM/dd/yyyy')}
            </Typography>
          </TableCell>

          <ActionsCell
            question={question}
            onEdit={createHandleOnEdit(question)}
            isDeleteDisabled={!question.isDeletable}
            onDelete={createHandleOnDelete(question)}
          />
        </TableRow>
      ))}
    </TableBody>
  );
};

export default QuestionBankTableBody;
