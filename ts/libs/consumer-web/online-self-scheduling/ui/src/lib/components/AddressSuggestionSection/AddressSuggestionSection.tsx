import { FC } from 'react';
import {
  Box,
  Button,
  LoadingButton,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { ADDRESS_SUGGESTION_SECTION_TEST_IDS } from './testIds';
import {
  DatadogPrivacyOption,
  getDataDogPrivacyHTMLAttributes,
} from '@*company-data-covered*/shared/datadog/util';

export type AddressSuggestionSectionProps = {
  isAutocorrectedResponseButtonLoading: boolean;
  validatedAddress: string;
  onClickValidatedAddress: () => void;
  enteredAddress: string;
  onClickEnteredAddress: () => void;
};

const makeStyles = () =>
  makeSxStyles({
    marginTop: { mt: 3 },
    enteredAddressWrapper: { mt: 4.5 },
    label: (theme) => ({
      display: 'block',
      mb: 1.5,
      color: theme.palette.text.secondary,
    }),
  });

export const AddressSuggestionSection: FC<AddressSuggestionSectionProps> = ({
  isAutocorrectedResponseButtonLoading,
  validatedAddress,
  onClickValidatedAddress,
  enteredAddress,
  onClickEnteredAddress,
}) => {
  const styles = makeStyles();

  return (
    <Box data-testid={ADDRESS_SUGGESTION_SECTION_TEST_IDS.ROOT}>
      <Typography
        variant="h4"
        data-testid={ADDRESS_SUGGESTION_SECTION_TEST_IDS.TITLE}
      >
        Verify your address
      </Typography>
      <Typography
        sx={styles.marginTop}
        data-testid={ADDRESS_SUGGESTION_SECTION_TEST_IDS.SUBTITLE}
      >
        We found a validated address based on the information you entered. Is
        this correct?
      </Typography>
      <Box sx={styles.marginTop}>
        <Typography
          variant="caption"
          sx={styles.label}
          data-testid={
            ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_LABEL
          }
        >
          Validated address
        </Typography>
        <Typography
          data-testid={
            ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_TEXT
          }
          {...getDataDogPrivacyHTMLAttributes(DatadogPrivacyOption.Mask)}
        >
          {validatedAddress}
        </Typography>
        <LoadingButton
          fullWidth
          variant="contained"
          size="extraLarge"
          sx={styles.marginTop}
          loading={isAutocorrectedResponseButtonLoading}
          onClick={onClickValidatedAddress}
          data-testid={
            ADDRESS_SUGGESTION_SECTION_TEST_IDS.VALIDATED_ADDRESS_BUTTON
          }
        >
          Use Autocorrected Response
        </LoadingButton>
      </Box>
      <Box sx={styles.enteredAddressWrapper}>
        <Typography
          variant="caption"
          sx={styles.label}
          data-testid={
            ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_LABEL
          }
        >
          You entered
        </Typography>
        <Typography
          data-testid={ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_TEXT}
          {...getDataDogPrivacyHTMLAttributes(DatadogPrivacyOption.Mask)}
        >
          {enteredAddress}
        </Typography>
        <Button
          fullWidth
          variant="outlined"
          size="extraLarge"
          sx={styles.marginTop}
          onClick={onClickEnteredAddress}
          data-testid={
            ADDRESS_SUGGESTION_SECTION_TEST_IDS.ENTERED_ADDRESS_BUTTON
          }
          disabled={isAutocorrectedResponseButtonLoading}
        >
          Edit Address
        </Button>
      </Box>
    </Box>
  );
};
