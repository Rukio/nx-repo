import { FC, ReactNode, useEffect, useState } from 'react';
import {
  Box,
  Button,
  ListItem,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  AdditionalSymptomsConfirmation,
  AdditionalSymptomsConfirmationProps,
} from '../AdditionalSymptomsConfirmation';
import { FormHeader } from '../FormHeader';
import { FormFooter } from '../FormFooter';
import { SYMPTOMS_FORM_TEST_IDS } from './testIds';
import { Control } from 'react-hook-form';
import {
  FormAutocomplete,
  FormTextField,
} from '@*company-data-covered*/shared/ui/forms';

const makeStyles = () =>
  makeSxStyles({
    symptomsInput: { my: 3 },
    symptomsConfirmSection: { mb: 3 },
    customInputButton: {
      mt: {
        xs: 1,
        sm: 3,
      },
    },
  });

export type SymptomsFormFieldValues = {
  symptoms: string;
  isSymptomsConfirmChecked: boolean | undefined;
};

export type SymptomsFormProps = {
  isRelationshipMyself: boolean;
  symptomsOptions: string[];
  isAdditionalSymptomsConfirmDisplayed?: boolean;
  isCustomSymptomsSelected?: boolean;
  unsupportedSymptomsList: AdditionalSymptomsConfirmationProps['symptomsList'];
  isSubmitButtonDisabled?: boolean;
  formControl: Control<SymptomsFormFieldValues>;
  onSubmit: () => void;
  onResetSymptoms: () => void;
};

const SymptomsForm: FC<SymptomsFormProps> = ({
  isRelationshipMyself,
  symptomsOptions,
  isAdditionalSymptomsConfirmDisplayed,
  isCustomSymptomsSelected,
  unsupportedSymptomsList,
  isSubmitButtonDisabled = false,
  formControl,
  onSubmit,
  onResetSymptoms,
}) => {
  const styles = makeStyles();

  const [isCustomSymptomsInputDisplayed, setIsCustomSymptomsInputDisplayed] =
    useState(isCustomSymptomsSelected);

  useEffect(() => {
    setIsCustomSymptomsInputDisplayed(isCustomSymptomsSelected);
  }, [isCustomSymptomsSelected]);

  const toggleCustomSymptomInput = () => {
    setIsCustomSymptomsInputDisplayed((prev) => !prev);
    onResetSymptoms();
  };

  const renderSymptomsSection = () => {
    if (isCustomSymptomsInputDisplayed) {
      return (
        <FormTextField
          name="symptoms"
          control={formControl}
          textFieldProps={{
            placeholder: 'Enter your symptoms here',
            multiline: true,
            rows: 3,
            fullWidth: true,
            sx: styles.symptomsInput,
            'data-testid': SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_FIELD,
            inputProps: {
              'data-testid': SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_INPUT,
            },
          }}
        />
      );
    }

    return (
      <FormAutocomplete<SymptomsFormFieldValues, string>
        name="symptoms"
        control={formControl}
        autocompleteProps={{
          'data-testid': SYMPTOMS_FORM_TEST_IDS.AUTOCOMPLETE_FIELD,
          options: symptomsOptions,
          sx: styles.symptomsInput,
          renderOption: (props, option) => (
            <ListItem
              {...props}
              data-testid={SYMPTOMS_FORM_TEST_IDS.getAutocompleteDropdownOption(
                option
              )}
            >
              {option}
            </ListItem>
          ),
        }}
        textFieldProps={{
          label: 'Enter a symptom',
        }}
      />
    );
  };

  const renderHeaderSubtitle = (): ReactNode => {
    if (isCustomSymptomsInputDisplayed) {
      return (
        <>
          Please enter a short list of the symptoms
          {isRelationshipMyself ? ' you’re ' : ' the patient is '}
          experiencing.
        </>
      );
    }

    return (
      <>
        Please enter {isRelationshipMyself ? 'your ' : 'the patient’s '}
        <b>primary symptom</b> so that we can send out the correct medical team
        for {isRelationshipMyself ? 'you' : 'them'}.
      </>
    );
  };

  const renderAdditionalSymptomsConfirmationSection = () => {
    const alertMessage = `If ${
      isRelationshipMyself ? 'you are' : 'the patient is'
    } experiencing any of the following symptoms, please call 911 or a doctor.`;
    const checkboxLabel = `${
      isRelationshipMyself ? 'I am' : 'The patient is'
    } not experiencing any of these additional symptoms.`;

    return (
      <Box sx={styles.symptomsConfirmSection}>
        <AdditionalSymptomsConfirmation<SymptomsFormFieldValues>
          symptomsList={unsupportedSymptomsList}
          alertMessage={alertMessage}
          checkboxLabel={checkboxLabel}
          formFieldName="isSymptomsConfirmChecked"
          formControl={formControl}
        />
      </Box>
    );
  };

  const renderCustomSymptomButton = () => {
    const buttonText = `${
      isRelationshipMyself ? 'My' : 'Patient’s'
    } symptom isn’t on this list`;

    return (
      <Button
        size="large"
        fullWidth
        variant="text"
        onClick={toggleCustomSymptomInput}
        sx={styles.customInputButton}
        data-testid={SYMPTOMS_FORM_TEST_IDS.CUSTOM_SYMPTOM_INPUT_BUTTON}
      >
        {buttonText}
      </Button>
    );
  };

  return (
    <Box data-testid={SYMPTOMS_FORM_TEST_IDS.ROOT}>
      <FormHeader
        title="What can we help with today?"
        subtitle={renderHeaderSubtitle()}
      />
      {renderSymptomsSection()}
      {isAdditionalSymptomsConfirmDisplayed &&
        renderAdditionalSymptomsConfirmationSection()}
      <FormFooter
        isSubmitButtonDisabled={isSubmitButtonDisabled}
        onSubmit={onSubmit}
      />
      {!isCustomSymptomsInputDisplayed && renderCustomSymptomButton()}
    </Box>
  );
};

export default SymptomsForm;
