import { FC } from 'react';
import { Box, Paper } from '../..';
import { makeSxStyles } from '../../utils/makeSxStyles';
import ComposeSection, {
  ComposeSectionProps,
} from './components/ComposeSection';
import NoteList, { NoteListProps } from './components/NoteList';

export interface NotesProps extends ComposeSectionProps, NoteListProps {
  withPadding?: boolean;
}

const makeStyles = ({
  withPadding,
}: {
  withPadding: NotesProps['withPadding'];
}) =>
  makeSxStyles({
    root: {
      height: '100%',
      padding: withPadding ? 3 : 0,
    },
    wrapper: {
      height: '100%',
      overflowY: 'auto',
    },
  });

const Notes: FC<NotesProps> = ({
  children,
  withPadding = false,
  multiline,
  maxRows,
  onSubmit,
  listLabel,
  withTags,
  tags,
  filterOptions,
  defaultFilterValue,
  onFilterChange,
}) => {
  const styles = makeStyles({ withPadding });

  return (
    <Paper elevation={0} square sx={styles.root}>
      <Box sx={styles.wrapper}>
        <ComposeSection
          multiline={multiline}
          maxRows={maxRows}
          withTags={withTags}
          tags={tags}
          onSubmit={onSubmit}
        />
        <Box mt={3}>
          <NoteList
            listLabel={listLabel}
            filterOptions={filterOptions}
            defaultFilterValue={defaultFilterValue}
            onFilterChange={onFilterChange}
          >
            {children}
          </NoteList>
        </Box>
      </Box>
    </Paper>
  );
};

export default Notes;
