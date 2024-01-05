import { FC, ReactNode } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  Link,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FormHeader } from '../FormHeader';
import { FormFooter } from '../FormFooter';
import { CONFIRM_DETAILS_FORM_TEST_IDS } from './testIds';
import { Control } from 'react-hook-form';
import { FormCheckbox } from '@*company-data-covered*/shared/ui/forms';
import {
  DatadogPrivacyOption,
  getDataDogPrivacyHTMLAttributes,
} from '@*company-data-covered*/shared/datadog/util';

export type Details = { label: string; value: string };

export enum DetailsSection {
  AboutYou = 'aboutYou',
  AboutPatient = 'aboutPatient',
  PrimaryInsurance = 'primaryInsurance',
  SecondaryInsurance = 'secondaryInsurance',
  Appointment = 'appointment',
}

export type ConfirmDetailsFormFieldValues = {
  isConsented: boolean;
};

export type ConfirmDetailsFormProps = {
  formHeaderSubtitle: string;
  aboutYouDetails: Details[];
  aboutPatientDetails?: Details[];
  primaryInsuranceDetails?: Details[];
  secondaryInsuranceDetails?: Details[];
  appointmentDetails: Details[];
  isEditingEnabled?: boolean;
  onEditDetails?: (detailsSection: DetailsSection) => void;
  isSubmitButtonDisabled?: boolean;
  isSubmitButtonLoading?: boolean;
  onSubmit: () => void;
  formControl: Control<ConfirmDetailsFormFieldValues>;
};

const makeStyles = () =>
  makeSxStyles({
    formContentIndents: { mt: 3 },
    dividerTop: (theme) => ({
      borderTop: {
        xs: `1px solid ${theme.palette.grey[100]}`,
        sm: 'none',
      },
      pt: {
        xs: 3,
        sm: 0,
      },
    }),
    dividerBottom: (theme) => ({
      borderBottom: {
        xs: `1px solid ${theme.palette.grey[100]}`,
        sm: 'none',
      },
      pb: {
        xs: 3,
        sm: 0,
      },
      mb: 3,
    }),
    detailsTitle: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailsItem: { my: 0.5, display: 'flex', overflowWrap: 'anywhere' },
    detailsItemLabel: (theme) => ({
      color: theme.palette.text.secondary,
      width: 120,
    }),
    detailsItemValue: { ml: 2 },
    confirmDetailsCheckboxWrapper: { mb: 3 },
    confirmDetailsList: (theme) => ({
      p: theme.spacing(0, 1, 0, 5),
    }),
    confirmDetailsListItem: (theme) => ({
      display: 'list-item',
      listStyle: 'outside',
      ml: 1,
      p: 0,
      color: theme.palette.text.secondary,
      fontSize: theme.typography.body2.fontSize,
    }),
  });

const isDetailsNotEmpty = (details?: Details[] | null): details is Details[] =>
  !!details?.length;

export const ConfirmDetailsForm: FC<ConfirmDetailsFormProps> = ({
  formHeaderSubtitle,
  aboutYouDetails,
  aboutPatientDetails,
  primaryInsuranceDetails,
  secondaryInsuranceDetails,
  appointmentDetails,
  isEditingEnabled,
  onEditDetails,
  isSubmitButtonDisabled = false,
  isSubmitButtonLoading = false,
  onSubmit,
  formControl,
}) => {
  const styles = makeStyles();

  const renderDetailsSectionHeader = ({
    section,
    title,
    isEditingEnabled,
  }: {
    section: DetailsSection;
    title: string;
    isEditingEnabled: ConfirmDetailsFormProps['isEditingEnabled'];
  }): ReactNode => (
    <Box sx={styles.detailsTitle}>
      <Typography variant="h6">{title}</Typography>
      {isEditingEnabled && (
        <Button
          onClick={() => onEditDetails?.(section)}
          data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsItemEditButton(
            section
          )}
        >
          Edit
        </Button>
      )}
    </Box>
  );

  const renderDetailsSection = (
    section: DetailsSection,
    details: Details[]
  ): ReactNode => (
    <Box>
      {details.map((item) => (
        <Box key={`${section}-${item.label}`} sx={styles.detailsItem}>
          <Box>
            <Typography
              variant="body2"
              sx={styles.detailsItemLabel}
              data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsItemLabel(
                section,
                item.label
              )}
            >
              {item.label}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="body2"
              sx={styles.detailsItemValue}
              data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsItemValue(
                section,
                item.value
              )}
              {...getDataDogPrivacyHTMLAttributes(DatadogPrivacyOption.Mask)}
            >
              {item.value}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.ROOT}>
      <FormHeader
        title="Confirm appointment details"
        subtitle={formHeaderSubtitle}
      />
      <Box
        sx={[styles.formContentIndents, styles.dividerTop]}
        data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
          DetailsSection.AboutYou
        )}
      >
        {renderDetailsSectionHeader({
          section: DetailsSection.AboutYou,
          title: 'About You',
          isEditingEnabled,
        })}
        {renderDetailsSection(DetailsSection.AboutYou, aboutYouDetails)}
      </Box>
      {isDetailsNotEmpty(aboutPatientDetails) && (
        <Box
          sx={styles.formContentIndents}
          data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
            DetailsSection.AboutPatient
          )}
        >
          {renderDetailsSectionHeader({
            section: DetailsSection.AboutPatient,
            title: 'About the Patient',
            isEditingEnabled,
          })}
          {renderDetailsSection(
            DetailsSection.AboutPatient,
            aboutPatientDetails
          )}
        </Box>
      )}
      {isDetailsNotEmpty(primaryInsuranceDetails) && (
        <Box
          sx={styles.formContentIndents}
          data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
            DetailsSection.PrimaryInsurance
          )}
        >
          {renderDetailsSectionHeader({
            section: DetailsSection.PrimaryInsurance,
            title: 'Primary Insurance',
            isEditingEnabled,
          })}
          {renderDetailsSection(
            DetailsSection.PrimaryInsurance,
            primaryInsuranceDetails
          )}
        </Box>
      )}
      {isDetailsNotEmpty(secondaryInsuranceDetails) && (
        <Box
          sx={styles.formContentIndents}
          data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
            DetailsSection.SecondaryInsurance
          )}
        >
          {renderDetailsSectionHeader({
            section: DetailsSection.SecondaryInsurance,
            title: 'Secondary Insurance',
            isEditingEnabled,
          })}
          {renderDetailsSection(
            DetailsSection.SecondaryInsurance,
            secondaryInsuranceDetails
          )}
        </Box>
      )}
      <Box
        sx={[styles.formContentIndents, styles.dividerBottom]}
        data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.getDetailsSection(
          DetailsSection.Appointment
        )}
      >
        {renderDetailsSectionHeader({
          section: DetailsSection.Appointment,
          title: 'Appointment Details',
          isEditingEnabled,
        })}
        {renderDetailsSection(DetailsSection.Appointment, appointmentDetails)}
      </Box>
      <Box
        sx={styles.confirmDetailsCheckboxWrapper}
        data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.CONFIRM_SECTION}
      >
        <FormCheckbox
          name="isConsented"
          control={formControl}
          formControlLabelProps={{
            label: 'By checking this box, you confirm:',
            'data-testid': CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_CONTROL_LABEL,
          }}
          checkboxProps={{
            'data-testid': CONFIRM_DETAILS_FORM_TEST_IDS.CHECKBOX_INPUT,
          }}
        />
        <List
          sx={styles.confirmDetailsList}
          data-testid={CONFIRM_DETAILS_FORM_TEST_IDS.LIST}
        >
          <ListItem sx={styles.confirmDetailsListItem}>
            <Typography variant="body2">You are over the age of 21</Typography>
          </ListItem>
          <ListItem sx={styles.confirmDetailsListItem}>
            <Typography variant="body2">
              You agree to *company-data-covered*'s{' '}
              <Link
                href="https://www.*company-data-covered*.com/privacy-policy/"
                color="inherit"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href="https://www.*company-data-covered*.com/terms-of-service/"
                color="inherit"
              >
                Terms of Service
              </Link>
            </Typography>
          </ListItem>
          <ListItem sx={styles.confirmDetailsListItem}>
            <Typography variant="body2">
              You agree to receive automated SMS notifications and phone
              calls/voicemails about the appointment at the phone numbers
              provided
            </Typography>
          </ListItem>
        </List>
      </Box>
      <FormFooter
        isSubmitButtonDisabled={isSubmitButtonDisabled}
        isSubmitButtonLoading={isSubmitButtonLoading}
        submitButtonLabel="Book Appointment"
        onSubmit={onSubmit}
      />
    </Box>
  );
};
