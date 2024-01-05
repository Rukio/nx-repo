import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  CloseIcon,
  Grid,
  IconButton,
  DialogContent,
  DialogActions,
  Button,
  ButtonProps,
  DialogActionsProps,
  DialogContentProps,
  DialogProps,
  DialogTitleProps,
  IconButtonProps,
} from '../..';
import { SxProps, Theme } from '@mui/system';

type DhDialogContentProps = DialogContentProps & {
  sx: Omit<SxProps<Theme>, 'minWidth' | 'minHeight'>;
};
type DhDialogTitleProps = DialogTitleProps & { sx: Omit<SxProps<Theme>, 'p'> };
type DhActionActionProps = DialogActionsProps & {
  sx: Omit<SxProps<Theme>, 'p'>;
};

export interface DhDialogProps {
  cancelButtonProps?: ButtonProps;
  cancelButtonLabel?: ReactNode;
  confirmButtonLabel?: ReactNode;
  confirmButtonProps?: ButtonProps;
  content: ReactNode;
  dialogActionsProps?: DhActionActionProps;
  dialogContentProps?: DhDialogContentProps;
  dialogProps?: Omit<DialogProps, 'open' | 'onClose' | 'fullScreen'>;
  dialogTitleProps?: DhDialogTitleProps;
  fixedHeight?: string;
  fullScreen?: boolean;
  handleClose?: () => void;
  handleConfirm?: () => void;
  iconButtonProps?: IconButtonProps;
  isOpen: boolean;
  title: ReactNode;
}

const DhDialog: React.FC<DhDialogProps> = ({
  cancelButtonProps,
  cancelButtonLabel,
  confirmButtonLabel = 'Save',
  confirmButtonProps,
  content,
  dialogActionsProps,
  dialogContentProps,
  dialogProps,
  dialogTitleProps,
  fixedHeight,
  fullScreen,
  handleClose,
  handleConfirm,
  iconButtonProps,
  isOpen,
  title,
}) => {
  const dialogContentSxProp: DialogContentProps['sx'] = {
    ...dialogContentProps?.sx,
    minWidth: '444px',
    minHeight: '40px',
    ...(!fullScreen && fixedHeight && { height: fixedHeight }),
  };
  const dialogTitleSxProp: DialogTitleProps['sx'] = {
    ...dialogTitleProps?.sx,
    p: 3,
  };
  const dialogActionsSxProp: DialogActionsProps['sx'] = {
    ...dialogActionsProps?.sx,
    p: 3,
  };
  const showDividers = !!(!fullScreen && fixedHeight);

  return (
    <Dialog
      maxWidth="md"
      {...dialogProps}
      open={isOpen}
      onClose={handleClose}
      fullScreen={fullScreen}
    >
      <DialogTitle {...dialogTitleProps} sx={dialogTitleSxProp}>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Grid item xs={10}>
            {title}
          </Grid>
          <Grid container justifyContent="end" item xs={2}>
            <Grid item>
              <IconButton
                aria-label="close"
                {...iconButtonProps}
                onClick={handleClose}
              >
                <CloseIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent
        {...dialogContentProps}
        sx={dialogContentSxProp}
        dividers={showDividers}
      >
        {content}
      </DialogContent>
      <DialogActions {...dialogActionsProps} sx={dialogActionsSxProp}>
        {cancelButtonLabel && (
          <Button {...cancelButtonProps} onClick={handleClose}>
            {cancelButtonLabel}
          </Button>
        )}

        <Button
          {...confirmButtonProps}
          onClick={handleConfirm}
          variant="contained"
        >
          {confirmButtonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DhDialog;
