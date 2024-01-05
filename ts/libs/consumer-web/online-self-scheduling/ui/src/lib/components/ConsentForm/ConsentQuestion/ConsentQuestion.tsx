import { FC } from 'react';
import { Control } from 'react-hook-form';
import { Box, Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import { FormRadioGroup } from '@*company-data-covered*/shared/ui/forms';
import { CONSENT_QUESTION_TEST_IDS } from './testIds';
import { ConsentFormFieldValues, ConsentQuestionsOrder } from '../constants';

export type ConsentQuestionType = {
  question: string;
  answerOptions: string[];
  order: ConsentQuestionsOrder;
};

export type ConsentQuestionProps = {
  consentQuestion: ConsentQuestionType;
  formControl: Control<ConsentFormFieldValues>;
  fieldName:
    | 'firstConsentQuestion'
    | 'secondConsentQuestion'
    | 'thirdConsentQuestion';
};

const makeStyles = () =>
  makeSxStyles({
    questionTitle: {
      fontWeight: '600',
      pb: 2,
    },
    answerLabel: (theme) => ({
      color: theme.palette.text.primary,
    }),
  });

const ConsentQuestion: FC<ConsentQuestionProps> = ({
  consentQuestion,
  formControl,
  fieldName,
}) => {
  const styles = makeStyles();

  return (
    <Box
      data-testid={CONSENT_QUESTION_TEST_IDS.getContainer(
        consentQuestion.order
      )}
    >
      <Typography
        data-testid={CONSENT_QUESTION_TEST_IDS.getTitle(consentQuestion.order)}
        sx={styles.questionTitle}
      >
        {consentQuestion.question}
      </Typography>
      <FormRadioGroup
        control={formControl}
        name={fieldName}
        radioOptions={consentQuestion.answerOptions.map((option) => ({
          label: option,
          value: option,
          'data-testid': CONSENT_QUESTION_TEST_IDS.getAnswer(
            consentQuestion.order,
            option
          ),
        }))}
        optionSx={styles.answerLabel}
      />
    </Box>
  );
};

export default ConsentQuestion;
