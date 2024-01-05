import React, { useCallback, useMemo, useState } from 'react';
import {
  IconButton,
  MoreHorizIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  useDeleteNote,
  usePinNote,
  useUnpinNote,
} from '@*company-data-covered*/caremanager/data-access';
import { GenericMenu, MenuItem } from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  deleteOption: { color: (theme) => theme.palette.error.main },
});

type MoreMenuButtonProps = {
  noteId: string;
  episodeId: string;
  pinned: boolean;
  setShowEdit: (value: boolean) => void;
  pinButtonEnabled: boolean;
};

const MoreMenuButton = React.memo(
  ({
    noteId,
    episodeId,
    setShowEdit,
    pinned,
    pinButtonEnabled = true,
  }: MoreMenuButtonProps) => {
    const { mutate: deleteNote } = useDeleteNote(episodeId);
    const { mutate: pinNote } = usePinNote(episodeId);
    const { mutate: unpinNote } = useUnpinNote(episodeId);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const onDelete = useCallback(() => {
      deleteNote({ noteId });
      handleClose();
    }, [deleteNote, noteId]);

    const onPinNote = useCallback(() => {
      pinNote({ noteId });
      handleClose();
    }, [noteId, pinNote]);

    const onUnpinNote = useCallback(() => {
      unpinNote({ noteId });
      handleClose();
    }, [noteId, unpinNote]);

    const items: MenuItem[] = useMemo(() => {
      const onClickEdit = () => {
        setShowEdit(true);
      };
      const menuItems = [
        {
          text: 'Edit',
          onClick: () => onClickEdit(),
        },
        {
          text: 'Delete',
          styles: styles.deleteOption,
          onClick: () => onDelete(),
        },
      ];
      pinButtonEnabled &&
        menuItems.splice(1, 0, {
          text: pinned ? 'Unpin' : 'Pin',
          onClick: pinned ? () => onUnpinNote() : () => onPinNote(),
        });

      return menuItems;
    }, [
      onDelete,
      onPinNote,
      onUnpinNote,
      pinButtonEnabled,
      pinned,
      setShowEdit,
    ]);

    return (
      <>
        <IconButton
          data-testid={`note-overview-more-button-${noteId}`}
          className="edit-icon"
          onClick={handleClick}
        >
          <MoreHorizIcon />
        </IconButton>
        <GenericMenu
          testIdPrefix="note-overview"
          anchorEl={anchorEl}
          menuPosition="right"
          onClose={handleClose}
          items={items}
        />
      </>
    );
  }
);

export default MoreMenuButton;
