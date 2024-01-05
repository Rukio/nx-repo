import * as Yup from 'yup';
import { Stack, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  useCreateMedicalDecisionMaker,
  useGetPatient,
  useUpdateMedicalDecisionMaker,
} from '@*company-data-covered*/caremanager/data-access';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import { FormikInputField, FormikModal } from '@*company-data-covered*/caremanager/ui';

export const testIds = {
  CANCEL_BUTTON: 'edit-mdm-cancel-button',
  SAVE_BUTTON: 'edit-mdm-save-button',
};

const validationSchema = Yup.object({
  firstName: Yup.string().required('Required'),
  lastName: Yup.string().required('Required'),
  address: Yup.string(),
  phoneNumber: Yup.string().required('Required'),
  relationship: Yup.string().required('Required'),
});

type MedicalDecisionMakerFormSchema = Yup.InferType<typeof validationSchema>;

interface EditMedicalDecisionMakerModalProps {
  onClose: () => void;
  open: boolean;
  patientId: string;
}
const styles = makeSxStyles({ modalContent: { width: { sm: '440px' } } });

const EditMedicalDecisionMakerModal: React.FC<
  EditMedicalDecisionMakerModalProps
> = ({ onClose, open, patientId }) => {
  const { data: patientResponse, isLoading } = useGetPatient(patientId);
  const { mutateAsync: createMedicalDecisionMaker } =
    useCreateMedicalDecisionMaker();
  const { mutateAsync: updateMedicalDecisionMaker } =
    useUpdateMedicalDecisionMaker();

  const { showSuccess, showError } = useSnackbar();

  if (isLoading) {
    return null;
  }

  const medicalDecisionMaker = patientResponse?.medicalDecisionMakers?.[0];

  const initialValues: MedicalDecisionMakerFormSchema = {
    firstName: medicalDecisionMaker?.firstName ?? '',
    lastName: medicalDecisionMaker?.lastName ?? '',
    address: medicalDecisionMaker?.address ?? '',
    phoneNumber: medicalDecisionMaker?.phoneNumber ?? '',
    relationship: medicalDecisionMaker?.relationship ?? '',
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (values: MedicalDecisionMakerFormSchema) => {
    try {
      if (medicalDecisionMaker) {
        await updateMedicalDecisionMaker({
          medicalDecisionMakerId: medicalDecisionMaker.id,
          body: {
            ...values,
          },
        });
      } else {
        await createMedicalDecisionMaker({
          body: {
            ...values,
            patientId,
          },
        });
      }

      showSuccess(SNACKBAR_MESSAGES.EDITED_MEDICAL_DECISION_MAKER);
    } catch (e) {
      await showError(e as Response);
    }

    handleClose();
  };

  return (
    <FormikModal
      title="Medical Decision Maker"
      isOpen={open}
      onClose={handleClose}
      testIdPrefix="edit-mdm"
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      contentSx={styles.modalContent}
    >
      <Stack
        spacing={3}
        paddingX={3}
        paddingTop={2.5}
        paddingBottom={1}
        direction="column"
      >
        <FormikInputField
          fieldData={{
            label: 'First Name',
            name: 'firstName',
          }}
        />
        <FormikInputField
          fieldData={{
            label: 'Last Name',
            name: 'lastName',
          }}
        />
        <FormikInputField
          fieldData={{
            label: 'Address',
            name: 'address',
          }}
        />
        <FormikInputField
          fieldData={{
            label: 'Phone Number',
            name: 'phoneNumber',
          }}
        />
        <FormikInputField
          fieldData={{
            label: 'Relationship',
            name: 'relationship',
          }}
        />
      </Stack>
    </FormikModal>
  );
};

export default EditMedicalDecisionMakerModal;
