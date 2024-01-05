import { isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { format } from 'date-fns-tz';
import { FC, ReactNode, useState } from 'react';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  makeSxStyles,
  StarIcon,
  theme,
  Typography,
} from '../../';
import { NOTE_TEST_IDS } from './testIds';
import MoreMenu, { MoreMenuProps } from './components/MoreMenu';
import EditSection from './components/EditSection';

export interface NoteProps
  extends Omit<
    MoreMenuProps,
    'onFeaturedClick' | 'onDeleteClick' | 'onEditClick'
  > {
  id: number;
  text: string;
  showInitials?: boolean;
  displayDate?: Date | string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  deletionExpirationMs?: number;
  textWrapper?: (props: { children: string }) => ReactNode;
  isEdited?: boolean;
  tag?: string;
  onToggleFeatured?: (noteId: number, newValue: boolean) => void;
  onDelete?: (noteId: number) => void;
  onEdit?: (noteId: number, text: string) => void;
}

const makeStyles = ({ featured }: { featured?: boolean }) => {
  const avatarSideLength = '32px';

  return makeSxStyles({
    root: {
      padding: 1,
      alignItems: 'start',
      position: 'relative',
      backgroundColor: featured
        ? alpha(theme.palette.secondary.main, 0.08)
        : 'unset',
      borderRadius: '8px',
      flexDirection: 'column',
    },
    listItemAvatar: {
      minWidth: avatarSideLength,
      mr: 1,
    },
    avatar: { width: avatarSideLength, height: avatarSideLength },
    listItemText: { m: 0 },
    secondaryLabel: { color: 'text.secondary', fontFamily: 'Open Sans' },
    text: { mt: 0.5, color: 'common.black', overflowWrap: 'anywhere' },
    infoWrapper: {
      display: 'flex',
      flexDirection: 'row',
    },
    featuredLabelWrapper: {
      py: 0.25,
      mb: 1,
    },
    listItemAlert: {
      padding: 1,
    },
    deleteAlert: {
      width: '100%',
    },
    textWithoutUserInfo: {
      paddingRight: 4,
    },
  });
};
export const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) {
    return '';
  }

  return `${firstName?.charAt(0) ?? ''}${
    lastName?.charAt(0) ?? ''
  }`.toUpperCase();
};

export const getUpdatedAtLabel = (displayDate?: Date | string) => {
  if (!displayDate) {
    return null;
  }
  const date = new Date(displayDate);

  if (!isValid(date)) {
    return null;
  }

  return format(date, "M/d/yyyy 'at' KK:mm aa z", {
    locale: enUS,
  });
};

export const getSecondaryLabel = ({
  isEdited,
  updatedAtLabel,
  tag,
}: {
  isEdited: boolean;
  updatedAtLabel: string | null;
  tag?: string;
}) => {
  const labels = [];
  if (isEdited) {
    labels.push('Edited');
  }
  if (updatedAtLabel) {
    labels.push(updatedAtLabel);
  }
  if (tag) {
    labels.push(tag);
  }

  return labels.join(' • ');
};

const Note: FC<NoteProps> = ({
  id,
  text,
  showInitials = true,
  displayDate,
  firstName,
  lastName,
  jobTitle,
  isFeaturedNoteEnabled,
  featured,
  isEditingEnabled,
  isDeletingEnabled,
  deletionExpirationMs = 5000,
  textWrapper,
  isEdited = false,
  tag,
  onToggleFeatured,
  onDelete,
  onEdit,
}) => {
  const styles = makeStyles({ featured });

  const [showDeletedAlert, setShowDeletedAlert] = useState(false);
  const [deletionTimeout, setDeletionTimeout] = useState<
    NodeJS.Timeout | undefined
  >();
  const [isEditing, setEditing] = useState(false);

  const updatedAtLabel = getUpdatedAtLabel(displayDate);

  const secondaryLabel = getSecondaryLabel({ isEdited, updatedAtLabel, tag });

  const initials = getInitials(firstName, lastName);

  const jobTitleLabel = !!jobTitle && `, ${jobTitle}`;

  const onFeaturedClick = () => {
    onToggleFeatured?.(id, !featured);
  };

  const toggleDeletedAlert = () => {
    setShowDeletedAlert((prev) => !prev);
  };

  const onDeleteClick = () => {
    toggleDeletedAlert();
    const timeout = setTimeout(() => {
      onDelete?.(id);
    }, deletionExpirationMs);
    setDeletionTimeout(timeout);
  };

  const onDeleteUndoClick = () => {
    clearTimeout(deletionTimeout);
    toggleDeletedAlert();
  };

  const toggleEditing = () => {
    setEditing((prev) => !prev);
  };

  const onSaveEditing = (newText: string) => {
    toggleEditing();
    onEdit?.(id, newText);
  };

  if (showDeletedAlert) {
    return (
      <ListItem sx={styles.listItemAlert}>
        <Alert
          sx={styles.deleteAlert}
          severity="info"
          message="Note deleted"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={onDeleteUndoClick}
              data-testid={NOTE_TEST_IDS.UNDO_DELETE_BUTTON}
            >
              Undo
            </Button>
          }
          data-testid={NOTE_TEST_IDS.DELETED_ALERT}
        />
      </ListItem>
    );
  }

  if (isEditing) {
    return (
      <ListItem sx={styles.root}>
        <EditSection
          text={text}
          onCancel={toggleEditing}
          onSave={onSaveEditing}
        />
      </ListItem>
    );
  }

  const isWithoutUserInfo = !initials && !jobTitleLabel && !secondaryLabel;

  return (
    <ListItem sx={styles.root} data-testid={NOTE_TEST_IDS.getNoteByTestId(id)}>
      {featured && (
        <Box sx={styles.featuredLabelWrapper}>
          <Chip
            label="Featured Note"
            icon={<StarIcon />}
            color="secondary"
            size="small"
            data-testid={NOTE_TEST_IDS.FEATURED_NOTE_CHIP}
          />
        </Box>
      )}
      <Box sx={styles.infoWrapper}>
        {showInitials && initials && (
          <ListItemAvatar sx={styles.listItemAvatar}>
            <Avatar sx={styles.avatar} data-testid={NOTE_TEST_IDS.INITIALS}>
              {initials}
            </Avatar>
          </ListItemAvatar>
        )}
        <ListItemText
          sx={styles.listItemText}
          disableTypography
          primary={
            <Typography
              variant="subtitle2"
              data-testid={NOTE_TEST_IDS.DISPLAY_NAME}
            >
              {firstName} {lastName}
              {jobTitleLabel}
            </Typography>
          }
          secondary={
            <>
              {secondaryLabel && (
                <Typography
                  sx={styles.secondaryLabel}
                  variant="label"
                  data-testid={NOTE_TEST_IDS.SECONDARY_LABEL}
                >
                  {secondaryLabel}
                </Typography>
              )}
              <Typography
                sx={[
                  styles.text,
                  isWithoutUserInfo && styles.textWithoutUserInfo,
                ]}
                variant="body2"
                data-testid={NOTE_TEST_IDS.TEXT}
              >
                {textWrapper?.({ children: text }) ?? text}
              </Typography>
            </>
          }
        />
      </Box>
      <ListItemSecondaryAction
        sx={{ top: 8, right: 8, transform: 'none' }}
        data-testid={NOTE_TEST_IDS.getNoteActionByTestId(id)}
      >
        <MoreMenu
          isFeaturedNoteEnabled={isFeaturedNoteEnabled}
          featured={featured}
          isEditingEnabled={isEditingEnabled}
          isDeletingEnabled={isDeletingEnabled}
          onFeaturedClick={onFeaturedClick}
          onDeleteClick={onDeleteClick}
          onEditClick={toggleEditing}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default Note;
