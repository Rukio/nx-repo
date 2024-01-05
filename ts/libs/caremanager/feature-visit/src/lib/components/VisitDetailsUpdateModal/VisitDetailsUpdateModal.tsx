import * as Yup from 'yup';

import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  useGetVisitTypes,
  useUpdateVisit,
} from '@*company-data-covered*/caremanager/data-access';
import {
  Visit,
  VisitListElement,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import { FormikModal, FormikSelectField } from '@*company-data-covered*/caremanager/ui';

export const testIds = {
  DIALOG: 'visit-details-update-dialog',
  FORM: 'visit-details-update-form',
  VISIT_TYPE_BOX: 'visit-details-update-visit-type-box',
  CANCEL_BUTTON: 'visit-details-update-cancel-button',
  SAVE_BUTTON: 'visit-details-update-save-button',
};

const styles = makeSxStyles({
  modalContent: {
    display: 'grid',
    gap: '32px',
    padding: {
      xs: '0',
      md: '0 48px 24px 48px',
    },
    width: {
      xs: '200px',
      sm: '320px',
      md: '400px',
    },
  },
  modalTitle: {
    padding: '16px 24px',
  },
});

const validationSchema = Yup.object({
  visitTypeId: Yup.string().required(),
});

type FormSchema = Yup.InferType<typeof validationSchema>;

interface VisitDetailsUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: Visit | VisitListElement;
}

export const VisitDetailsUpdateModal: React.FC<
  VisitDetailsUpdateModalProps
> = ({ isOpen, onClose, visit }) => {
  const { data: visitTypes, isLoading: isLoadingVisitTypes } =
    useGetVisitTypes();
  const visitTypeOptions =
    visitTypes?.visitTypes.filter(({ isCallType }) => !isCallType) || [];

  const { mutateAsync: updateVisit, isLoading: isUpdateVisitLoading } =
    useUpdateVisit();
  const { showSuccess } = useSnackbar();

  const initialValues: FormSchema = {
    visitTypeId: visit.typeId || '',
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (formValues: FormSchema) => {
    if (formValues.visitTypeId !== initialValues.visitTypeId) {
      await updateVisit(
        {
          visitId: visit.id,
          body: {
            visitTypeId: formValues.visitTypeId,
          },
        },
        {
          onSuccess: () => {
            showSuccess(SNACKBAR_MESSAGES.UPDATED_VISIT);
          },
        }
      );
    }

    handleClose();
  };

  if (isLoadingVisitTypes) {
    return null;
  }

  return (
    <FormikModal
      title="Visit Details"
      isOpen={isOpen}
      onClose={onClose}
      testIdPrefix="visit-details-update"
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      isSubmitting={isUpdateVisitLoading}
      titleSx={styles.modalTitle}
    >
      <Box sx={styles.modalContent}>
        <Box data-testid={testIds.VISIT_TYPE_BOX}>
          <FormikSelectField
            options={visitTypeOptions}
            label="Visit Type"
            name="visitTypeId"
            fullWidth
          />
        </Box>
      </Box>
    </FormikModal>
  );
};
