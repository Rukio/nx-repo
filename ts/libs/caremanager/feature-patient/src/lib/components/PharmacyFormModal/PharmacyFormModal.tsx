import * as Yup from 'yup';
import { Stack, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  useCreatePharmacy,
  useUpdatePharmacy,
} from '@*company-data-covered*/caremanager/data-access';
import {
  Patient,
  Pharmacy,
} from '@*company-data-covered*/caremanager/data-access-types';
import { FormikInputField, FormikModal } from '@*company-data-covered*/caremanager/ui';

type Props = {
  open: boolean;
  onClose: () => void;
  pharmacy?: Pharmacy;
  patientId: Patient['id'];
};

const styles = makeSxStyles({
  modalContent: { width: { sm: '578px' } },
});

const PREFIX_TEST_ID = 'edit-pharmacy';
export const FORM_TEST_ID = `${PREFIX_TEST_ID}-form`;
export const SUBMIT_BUTTON_TEST_ID = `${PREFIX_TEST_ID}-save-button`;

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  phoneNumber: Yup.string(),
  address: Yup.string(),
  faxNumber: Yup.string(),
});

type FormValues = Yup.InferType<typeof validationSchema>;

const PharmacyModal: React.FC<Props> = ({
  open,
  onClose,
  pharmacy,
  patientId,
}) => {
  const { mutateAsync: createPharmacy, isLoading: isCreatePharmacyLoading } =
    useCreatePharmacy();
  const { mutateAsync: updatePharmacy, isLoading: isUpdatePharmacyLoading } =
    useUpdatePharmacy();

  const handleSubmit = async (formValues: FormValues) => {
    if (pharmacy?.id) {
      await updatePharmacy({
        pharmacyId: pharmacy.id,
        body: { ...formValues },
      });
    } else if (patientId) {
      await createPharmacy({ body: { ...formValues, patientId } });
    }

    onClose();
  };
  const initialValues = {
    name: pharmacy?.name ?? '',
    phoneNumber: pharmacy?.phoneNumber ?? '',
    address: pharmacy?.address ?? '',
    faxNumber: pharmacy?.faxNumber ?? '',
  };

  return (
    <FormikModal
      title="Pharmacy"
      isOpen={open}
      onClose={onClose}
      testIdPrefix={PREFIX_TEST_ID}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      contentSx={styles.modalContent}
      isSubmitting={isCreatePharmacyLoading || isUpdatePharmacyLoading}
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
            label: 'Name',
          }}
          autoFocus
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <FormikInputField
            fieldData={{
              name: 'phoneNumber',
              label: 'Phone',
            }}
          />
          <FormikInputField
            fieldData={{
              name: 'faxNumber',
              label: 'Fax',
            }}
          />
        </Stack>

        <FormikInputField
          fieldData={{
            name: 'address',
            label: 'Address',
          }}
        />
      </Stack>
    </FormikModal>
  );
};

export default PharmacyModal;
