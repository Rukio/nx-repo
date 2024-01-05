import { MouseEvent, useState } from 'react';
import {
  IconButton,
  MoreHorizIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { GenericMenu } from '../GenericMenu';

const styles = makeSxStyles({
  destructiveAction: { color: (theme) => theme.palette.error.main },
});

export type Action = {
  label: string;
  handler: () => void;
  isDestructive?: boolean;
};

type Props = { actions?: Action[]; testIdPrefix?: string };

export const MoreOptionsButton: React.FC<Props> = ({
  actions,
  testIdPrefix = '',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  if (!actions?.length) {
    return null;
  }

  return (
    <>
      <IconButton onClick={handleClick} data-testid={`${testIdPrefix}-open`}>
        <MoreHorizIcon></MoreHorizIcon>
      </IconButton>
      <GenericMenu
        items={actions.map((action) => ({
          text: action.label,
          onClick: () => {
            action.handler();
            handleClose();
          },
          styles: action.isDestructive ? styles.destructiveAction : undefined,
        }))}
        onClose={handleClose}
        anchorEl={anchorEl}
        testIdPrefix={testIdPrefix}
      />
    </>
  );
};
