import * as Yup from 'yup';
import { Box, Stack, makeSxStyles } from '@*company-data-covered*/design-system';
import { formSexOptions } from '@*company-data-covered*/caremanager/utils';
import {
  useGetPatient,
  useUpdatePatient,
} from '@*company-data-covered*/caremanager/data-access';
import { Patient } from '@*company-data-covered*/caremanager/data-access-types';
import {
  FormikDatePickerField,
  FormikInputField,
  FormikModal,
  FormikSelectField,
} from '@*company-data-covered*/caremanager/ui';

const PREFIX_TEST_ID = 'edit-patient-demographics';
export const FORM_TEST_ID = `${PREFIX_TEST_ID}-form`;
export const SUBMIT_BUTTON_TEST_ID = `${PREFIX_TEST_ID}-save-button`;

const validationSchema = Yup.object({
  firstName: Yup.string().required('First Name is required'),
  middleName: Yup.string(),
  lastName: Yup.string().required('Last Name is required'),
  dateOfBirth: Yup.string().required('Date of Birth is required'),
  sex: Yup.string().required('Sex at Birth is required'),
  athenaMedicalRecordNumber: Yup.string(),
});

type FormValues = Yup.InferType<typeof validationSchema>;

type Props = {
  patientId: Patient['id'];
  open: boolean;
  onClose: () => void;
};
const styles = makeSxStyles({ modalContent: { width: { sm: '440px' } } });

const EditPatientDemographicsModal: React.FC<Props> = ({
  patientId,
  open,
  onClose,
}) => {
  const { data } = useGetPatient(patientId);
  const patient = data?.patient;
  const { mutateAsync: updatePatient, isLoading: isUpdatePatientLoading } =
    useUpdatePatient();

  const handleSubmit = async (formValues: FormValues) => {
    await updatePatient({ patientId, body: { ...formValues } });
    onClose();
  };

  if (!patient) {
    return null;
  }

  const initialValues = {
    firstName: patient.firstName,
    middleName: patient.middleName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    sex: patient.sex.toLowerCase(),
    athenaMedicalRecordNumber: patient.athenaMedicalRecordNumber,
  };

  return (
    <FormikModal
      title="Patient Demographics"
      isOpen={open}
      onClose={onClose}
      testIdPrefix={PREFIX_TEST_ID}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      contentSx={styles.modalContent}
      isSubmitting={isUpdatePatientLoading}
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
            name: 'firstName',
            label: 'First Name',
          }}
          autoFocus
        />
        <FormikInputField
          fieldData={{ name: 'middleName', label: 'Middle Name' }}
        />
        <FormikInputField
          fieldData={{ name: 'lastName', label: 'Last Name' }}
        />
        <FormikDatePickerField
          fieldData={{ name: 'dateOfBirth', label: 'Date of Birth' }}
          dataTestId="date-of-birth"
        />
        <FormikSelectField
          name="sex"
          label="Sex at Birth"
          options={formSexOptions}
        />
        <Box>
          <FormikInputField
            fieldData={{
              name: 'athenaMedicalRecordNumber',
              label: 'Athena ID/MRN',
            }}
          />
        </Box>
      </Stack>
    </FormikModal>
  );
};

export default EditPatientDemographicsModal;
