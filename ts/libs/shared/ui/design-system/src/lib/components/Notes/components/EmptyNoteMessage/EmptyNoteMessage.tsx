import { Box, makeSxStyles, StickyNote2Icon, Typography } from '../../../..';
import { NOTES_TEST_IDS } from '../../testIds';

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      px: theme.spacing(2),
      color: theme.palette.text.secondary,
    }),
  });

const EmptyNoteMessage = () => {
  const styles = makeStyles();

  return (
    <Box sx={styles.root} data-testid={NOTES_TEST_IDS.EMPTY_MESSAGE}>
      <StickyNote2Icon />
      <Typography mt={1} variant="subtitle2">
        No notes have been added
      </Typography>
    </Box>
  );
};

export default EmptyNoteMessage;
