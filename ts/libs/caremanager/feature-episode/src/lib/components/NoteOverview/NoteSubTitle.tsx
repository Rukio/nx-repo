import { FC } from 'react';
import {
  Box,
  PushPinIcon,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  formattedDateWithTime,
  getFullName,
} from '@*company-data-covered*/caremanager/utils';
import {
  NOTE_TYPES_TEXTS,
  Note,
  User,
} from '@*company-data-covered*/caremanager/data-access-types';

const styles = makeSxStyles({
  subtitle: {
    color: (theme) => theme.palette.text.secondary,
    fontSize: '12px',
    flexWrap: 'wrap',
    display: 'flex',
    span: {
      marginLeft: '5px',
    },
  },
  pinIcon: { height: '13px', color: (theme) => theme.palette.primary.main },
});

interface Props {
  note: Note;
  user?: User;
}

const NoteSubTitle: FC<Props> = ({ note, user }) => {
  const { createdAt, updatedAt, id, pinned, noteKind } = note;
  const completeName = user
    ? getFullName({
        firstName: user.firstName,
        lastName: user.lastName,
      })
    : '';
  const jobTitle = user?.jobTitle;

  const lastUpdated = updatedAt || createdAt;
  const isEdited = updatedAt && createdAt !== updatedAt;
  const dateToShow = lastUpdated ? new Date(lastUpdated) : new Date();
  const noteDateTexts = formattedDateWithTime(dateToShow).split('at');

  return (
    <Stack
      data-testid={`note-overview-header-${id}`}
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={1}
    >
      <Typography variant="subtitle2">
        {completeName} {jobTitle}
      </Typography>
      {pinned && (
        <Box
          data-testid={`note-subtitle-pin-label-${id}`}
          display="flex"
          alignItems="center"
        >
          <PushPinIcon sx={styles.pinIcon} />
          <Typography
            sx={styles.subtitle}
            data-testid={`note-overview-kind-${id}-label`}
          >
            Pinned ·
          </Typography>
        </Box>
      )}
      <Typography
        sx={styles.subtitle}
        data-testid={`note-overview-kind-${id}-label`}
      >
        {isEdited && (
          <span data-testid={`note-subtitle-edited-label-${id}`}>Edited ·</span>
        )}
        <span data-testid={`note-subtitle-date-label-${id}`}>
          {`${noteDateTexts[0]}at `}
        </span>
        <span data-testid={`note-subtitle-time-label-${id}`}>
          {`${noteDateTexts[1]} · `}
        </span>
        <span data-testid={`note-subtitle-kind-label-${id}`}>
          {Object.prototype.hasOwnProperty.call(NOTE_TYPES_TEXTS, noteKind)
            ? NOTE_TYPES_TEXTS[noteKind as keyof typeof NOTE_TYPES_TEXTS]
            : ''}
        </span>
      </Typography>
    </Stack>
  );
};

export default NoteSubTitle;
