import * as Yup from 'yup';
import { Box, Stack, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  useCreateExternalCareProvider,
  useGetProviderTypes,
  useUpdateExternalCareProvider,
} from '@*company-data-covered*/caremanager/data-access';
import {
  ExternalCareProvider,
  Patient,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  FormikInputField,
  FormikModal,
  FormikSelectField,
} from '@*company-data-covered*/caremanager/ui';

const PREFIX_TEST_ID = 'edit-external-care-provider';
export const FORM_TEST_ID = `${PREFIX_TEST_ID}-form`;
export const PROVIDER_TYPE_SELECT_CONTAINER_TEST_ID =
  'provider-type-select-container';
export const SUBMIT_BUTTON_TEST_ID = `${PREFIX_TEST_ID}-save-button`;

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  phoneNumber: Yup.string(),
  faxNumber: Yup.string(),
  address: Yup.string(),
  providerTypeId: Yup.string().required('Provider Type is required'),
});

type FormValues = Yup.InferType<typeof validationSchema>;

type Props = {
  patientId?: Patient['id'];
  externalCareProvider?: ExternalCareProvider;
  open: boolean;
  onClose: () => void;
};
const styles = makeSxStyles({
  modalContent: { width: { sm: '600px' } },
});

const ExternalCareProviderFormModal: React.FC<Props> = ({
  patientId,
  externalCareProvider,
  open,
  onClose,
}) => {
  const [{ data: providerTypesData }] = useGetProviderTypes();

  const { mutateAsync: updateECP, isLoading: isUpdateECPLoading } =
    useUpdateExternalCareProvider();
  const { mutateAsync: createECP, isLoading: isCreateECPLoading } =
    useCreateExternalCareProvider();

  const handleSubmit = async (formValues: FormValues) => {
    if (externalCareProvider?.id) {
      await updateECP({
        externalCareProviderId: externalCareProvider.id,
        body: formValues,
      });
    } else if (patientId) {
      await createECP({ body: { patientId, ...formValues } });
    }
    onClose();
  };
  const initialValues = {
    name: externalCareProvider?.name || '',
    phoneNumber: externalCareProvider?.phoneNumber,
    faxNumber: externalCareProvider?.faxNumber,
    address: externalCareProvider?.address,
    providerTypeId: externalCareProvider?.providerTypeId || '',
  };

  return (
    <FormikModal
      title="External Care Team"
      isOpen={open}
      onClose={onClose}
      testIdPrefix={PREFIX_TEST_ID}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      contentSx={styles.modalContent}
      isSubmitting={isCreateECPLoading || isUpdateECPLoading}
    >
      <Stack
        spacing={3}
        paddingX={3}
        paddingTop={2.5}
        paddingBottom={1}
        direction="column"
      >
        <Box data-testid={PROVIDER_TYPE_SELECT_CONTAINER_TEST_ID}>
          <FormikSelectField
            options={providerTypesData?.providerTypes ?? []}
            label="Provider Type"
            name="providerTypeId"
            fullWidth
          />
        </Box>
        <FormikInputField
          fieldData={{
            name: 'name',
            label: 'Name',
          }}
        />
        <Box display="flex" gap={2}>
          <FormikInputField
            fieldData={{
              name: 'phoneNumber',
              label: 'Phone Number',
            }}
            fullWidth
          />
          <FormikInputField
            fieldData={{
              name: 'faxNumber',
              label: 'Fax Number',
            }}
            fullWidth
          />
        </Box>
        <FormikInputField
          fieldData={{
            name: 'address',
            label: 'Address',
          }}
          fullWidth
        />
      </Stack>
    </FormikModal>
  );
};

export default ExternalCareProviderFormModal;
