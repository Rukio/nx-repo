import {
  makeSxStyles,
  Typography,
  Stack,
  TextField,
  Box,
  Button,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: {
    paddingTop: '24px',
    width: '100%',
    borderRadius: '6px',
    margin: '4px 0',
    borderBottomColor: (theme) => theme.palette.divider,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    paddingY: 3,
  },
  createNote: {
    marginTop: '10px',
    backgroundColor: (theme) => theme.palette.divider,
    paddingY: 3,
    paddingX: 1,
  },
  textField: {
    backgroundColor: (theme) => theme.palette.background.paper,
  },
  postButton: { fontWeight: '300', marginTop: '20px' },
});

export const VisitNotes = () => {
  return (
    <Stack sx={styles.container}>
      <Typography
        variant="subtitle1"
        fontWeight={500}
        data-testid="daily-updates-label"
      >
        Notes
      </Typography>
      <Box sx={styles.createNote}>
        <TextField
          fullWidth
          multiline
          rows={3}
          maxRows={5}
          variant="outlined"
          data-testid="create-note-text-field"
          placeholder="Add a note for the team"
          sx={styles.textField}
        />
        <Button
          data-testid="create-note-post-button"
          sx={styles.postButton}
          variant="contained"
        >
          Post
        </Button>
      </Box>
    </Stack>
  );
};
