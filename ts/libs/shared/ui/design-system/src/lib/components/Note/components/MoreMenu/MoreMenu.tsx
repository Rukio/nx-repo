import { FC, useRef, useState } from 'react';
import { MoreHorizIcon } from '../../../../icons/MoreHoriz';
import Typography from '../../../Typography';
import { NOTE_TEST_IDS } from '../../testIds';
import { IconButton, Menu, MenuItem } from '../../../..';

export type MoreMenuProps = {
  isFeaturedNoteEnabled?: boolean;
  featured?: boolean;
  isEditingEnabled?: boolean;
  isDeletingEnabled?: boolean;
  onFeaturedClick?: () => void;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
};

const MoreMenu: FC<MoreMenuProps> = ({
  isFeaturedNoteEnabled = true,
  featured,
  isEditingEnabled = true,
  isDeletingEnabled = true,
  onFeaturedClick,
  onDeleteClick,
  onEditClick,
}) => {
  const [open, setOpen] = useState(false);
  const buttonAnchorRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setOpen((prev) => !prev);
  };

  const featureMenuItemLabel = featured
    ? 'Unfeature Note'
    : 'Make Featured Note';

  const showMenuControlButton =
    isEditingEnabled || isDeletingEnabled || isFeaturedNoteEnabled;

  if (!showMenuControlButton) {
    return null;
  }

  const handleFeatureClick = () => {
    toggleMenu();
    onFeaturedClick?.();
  };

  return (
    <>
      <div ref={buttonAnchorRef}>
        <IconButton
          size="small"
          onClick={toggleMenu}
          data-testid={NOTE_TEST_IDS.MORE_BUTTON}
        >
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </div>
      <Menu
        open={open}
        anchorEl={buttonAnchorRef.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        onClose={toggleMenu}
      >
        {isEditingEnabled && (
          <MenuItem
            onClick={onEditClick}
            data-testid={NOTE_TEST_IDS.EDIT_MENU_ITEM}
          >
            <Typography variant="body2">Edit</Typography>
          </MenuItem>
        )}
        {isFeaturedNoteEnabled && (
          <MenuItem
            onClick={handleFeatureClick}
            data-testid={NOTE_TEST_IDS.TOGGLE_FEATURED_MENU_ITEM}
          >
            <Typography variant="body2">{featureMenuItemLabel}</Typography>
          </MenuItem>
        )}
        {isDeletingEnabled && (
          <MenuItem
            onClick={onDeleteClick}
            data-testid={NOTE_TEST_IDS.DELETE_MENU_ITEM}
          >
            <Typography color="error" variant="body2">
              Delete
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default MoreMenu;
