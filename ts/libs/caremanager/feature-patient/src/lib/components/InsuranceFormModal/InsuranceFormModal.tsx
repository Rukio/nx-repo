import * as Yup from 'yup';
import { Stack, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  useCreateInsurance,
  useUpdateInsurance,
} from '@*company-data-covered*/caremanager/data-access';
import {
  Insurance,
  Patient,
} from '@*company-data-covered*/caremanager/data-access-types';
import { FormikInputField, FormikModal } from '@*company-data-covered*/caremanager/ui';

const PREFIX_TEST_ID = 'edit-insurance';
export const FORM_TEST_ID = `${PREFIX_TEST_ID}-form`;
export const SUBMIT_BUTTON_TEST_ID = `${PREFIX_TEST_ID}-save-button`;

const validationSchema = Yup.object({
  name: Yup.string().required('Payer is required'),
  memberId: Yup.string().required('Member ID is required'),
});

type FormValues = Yup.InferType<typeof validationSchema>;

type Props = {
  patientId?: Patient['id'];
  insurance?: Insurance;
  priorityLabel: string;
  open: boolean;
  onClose: () => void;
};

const styles = makeSxStyles({
  modalContent: { width: { sm: '440px' } },
  modalTitle: { textTransform: 'capitalize' },
});

const InsuranceFormModal: React.FC<Props> = ({
  patientId,
  insurance,
  priorityLabel,
  open,
  onClose,
}) => {
  const { mutateAsync: updateInsurance, isLoading: isUpdateInsuranceLoading } =
    useUpdateInsurance();
  const { mutateAsync: createInsurance, isLoading: isCreateInsuranceLoading } =
    useCreateInsurance();

  const handleSubmit = async (formValues: FormValues) => {
    if (insurance?.id) {
      await updateInsurance({
        insuranceId: insurance.id,
        body: formValues,
      });
    } else if (patientId) {
      await createInsurance({ body: { patientId, ...formValues } });
    }

    onClose();
  };
  const initialValues = {
    name: insurance?.name || '',
    memberId: insurance?.memberId || '',
  };

  return (
    <FormikModal
      title={`${priorityLabel} Insurance`}
      isOpen={open}
      onClose={onClose}
      testIdPrefix={PREFIX_TEST_ID}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      isSubmitting={isUpdateInsuranceLoading || isCreateInsuranceLoading}
      contentSx={styles.modalContent}
      titleSx={styles.modalTitle}
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
            name: 'name',
            label: 'Payer',
          }}
          autoFocus
        />
        <FormikInputField
          fieldData={{
            name: 'memberId',
            label: 'Member ID',
          }}
        />
      </Stack>
    </FormikModal>
  );
};

export default InsuranceFormModal;
