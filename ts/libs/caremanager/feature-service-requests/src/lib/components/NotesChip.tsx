import {
  Box,
  Chip,
  CommentIcon,
  SxProps,
  Theme,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

export const NOTES_CHIP_TEST_ID = 'notes-chip';

const styles = makeSxStyles({
  notesIconContainer: {
    paddingTop: 0.75,
    paddingLeft: 0.5,
  },
  notesIcon: {
    color: (theme) => theme.palette.text.disabled,
    width: 20,
    height: 20,
  },
});

type Props = {
  count?: string;
  sx?: SxProps<Theme>;
};

export const NotesChip: React.FC<Props> = ({ count, sx }) => {
  return (
    <Chip
      variant="outlined"
      sx={sx}
      label={count ?? '-'}
      icon={
        <Box sx={styles.notesIconContainer}>
          <CommentIcon sx={styles.notesIcon} />
        </Box>
      }
      data-testid={NOTES_CHIP_TEST_ID}
    />
  );
};
