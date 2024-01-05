import { useState } from 'react';
import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { getAvatarInitials } from '@*company-data-covered*/caremanager/utils';
import {
  useGetUsers,
  useUpdateNote,
} from '@*company-data-covered*/caremanager/data-access';
import { Note, NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import MoreMenuButton from './MoreMenuButton';
import NoteSubTitle from './NoteSubTitle';
import NoteEditSection from './NoteEditSection';

const styles = makeSxStyles({
  avatar: {
    backgroundColor: (theme) => theme.palette.grey.A400,
    color: (theme) => theme.palette.common.white,
  },
  item: {
    padding: { xs: '0 5px', md: '10px 15px' },
    margin: '4px 0',
    '& .MuiListItemSecondaryAction-root': {
      top: { xs: '13%', md: '25%' },
    },
    '&:hover': {
      backgroundColor: (theme) => theme.palette.grey[50],
    },
  },
  avatarContainer: {
    display: { md: 'block' },
    minWidth: { xs: 44, md: 56 },
    '& .MuiAvatar-root': {
      width: { xs: 32, md: 40 },
      height: { xs: 32, md: 40 },
      fontSize: { xs: '1rem', md: '1.25rem' },
    },
  },
});

interface NoteOverviewProps {
  note: Note;
  pinButtonEnabled: boolean;
}

const NoteOverview = ({ note, pinButtonEnabled }: NoteOverviewProps) => {
  const { id, details, noteableId, createdByUserId, updatedByUserId } = note;
  const userId = updatedByUserId || createdByUserId;
  const { data: updatedByUserData } = useGetUsers(
    userId ? [userId] : undefined
  );
  const fallbackUser = note.lastUpdatedBy || note.createdBy;
  const updatedByUser = updatedByUserData?.users[0] || fallbackUser;
  const { mutate: updateNote } = useUpdateNote(noteableId.toString());
  const [showEdit, setShowEdit] = useState(false);
  const initials = updatedByUser
    ? getAvatarInitials(updatedByUser.firstName, updatedByUser.lastName)
    : '';

  const onUpdate = (newDetails: string, newNoteKind: NoteKind) => {
    updateNote({
      noteId: id.toString(),
      body: { details: newDetails, noteKind: newNoteKind },
    });
  };

  const onCancelEdit = () => {
    setShowEdit(false);
  };

  return (
    <ListItem
      alignItems="flex-start"
      data-testid={`note-overview-${id}`}
      sx={styles.item}
      secondaryAction={
        !showEdit && (
          <MoreMenuButton
            noteId={id.toString()}
            episodeId={noteableId.toString()}
            setShowEdit={setShowEdit}
            pinned={!!note.pinned}
            pinButtonEnabled={pinButtonEnabled}
          />
        )
      }
    >
      <ListItemAvatar
        data-testid={`note-overview-avatar-${id}`}
        sx={styles.avatarContainer}
      >
        <Avatar sx={styles.avatar}>{initials}</Avatar>
      </ListItemAvatar>
      {!showEdit && (
        <ListItemText
          primary={<NoteSubTitle note={note} user={updatedByUser} />}
          secondary={
            <Typography
              data-testid={`note-overview-details-${id}`}
              component="span"
              variant="body2"
              whiteSpace="break-spaces"
            >
              {details}
            </Typography>
          }
        />
      )}
      {showEdit && (
        <NoteEditSection
          details={details}
          noteKind={note.noteKind as NoteKind}
          onCancelEdit={onCancelEdit}
          onSave={onUpdate}
        />
      )}
    </ListItem>
  );
};

export default NoteOverview;
