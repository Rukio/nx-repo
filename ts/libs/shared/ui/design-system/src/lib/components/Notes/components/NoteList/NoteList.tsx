import { Children, FC, ReactElement } from 'react';
import { makeSxStyles } from '../../../../utils/makeSxStyles';
import {
  Box,
  MenuItem,
  Select,
  Grid,
  List,
  SelectChangeEvent,
} from '../../../..';
import { NoteProps } from '../../../Note';
import Typography from '../../../Typography';
import { NOTES_TEST_IDS } from '../../testIds';
import EmptyNoteMessage from '../EmptyNoteMessage';

export type FilterOption = { label: string; value: string; disabled?: boolean };

export type NoteListProps = {
  children?: ReactElement<NoteProps>[] | ReactElement<NoteProps>;
  listLabel?: string | null;
  filterOptions?: FilterOption[];
  defaultFilterValue?: string;
  onFilterChange?: (value: FilterOption['value']) => void;
};

const makeStyles = ({
  showEmptyNoteMessageOffset,
}: {
  showEmptyNoteMessageOffset?: boolean;
}) =>
  makeSxStyles({
    listHeaderContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    listLabelGridItem: {
      mr: '60%',
    },
    filterSelectGridItem: {
      flexGrow: 1,
    },
    emptyNoteMessageWrapper: {
      mt: showEmptyNoteMessageOffset ? 3 : 0,
    },
  });

const NoteList: FC<NoteListProps> = ({
  children,
  listLabel = 'Notes',
  filterOptions = [],
  defaultFilterValue = '',
  onFilterChange,
}) => {
  const showFiltersSelect = !!filterOptions?.length;

  const styles = makeStyles({
    showEmptyNoteMessageOffset: showFiltersSelect || !!listLabel,
  });

  const isNoteListEmpty = Children.count(children) <= 0;

  const showListLabel = !!listLabel && (!isNoteListEmpty || showFiltersSelect);
  const handleFilterChange = (event: SelectChangeEvent) => {
    onFilterChange?.(event.target.value);
  };

  return (
    <>
      <Grid container spacing={1} sx={styles.listHeaderContainer}>
        <Grid item sx={styles.listLabelGridItem}>
          {showListLabel && (
            <Typography variant="h6" data-testid={NOTES_TEST_IDS.LIST_LABEL}>
              {listLabel}
            </Typography>
          )}
        </Grid>
        {showFiltersSelect && (
          <Grid item sx={styles.filterSelectGridItem}>
            <Select
              size="small"
              defaultValue={defaultFilterValue}
              onChange={handleFilterChange}
              fullWidth
              data-testid={NOTES_TEST_IDS.FILTER_SELECT}
            >
              {filterOptions.map((filterOption) => (
                <MenuItem
                  key={filterOption.value}
                  value={filterOption.value}
                  disabled={filterOption.disabled}
                  data-testid={NOTES_TEST_IDS.getFilterOptionTestIdByValue(
                    filterOption.value
                  )}
                >
                  {filterOption.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        )}
      </Grid>
      {isNoteListEmpty ? (
        <Box sx={styles.emptyNoteMessageWrapper}>
          <EmptyNoteMessage />
        </Box>
      ) : (
        <List data-testid={NOTES_TEST_IDS.LIST}>{children}</List>
      )}
    </>
  );
};

export default NoteList;
