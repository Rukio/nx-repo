import {
  Alert,
  Box,
  List,
  ListItem,
  Typography,
  alertClasses,
  makeSxStyles,
  colorManipulator,
} from '@*company-data-covered*/design-system';
import { ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS } from './testIds';
import { Control, FieldValues, Path } from 'react-hook-form';
import { FormCheckbox } from '@*company-data-covered*/shared/ui/forms';

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      border: `1px solid ${theme.palette.info.main}`,
      borderRadius: 1,
      overflow: 'hidden',
    }),
    alert: (theme) => ({
      p: theme.spacing(1, 2),
      backgroundColor: colorManipulator.lighten(theme.palette.info.main, 0.9),
      [`& .${alertClasses.icon}`]: {
        display: 'flex',
        alignItems: 'center',
      },
    }),
    alertIcon: {
      display: 'flex',
      alignItems: 'center',
    },
    symptomsList: { mt: 2, p: 0, pl: 4 },
    symptomsListItem: (theme) => ({
      display: 'list-item',
      listStyle: 'outside',
      ml: 1,
      p: 0,
      color: theme.palette.text.secondary,
    }),
    checkboxFormControl: { m: 2 },
  });

export type AdditionalSymptomsConfirmationProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  symptomsList: string[];
  alertMessage: string;
  checkboxLabel: string;
  formFieldName: Path<TFieldValues>;
  formControl: Control<TFieldValues>;
};

const AdditionalSymptomsConfirmation = <TFieldValues extends FieldValues>({
  symptomsList,
  alertMessage,
  checkboxLabel,
  formFieldName,
  formControl,
}: AdditionalSymptomsConfirmationProps<TFieldValues>) => {
  const styles = makeStyles();

  return (
    <Box
      sx={styles.root}
      data-testid={ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.ROOT}
    >
      <Alert
        severity="info"
        message={alertMessage}
        variant="outlined"
        square
        sx={styles.alert}
        data-testid={ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.TITLE}
      />
      {symptomsList.length && (
        <List
          sx={styles.symptomsList}
          data-testid={ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.LIST}
        >
          {symptomsList.map((symptom) => (
            <ListItem
              key={symptom}
              sx={styles.symptomsListItem}
              data-testid={ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.getListItem(
                symptom
              )}
            >
              <Typography>{symptom}</Typography>
            </ListItem>
          ))}
        </List>
      )}
      <FormCheckbox
        name={formFieldName}
        control={formControl}
        formControlLabelProps={{
          label: checkboxLabel,
          sx: styles.checkboxFormControl,
          'data-testid':
            ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FORM_CONTROL,
        }}
        checkboxProps={{
          'data-testid':
            ADDITIONAL_SYMPTOMS_CONFIRMATION_TEST_IDS.CHECKBOX_FIELD,
        }}
      />
    </Box>
  );
};

export default AdditionalSymptomsConfirmation;
