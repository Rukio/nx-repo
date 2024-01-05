import * as Yup from 'yup';
import { Grid, Stack, makeSxStyles } from '@*company-data-covered*/design-system';
import { usStatesAbbreviations } from '@*company-data-covered*/caremanager/utils';
import {
  useGetPatient,
  useUpdatePatient,
} from '@*company-data-covered*/caremanager/data-access';
import {
  FormikInputField,
  FormikModal,
  FormikSelectField,
} from '@*company-data-covered*/caremanager/ui';

const PREFIX_TEST_ID = 'edit-patient';
export const testIds = {
  CANCEL_BUTTON: `${PREFIX_TEST_ID}-cancel-button`,
  SAVE_BUTTON: `${PREFIX_TEST_ID}-save-button`,
};

const validationSchema = Yup.object({
  addressStreet: Yup.string().required('Required'),
  addressStreet2: Yup.string(),
  addressCity: Yup.string().required('Required'),
  addressState: Yup.string().required('Required'),
  addressZipcode: Yup.string().required('Required'),
  phoneNumber: Yup.string().required('Required'),
  addressNotes: Yup.string(),
});

type EditPatientContactInformationFormSchema = Yup.InferType<
  typeof validationSchema
>;

interface EditPatientContactInformationModalProps {
  onClose: () => void;
  open: boolean;
  patientId: string;
}
const styles = makeSxStyles({
  modalContent: { width: { sm: '440px', lg: '900px' } },
});

const EditPatientContactInformationModal: React.FC<
  EditPatientContactInformationModalProps
> = ({ onClose, open, patientId }) => {
  const { data: patientResponse, isLoading } = useGetPatient(patientId);
  const { mutateAsync: updatePatient, isLoading: isUpdatingPatient } =
    useUpdatePatient();

  if (isLoading) {
    return null;
  }

  const patient = patientResponse?.patient;

  const initialValues: EditPatientContactInformationFormSchema = {
    addressStreet: patient?.addressStreet ?? '',
    addressStreet2: patient?.addressStreet2,
    addressCity: patient?.addressCity ?? '',
    addressState: patient?.addressState ?? '',
    addressZipcode: patient?.addressZipcode ?? '',
    phoneNumber: patient?.phoneNumber ?? '',
    addressNotes: patient?.addressNotes ?? '',
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (
    values: EditPatientContactInformationFormSchema
  ) => {
    await updatePatient({
      patientId: patientId,
      body: {
        firstName: patient?.firstName ?? '',
        lastName: patient?.lastName ?? '',
        dateOfBirth: patient?.dateOfBirth ?? '',
        sex: patient?.sex ?? '',
        ...values,
      },
    });

    handleClose();
  };

  return (
    <FormikModal
      title="Patient Contact Information"
      isOpen={open}
      onClose={handleClose}
      testIdPrefix={PREFIX_TEST_ID}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      contentSx={styles.modalContent}
      isSubmitting={isUpdatingPatient}
    >
      <Stack
        rowGap={3}
        paddingX={3}
        paddingTop={2.5}
        paddingBottom={1}
        direction="column"
      >
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <FormikInputField
              fieldData={{
                label: 'Street Address',
                name: 'addressStreet',
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <FormikInputField
              fieldData={{
                label: 'Unit/Int (Optional)',
                name: 'addressStreet2',
              }}
              fullWidth
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormikInputField
              fieldData={{
                label: 'City',
                name: 'addressCity',
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <FormikSelectField
              fullWidth
              label="State"
              name="addressState"
              options={usStatesAbbreviations.map((state) => ({
                id: state,
                name: state,
              }))}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormikInputField
              fieldData={{
                label: 'ZIP Code',
                name: 'addressZipcode',
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <FormikInputField
              fieldData={{
                label: 'Phone Number',
                name: 'phoneNumber',
              }}
              fullWidth
            />
          </Grid>
        </Grid>
        <FormikInputField
          fieldData={{
            label: 'Note (Optional)',
            name: 'addressNotes',
          }}
          fullWidth
        />
      </Stack>
    </FormikModal>
  );
};

export default EditPatientContactInformationModal;
