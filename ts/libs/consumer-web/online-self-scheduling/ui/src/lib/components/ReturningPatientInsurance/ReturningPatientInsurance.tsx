import { FC } from 'react';
import {
  Button,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { RETURNING_PATIENT_INSURANCE_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    marginTop: { mt: 3 },
    secondaryButton: { mt: 2 },
  });

export type ReturningPatientInsuranceProps = {
  returningPatientInsuranceTitle: string;
  onClickInsuranceIsSameButton: () => void;
  onClickInsuranceHasChangedButton: () => void;
};

export const ReturningPatientInsurance: FC<ReturningPatientInsuranceProps> = ({
  returningPatientInsuranceTitle,
  onClickInsuranceIsSameButton,
  onClickInsuranceHasChangedButton,
}) => {
  const styles = makeStyles();

  return (
    <>
      <Typography
        variant="h4"
        data-testid={RETURNING_PATIENT_INSURANCE_TEST_IDS.TITLE}
      >
        {returningPatientInsuranceTitle}
      </Typography>
      <Typography
        sx={styles.marginTop}
        data-testid={RETURNING_PATIENT_INSURANCE_TEST_IDS.SUBTITLE}
      >
        Is the insurance we have on file for you correct?
      </Typography>
      <Button
        variant="contained"
        size="extraLarge"
        fullWidth
        sx={styles.marginTop}
        onClick={onClickInsuranceIsSameButton}
        data-testid={
          RETURNING_PATIENT_INSURANCE_TEST_IDS.INSURANCE_IS_SAME_BUTTON
        }
      >
        Yes, my insurance is the same
      </Button>
      <Button
        variant="outlined"
        size="extraLarge"
        fullWidth
        sx={styles.secondaryButton}
        onClick={onClickInsuranceHasChangedButton}
        data-testid={
          RETURNING_PATIENT_INSURANCE_TEST_IDS.INSURANCE_HAS_CHANGED_BUTTON
        }
      >
        No, my insurance has changed
      </Button>
    </>
  );
};
