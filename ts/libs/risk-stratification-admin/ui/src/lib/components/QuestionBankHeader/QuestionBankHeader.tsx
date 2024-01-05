import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { FC } from 'react';
import { Search, SearchProps } from './Search';
import { AddQuestion, AddQuestionProps } from './AddQuestion';
import { QUESTION_BANK_HEADER_TEST_IDS as TEST_IDS } from './testIds';

interface QuestionBankHeaderProps {
  onSearch: SearchProps['onSearch'];
  onAddQuestion: AddQuestionProps['onPublish'];
}

const makeStyles = () =>
  makeSxStyles({
    container: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
  });

const QuestionBankHeader: FC<QuestionBankHeaderProps> = ({
  onSearch,
  onAddQuestion,
}) => {
  const styles = makeStyles();

  return (
    <Box sx={styles.container} data-testid={TEST_IDS.QUESTION_BANK_HEADER}>
      <Box sx={{ width: 295 }}>
        <Search onSearch={onSearch} />
      </Box>

      <AddQuestion onPublish={onAddQuestion} />
    </Box>
  );
};

export { QuestionBankHeaderProps };
export default QuestionBankHeader;
