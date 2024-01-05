import { FC, useState, ChangeEvent } from 'react';
import {
  Button,
  Grid,
  TextField,
  Typography,
  Box,
  Chip,
  makeSxStyles,
  ClickAwayListener,
} from '../../../..';
import { NOTES_TEST_IDS } from '../../testIds';

export type ComposeSectionProps = {
  maxRows?: number;
  multiline?: boolean;
  withTags?: boolean;
  tags?: string[];
  onSubmit?: (data: { text: string; tag?: string }) => void;
};

export const DEFAULT_TAGS = [
  'General Note',
  'Daily Update',
  'Clinical Note',
  'Navigator Note',
];

const makeStyles = () =>
  makeSxStyles({
    composeInput: {
      mt: 1,
    },
    controlsBox: {
      mt: 2,
    },
    tagsWrapper: {
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      overflow: 'auto',
    },
    tagsTitle: {
      mr: 1,
    },
    tag: {
      mr: 0.5,
    },
  });

const ComposeSection: FC<ComposeSectionProps> = ({
  maxRows = 5,
  multiline = true,
  withTags,
  tags = DEFAULT_TAGS,
  onSubmit,
}) => {
  const styles = makeStyles();

  const [note, setNote] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>(tags[0]);
  const [inputFocused, setInputFocused] = useState(false);

  const onNoteChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value },
    } = ev;
    setNote(value);
  };

  const onSelectTag = (tag: string) => {
    setSelectedTag(tag);
  };

  const onDiscardClick = () => {
    setNote('');
    setSelectedTag(tags[0]);
  };

  const onFocus = () => {
    setInputFocused(true);
  };

  const onClickAway = () => {
    setInputFocused(false);
  };

  const onPostButtonClick = () => {
    const text = note.trim();
    onSubmit?.({ text, ...(withTags && { tag: selectedTag }) });
    setNote('');
    setSelectedTag(tags[0]);
  };

  const showControls = inputFocused || !!note;

  return (
    <ClickAwayListener onClickAway={onClickAway}>
      <div>
        <Typography variant="subtitle2">Compose</Typography>
        <TextField
          placeholder="Add a note for the team"
          size="small"
          fullWidth
          onFocus={onFocus}
          onChange={onNoteChange}
          value={note}
          multiline={multiline}
          maxRows={maxRows}
          sx={styles.composeInput}
          inputProps={{
            'data-testid': NOTES_TEST_IDS.COMPOSE_INPUT,
          }}
        />
        {showControls && (
          <Box sx={styles.controlsBox}>
            {withTags && (
              <Box
                sx={styles.tagsWrapper}
                data-testid={NOTES_TEST_IDS.TAGS_WRAPPER}
              >
                <Typography variant="subtitle2" sx={styles.tagsTitle}>
                  Tags
                </Typography>
                {tags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  const color = isSelected ? 'primary' : 'default';
                  const variant = isSelected ? 'filled' : 'outlined';

                  return (
                    <Chip
                      key={tag}
                      label={tag}
                      color={color}
                      variant={variant}
                      onClick={() => onSelectTag(tag)}
                      sx={styles.tag}
                      data-testid={NOTES_TEST_IDS.getTagTestIdByName(tag)}
                      data-selected={isSelected}
                    />
                  );
                })}
              </Box>
            )}
            <Grid container spacing={2} justifyContent="end">
              <Grid item>
                <Button
                  size="small"
                  variant="text"
                  onClick={onDiscardClick}
                  data-testid={NOTES_TEST_IDS.COMPOSE_DISCARD_BUTTON}
                >
                  Discard
                </Button>
              </Grid>
              <Grid item>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!note}
                  onClick={onPostButtonClick}
                  data-testid={NOTES_TEST_IDS.COMPOSE_POST_BUTTON}
                >
                  Post
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </div>
    </ClickAwayListener>
  );
};

export default ComposeSection;
