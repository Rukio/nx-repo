import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { object, string, ObjectSchema } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CreatePatientForm as CreatePatientFormUI,
  CreatePatientFormFields,
  ASSIGNED_SEX_OPTIONS,
  GENDER_IDENTITY_OPTIONS,
  PageSection,
} from '@*company-data-covered*/patient-portal/ui';
import { CREATE_PATIENT_FORM_TEST_IDS } from './testIds';
import { NAVIGATION_TO_SETTINGS_PARAMS } from '../../constants';

export const validationSchema: ObjectSchema<CreatePatientFormFields> =
  object().shape({
    firstName: string().required('First name is required'),
    lastName: string().required('Last name is required'),
    dateOfBirth: string().required('Date of birth is required'),
    phoneNumber: string().required('Phone number is required'),
    assignedSexAtBirth: string()
      .oneOf(ASSIGNED_SEX_OPTIONS.map((option) => option.value))
      .required('Assigned Sex is required'),
    genderIdentity: string()
      .optional()
      .oneOf([...GENDER_IDENTITY_OPTIONS.map((option) => option.value), ''])
      .default(''),
  });

const CreatePatientForm: FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState } = useForm<CreatePatientFormFields>(
    {
      defaultValues: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phoneNumber: '',
        assignedSexAtBirth: '',
        genderIdentity: '',
      },
      mode: 'onBlur',
      resolver: yupResolver(validationSchema),
    }
  );

  const onSubmit = (data: CreatePatientFormFields) => {
    //TODO(PT-1619): this is temporary, will be removed after data-access is implemented
    console.info(data);
    navigate('/');
  };

  return (
    <PageSection
      testIdPrefix={CREATE_PATIENT_FORM_TEST_IDS.TITLE}
      title="Create Patient"
      backButtonOptions={NAVIGATION_TO_SETTINGS_PARAMS}
    >
      <CreatePatientFormUI
        control={control}
        isSubmitButtonDisabled={!formState.isValid}
        handleSubmit={handleSubmit(onSubmit)}
      />
    </PageSection>
  );
};

export default CreatePatientForm;
