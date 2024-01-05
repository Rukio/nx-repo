import { ChangeEvent, FC, SyntheticEvent, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Autocomplete,
  Button,
  FormHelperText,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  StatsigEvents,
  StatsigActions,
  StatsigPageCategory,
} from '@*company-data-covered*/consumer-web-types';
import { PageLayout, Message911Variant } from '../components/PageLayout';
import {
  RelationshipToPatient,
  selectRequest,
  setComplaint,
  useAppDispatch,
} from '@*company-data-covered*/consumer-web/web-request/data-access';
import {
  useValidation,
  COMPLAINT_VALIDATION_RULE,
  StatsigLogEvent,
  getSymptomsFromStructuredSymptomsConfig,
} from '../utils';
import { InputField } from '@*company-data-covered*/consumer-web/web-request/ui';
import { REQUEST_HELP_TEST_IDS } from './testIds';
import { useRequestStepper } from '../hooks';

const LOG_EVENT: StatsigLogEvent = {
  eventName: StatsigEvents.REQUEST_SYMPTOMS_EVENT,
  value: StatsigActions.ADDED_SYMPTOMS,
  metadata: {
    page: StatsigPageCategory.REQUEST_HELP,
    origin: window.location.host,
  },
};

const makeStyles = () =>
  makeSxStyles({
    structuredSymptomsInput: {
      mt: 3,
    },
  });

const RequestHelp: FC = () => {
  const dispatch = useAppDispatch();
  const styles = makeStyles();
  const stepData = useRequestStepper();

  const careRequest = useSelector(selectRequest);

  const formValidations = useValidation(
    careRequest.complaint,
    COMPLAINT_VALIDATION_RULE
  );

  const [showCustomSymptomInput, setShowCustomSymptomInput] = useState(false);

  const careForYourSelf = useMemo(
    () =>
      careRequest.caller.relationshipToPatient === RelationshipToPatient.myself,
    [careRequest.caller.relationshipToPatient]
  );

  const symptomsOptions = getSymptomsFromStructuredSymptomsConfig();

  const onSymptomsInputChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value },
    } = ev;
    dispatch(setComplaint({ symptoms: value }));
  };

  const onSymptomsAutocompleteChange = (
    _ev: SyntheticEvent,
    value: string | null
  ) => {
    dispatch(setComplaint({ symptoms: value || '' }));
  };

  const toggleCustomSymptomInput = () => {
    dispatch(setComplaint({ symptoms: '' }));
    setShowCustomSymptomInput((prev) => !prev);
  };

  const isCustomSymptomSelected =
    !!careRequest.complaint.symptoms &&
    !symptomsOptions.includes(careRequest.complaint.symptoms);

  const showCustomInputButton =
    !showCustomSymptomInput && !isCustomSymptomSelected;

  const renderSymptomsSection = () => {
    if (showCustomSymptomInput || isCustomSymptomSelected) {
      return (
        <>
          <InputField
            value={careRequest.complaint.symptoms}
            name="symptoms"
            onChange={onSymptomsInputChange}
            placeholder="Enter your symptoms here"
            multiline
            sx={styles.structuredSymptomsInput}
            rows={3}
            fullWidth
            data-testid={REQUEST_HELP_TEST_IDS.SYMPTOM_REQUEST_FIELD}
            inputProps={{
              'data-testid': REQUEST_HELP_TEST_IDS.SYMPTOM_REQUEST_INPUT,
            }}
          />
          <FormHelperText
            sx={{ mt: 1, fontSize: 14 }}
            data-testid={
              REQUEST_HELP_TEST_IDS.SYMPTOM_REQUEST_INPUT_PLACEHOLDER
            }
          >
            Separate symptoms by commas (i.e., &quot;fever, cough, chills&quot;)
          </FormHelperText>
        </>
      );
    }

    return (
      <Autocomplete
        data-testid={REQUEST_HELP_TEST_IDS.SYMPTOM_REQUEST_AUTOCOMPLETE}
        options={symptomsOptions}
        onChange={onSymptomsAutocompleteChange}
        value={careRequest.complaint.symptoms}
        renderInput={(params) => (
          <InputField
            {...params}
            label="Enter a symptom"
            sx={styles.structuredSymptomsInput}
          />
        )}
        renderOption={(props, option) => (
          <li
            {...props}
            data-testid={REQUEST_HELP_TEST_IDS.getSymptomRequestAutocompleteDropdownOption(
              option
            )}
          >
            {option}
          </li>
        )}
      />
    );
  };

  const renderCustomInputButton = () => {
    if (!showCustomInputButton) {
      return null;
    }

    return (
      <Button
        sx={{ mt: 3 }}
        size="large"
        fullWidth
        variant="text"
        onClick={toggleCustomSymptomInput}
        data-testid={REQUEST_HELP_TEST_IDS.CUSTOM_SYMPTOM_INPUT_BTN}
      >
        My symptom isn’t on this list
      </Button>
    );
  };

  const formattedPatientFirstName = careRequest.patient.firstName
    ? `${careRequest.patient.firstName} `
    : '';

  return (
    <PageLayout
      continueOptions={{
        showBtn: true,
        logEventData: LOG_EVENT,
        disabled: !formValidations.isValidForm,
        dataTestId: REQUEST_HELP_TEST_IDS.SUBMIT_BUTTON,
      }}
      titleOptions={{
        text:
          careForYourSelf && stepData.previousStepExists
            ? 'What can we help you with today?'
            : `What can we help ${formattedPatientFirstName}with today?`,
        dataTestId: REQUEST_HELP_TEST_IDS.REQUESTING_HELP_HEADER,
      }}
      message911Variant={Message911Variant.Bottom}
      footer={renderCustomInputButton()}
    >
      <>
        <FormHelperText
          sx={{ mt: 3, fontSize: 14 }}
          data-testid={REQUEST_HELP_TEST_IDS.QUESTION_HEADER}
        >
          Please enter the primary reason for your care visit today.
        </FormHelperText>
        {renderSymptomsSection()}
      </>
    </PageLayout>
  );
};

export default RequestHelp;
