import { ChangeEvent, FC } from 'react';
import { useSelector } from 'react-redux';
import {
  Typography,
  FormControl,
  FormLabel,
  Grid,
} from '@*company-data-covered*/design-system';
import {
  StatsigEvents,
  StatsigActions,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import {
  selectCaller,
  setCaller,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import { useRequestStepper } from '../hooks';
import {
  useValidation,
  transformValueFromPhone,
  phoneNumberWithoutCountry,
  CALLER_VALIDATION_RULE,
  StatsigLogEvent,
} from '../utils';
import { REQUEST_CONTACT_INFO_TEST_IDS } from './testIds';
import { PageLayout } from '../components/PageLayout';
import {
  InputField,
  PhoneNumberInput,
} from '@*company-data-covered*/consumer-web/web-request/ui';

const LOG_EVENT: StatsigLogEvent = {
  eventName: StatsigEvents.REQUEST_CONTACT_INFO_EVENT,
  value: StatsigActions.ADDED_CONTACT_INFO,
  metadata: {
    page: StatsigPageCategory.REQUEST_CONTACT_INFO,
    origin: window.location.host,
  },
};

const RequestContactInfo: FC = () => {
  const dispatch = useAppDispatch();
  const stepData = useRequestStepper();

  const caller = useSelector(selectCaller);

  const formValidationRules = {
    ...CALLER_VALIDATION_RULE,
    relationshipToPatient: '',
  };
  const formValidations = useValidation(caller, formValidationRules);

  const onInputChange = (
    ev: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const {
      target: { value, name },
    } = ev;
    dispatch(setCaller({ [name]: value }));
  };

  const onPhoneNumberChange = (
    ev: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    dispatch(setCaller({ phone: transformValueFromPhone(ev.target.value) }));
  };

  return (
    <PageLayout
      titleOptions={{
        text: stepData.previousStepExists
          ? 'Sorry to hear you’re not feeling well.'
          : 'Let’s get you the care you need',
        dataTestId: REQUEST_CONTACT_INFO_TEST_IDS.HEADER,
      }}
      continueOptions={{
        disabled: !formValidations.isValidForm,
        showBtn: true,
        logEventData: LOG_EVENT,
        dataTestId: REQUEST_CONTACT_INFO_TEST_IDS.CONTINUE_BUTTON,
      }}
    >
      <>
        {stepData.previousStepExists && (
          <Typography
            variant="body1"
            sx={{ mt: 4 }}
            data-testid={
              REQUEST_CONTACT_INFO_TEST_IDS.CONTACT_MORE_INFO_MESSAGE
            }
          >
            We just need a few bits of information before dispatching a care
            team.
          </Typography>
        )}
        <Typography
          variant={stepData.previousStepExists ? 'body1' : 'h6'}
          sx={{ mt: 4 }}
          data-testid={REQUEST_CONTACT_INFO_TEST_IDS.QUESTION_HEADER}
        >
          {stepData.previousStepExists
            ? 'How can we reach you?'
            : 'First, how can we reach you?'}
        </Typography>
        <FormControl fullWidth sx={{ mt: 4, mb: 3 }}>
          <FormLabel
            data-testid={REQUEST_CONTACT_INFO_TEST_IDS.FULL_NAME_LABEL}
            sx={{ mb: 2 }}
          >
            Full Name
          </FormLabel>
          <Grid container sx={{ mt: 2 }} spacing={{ xs: 1, md: 2 }}>
            <Grid item xs={12} md={6}>
              <InputField
                label="First Name"
                name="firstName"
                onChange={onInputChange}
                error={
                  formValidations.fields.firstName.isTouched &&
                  !formValidations.fields.firstName.isValid
                }
                helperText={
                  formValidations.fields.firstName.isTouched &&
                  formValidations.fields.firstName.error
                }
                fullWidth
                value={caller.firstName}
                data-testid={
                  REQUEST_CONTACT_INFO_TEST_IDS.CALLER_FIRST_NAME_FIELD
                }
                inputProps={{
                  'data-testid':
                    REQUEST_CONTACT_INFO_TEST_IDS.CALLER_FIRST_NAME_INPUT,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <InputField
                label="Last Name"
                name="lastName"
                onChange={onInputChange}
                error={
                  formValidations.fields.lastName.isTouched &&
                  !formValidations.fields.lastName.isValid
                }
                helperText={
                  formValidations.fields.lastName.isTouched &&
                  formValidations.fields.lastName.error
                }
                fullWidth
                value={caller.lastName}
                data-testid={
                  REQUEST_CONTACT_INFO_TEST_IDS.CALLER_LAST_NAME_FIELD
                }
                inputProps={{
                  'data-testid':
                    REQUEST_CONTACT_INFO_TEST_IDS.CALLER_LAST_NAME_INPUT,
                }}
              />
            </Grid>
          </Grid>
        </FormControl>
        <PhoneNumberInput
          value={phoneNumberWithoutCountry(caller.phone)}
          onChangeField={onPhoneNumberChange}
          inputTestIdPrefix={
            REQUEST_CONTACT_INFO_TEST_IDS.CALLER_PHONE_NUMBER_INPUT
          }
          error={
            formValidations.fields.phone.isTouched &&
            !formValidations.fields.phone.isValid
          }
          helperText={
            formValidations.fields.phone.isTouched &&
            formValidations.fields.phone.error
          }
        />
      </>
    </PageLayout>
  );
};

export default RequestContactInfo;
