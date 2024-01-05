import { useSelector } from 'react-redux';
import { ModalityControls as ModalityControlsUI } from '@*company-data-covered*/modality/ui';
import { Snackbar, Alert } from '@*company-data-covered*/design-system';
import {
  useAppDispatch,
  selectSelectedServiceLine,
  resetModalityConfigurationsState,
  patchUpdateModalityConfigurations,
  selectModalityConfigurationsLoadingState,
  setShowSuccessMessage,
} from '@*company-data-covered*/modality/data-access';
import { MODALITY_CONTROLS_TEST_IDS } from './testIds';

const ModalityControls = () => {
  const dispatch = useAppDispatch();
  const selectedServiceLine = useSelector(selectSelectedServiceLine);
  const { isLoading: isLoadingPathUpdateModalities, showSuccessMessage } =
    useSelector(selectModalityConfigurationsLoadingState);

  const onCancel = () => {
    if (selectedServiceLine?.id) {
      dispatch(resetModalityConfigurationsState(selectedServiceLine.id));
    }
  };

  const onSaveModalities = () => {
    if (selectedServiceLine?.id) {
      dispatch(patchUpdateModalityConfigurations(selectedServiceLine.id));
    }
  };

  const onCloseNotification = () =>
    dispatch(setShowSuccessMessage({ showSuccessMessage: false }));

  return (
    <div>
      <ModalityControlsUI
        isLoading={isLoadingPathUpdateModalities}
        onCancel={onCancel}
        onSave={onSaveModalities}
      />
      <Snackbar
        open={showSuccessMessage && !isLoadingPathUpdateModalities}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={onCloseNotification}
      >
        <div>
          <Alert
            message="Note saved"
            variant="filled"
            severity="success"
            data-testid={MODALITY_CONTROLS_TEST_IDS.NOTIFICATION_MESSAGE}
          />
        </div>
      </Snackbar>
    </div>
  );
};

export default ModalityControls;
