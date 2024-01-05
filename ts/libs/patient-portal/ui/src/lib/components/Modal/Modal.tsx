import { FC, PropsWithChildren } from 'react';
import {
  makeSxStyles,
  Modal as BaseModal,
  ModalProps as BaseModalProps,
  Paper,
} from '@*company-data-covered*/design-system';
import { MODAL_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      width: '80%',
      maxWidth: 720,
      transform: 'translate(-50%, -50%)',
      position: 'absolute',
      top: '50%',
      left: '50%',
      p: theme.spacing(4),
      boxSizing: 'border-box',
      maxHeight: '100%',
      overflow: 'auto',
    }),
  });

export type ModalProps = PropsWithChildren<
  BaseModalProps & {
    testIdPrefix: string;
  }
>;

const Modal: FC<ModalProps> = ({ children, testIdPrefix, ...props }) => {
  const styles = makeStyles();

  return (
    <BaseModal
      data-testid={MODAL_TEST_IDS.getModalTestId(testIdPrefix)}
      {...props}
    >
      <Paper sx={styles.root}>{children}</Paper>
    </BaseModal>
  );
};

export default Modal;
