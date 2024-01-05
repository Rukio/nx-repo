import {
  Menu,
  MenuItem as Item,
  SxStylesValue,
  Typography,
} from '@*company-data-covered*/design-system';

export type MenuItem = {
  text: string;
  onClick: () => void;
  styles?: SxStylesValue;
};

type GenericMenuProps = {
  items: MenuItem[];
  testIdPrefix: string;
  anchorEl: null | HTMLElement;
  onClose: () => void;
  menuPosition?: string;
};

type PositionKey = 'left' | 'right' | 'top' | 'bottom';
type HorizontalTypes = 'center' | 'left' | 'right';
type VerticalTypes = 'center' | 'top' | 'bottom';
type PositionObjectType = {
  vertical: VerticalTypes;
  horizontal: HorizontalTypes;
};

const POSITIONS = {
  left: {
    anchorOrigin: { vertical: 'center', horizontal: 'left' },
    transformOrigin: { vertical: 'center', horizontal: 'right' },
  },
  right: {
    anchorOrigin: { vertical: 'center', horizontal: 'right' },
    transformOrigin: { vertical: 'center', horizontal: 'left' },
  },
  top: {
    anchorOrigin: { vertical: 'top', horizontal: 'center' },
    transformOrigin: { vertical: 'bottom', horizontal: 'center' },
  },
  bottom: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
  },
};

export const GenericMenu = ({
  testIdPrefix,
  items,
  anchorEl,
  onClose,
  menuPosition = 'bottom',
}: GenericMenuProps) => {
  const open = Boolean(anchorEl);

  return (
    <Menu
      data-testid={`${testIdPrefix}-menu`}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={
        POSITIONS[menuPosition as PositionKey]
          .anchorOrigin as PositionObjectType
      }
      transformOrigin={
        POSITIONS[menuPosition as PositionKey]
          .transformOrigin as PositionObjectType
      }
    >
      {items.map((item: MenuItem) => (
        <Item
          data-testid={`${testIdPrefix}-${item.text
            .replace(/[ ]/g, '-')
            .toLowerCase()}-menu-item`}
          onClick={() => item.onClick()}
          key={item.text}
          sx={item.styles}
        >
          <Typography variant="body2">{item.text}</Typography>
        </Item>
      ))}
    </Menu>
  );
};
