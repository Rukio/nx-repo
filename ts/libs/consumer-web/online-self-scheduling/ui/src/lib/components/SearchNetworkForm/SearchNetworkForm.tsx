import { FC } from 'react';
import {
  Box,
  makeSxStyles,
  FormControl,
  InputLabel,
  Typography,
  Button,
  CloseIcon,
  Alert,
  AddIcon,
  inputBaseClasses,
  colorManipulator,
  AlertProps,
  LoadingButton,
  Grid,
  ImageUploadStatus,
  ImageUploadStatusState,
} from '@*company-data-covered*/design-system';
import { FormFooter } from '../FormFooter';
import { SEARCH_NETWORK_FORM_TEST_IDS } from './testIds';
import {
  FormSelect,
  FormTextField,
  getFormSelectMenuItems,
} from '@*company-data-covered*/shared/ui/forms';
import { Control } from 'react-hook-form';
import { InsuranceProviderOption } from '../SelectInsuranceProviderModal';

export type NetworkOption = {
  label: string;
  value: string;
};

export type SearchNetworkFormFieldValues = {
  payer: InsuranceProviderOption;
  networkId: string;
  memberId: string;
};

export type SearchNetworkFormProps = {
  networkOptions: NetworkOption[];
  alert?: AlertProps;
  formControl: Control<SearchNetworkFormFieldValues>;
  isRemoveInsurancePayerButtonVisible: boolean;
  isVerifyInsuranceButtonDisabled: boolean;
  isAddAnotherInsuranceDisabled: boolean;
  isAddAnotherInsuranceButtonVisible: boolean;
  searchNetworkFormTitle: string;
  isLoading?: boolean;
  isNetworkSelectVisible: boolean;
  isVerifyInsuranceButtonVisible: boolean;
  isContinueButtonVisible: boolean;
  verifyInsuranceButtonLabel: string;
  submitButtonLabel: string;
  isInsuranceIneligible: boolean;
  insuranceCardBackUrl?: string;
  insuranceCardFrontUrl?: string;
  isUserShouldTakeInsurancePhotos: boolean;
  cardFrontUploadStatus: ImageUploadStatusState;
  cardBackUploadStatus: ImageUploadStatusState;
  onVerifyInsurance: () => void;
  onAddAnotherInsuranceButton: () => void;
  onRemoveSelectedInsuranceProvider: () => void;
  onClickSelectedInsuranceProvider: () => void;
  onContinueToConfirmDetailsClick: () => void;
};

const makeStyles = () =>
  makeSxStyles({
    selectedInsurance: (theme) => ({
      pt: 1,
      [`& .${inputBaseClasses.root}`]: {
        backgroundColor: colorManipulator.alpha(
          theme.palette.primary.main,
          0.04
        ),
      },
      [`& .${inputBaseClasses.input}`]: {
        cursor: 'pointer',
      },
    }),
    removeSelectedInsuranceIcon: {
      cursor: 'pointer',
    },
    selectTitle: {
      pt: 3,
      fontWeight: 600,
    },
    select: {
      mt: 2,
    },
    alert: {
      pb: 3,
      mb: 3,
    },
    enterMemberId: {
      mt: 3,
      pb: 3,
    },
    addAnotherInsurance: {
      width: '100%',
      my: 3,
    },
    verifyInsuranceButton: {
      mb: 3,
    },
    imagesWrapper: {
      mt: 3,
      justifyContent: 'space-evenly',
      columnGap: 1,
    },
    imageHeader: {
      mb: 2,
    },
  });

export const SearchNetworkForm: FC<SearchNetworkFormProps> = ({
  isVerifyInsuranceButtonDisabled,
  alert,
  networkOptions,
  isRemoveInsurancePayerButtonVisible,
  isAddAnotherInsuranceDisabled,
  isAddAnotherInsuranceButtonVisible,
  searchNetworkFormTitle,
  formControl,
  isLoading,
  isNetworkSelectVisible,
  isVerifyInsuranceButtonVisible,
  isContinueButtonVisible,
  verifyInsuranceButtonLabel,
  isInsuranceIneligible,
  insuranceCardFrontUrl,
  insuranceCardBackUrl,
  isUserShouldTakeInsurancePhotos,
  cardFrontUploadStatus,
  cardBackUploadStatus,
  submitButtonLabel,
  onVerifyInsurance,
  onAddAnotherInsuranceButton,
  onRemoveSelectedInsuranceProvider,
  onClickSelectedInsuranceProvider,
  onContinueToConfirmDetailsClick,
}) => {
  const styles = makeStyles();

  return (
    <Box data-testid={SEARCH_NETWORK_FORM_TEST_IDS.CONTAINER}>
      <Typography variant="overline">SELECTED INSURANCE PROVIDER</Typography>
      <FormTextField
        name="payer.label"
        control={formControl}
        textFieldProps={{
          sx: styles.selectedInsurance,
          fullWidth: true,
          inputProps: {
            onClick: onClickSelectedInsuranceProvider,
            'data-testid': SEARCH_NETWORK_FORM_TEST_IDS.SELECTED_PROVIDER_INPUT,
          },
          InputProps: {
            readOnly: true,
            endAdornment: isRemoveInsurancePayerButtonVisible && (
              <CloseIcon
                data-testid={
                  SEARCH_NETWORK_FORM_TEST_IDS.REMOVE_SELECTED_INSURANCE_PROVIDER_ICON
                }
                onClick={onRemoveSelectedInsuranceProvider}
                sx={styles.removeSelectedInsuranceIcon}
              />
            ),
          },
        }}
      />
      {isNetworkSelectVisible && (
        <>
          <Typography variant="body1" sx={styles.selectTitle}>
            {searchNetworkFormTitle}
          </Typography>
          <FormControl fullWidth sx={styles.select}>
            <InputLabel>Select Network</InputLabel>
            <FormSelect
              control={formControl}
              name="networkId"
              selectProps={{
                fullWidth: true,
                label: 'Select Network',
                'data-testid': SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT,
                inputProps: {
                  'data-testid':
                    SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT_INPUT,
                },
              }}
            >
              {getFormSelectMenuItems(
                networkOptions,
                SEARCH_NETWORK_FORM_TEST_IDS.NETWORK_SELECT_ITEM_PREFIX
              )}
            </FormSelect>
          </FormControl>
        </>
      )}
      <FormTextField
        name="memberId"
        control={formControl}
        textFieldProps={{
          label: 'Enter Member ID',
          fullWidth: true,
          sx: styles.enterMemberId,
          'data-testid': SEARCH_NETWORK_FORM_TEST_IDS.MEMBER_ID_FIELD,
          inputProps: {
            'data-testid': SEARCH_NETWORK_FORM_TEST_IDS.MEMBER_ID_INPUT,
          },
        }}
      />
      {isVerifyInsuranceButtonVisible && (
        <LoadingButton
          fullWidth
          variant="outlined"
          size="extraLarge"
          loadingPosition="start"
          loading={isLoading}
          disabled={isVerifyInsuranceButtonDisabled}
          sx={styles.verifyInsuranceButton}
          onClick={onVerifyInsurance}
          data-testid={SEARCH_NETWORK_FORM_TEST_IDS.VERIFY_INSURANCE_BUTTON}
        >
          {verifyInsuranceButtonLabel}
        </LoadingButton>
      )}
      {alert && (
        <Alert
          sx={styles.alert}
          severity={alert.severity}
          title={alert.title}
          message={alert.message}
          data-testid={SEARCH_NETWORK_FORM_TEST_IDS.ALERT}
        />
      )}
      {isInsuranceIneligible && (
        <>
          <Typography
            data-testId={SEARCH_NETWORK_FORM_TEST_IDS.TAKE_PHOTOS_TITLE}
          >
            It looks like the patient’s insurance may be out of network.
            <br />
            <br />
            In order to confirm their appointment, we require an image of their
            insurance card.
          </Typography>
          <Grid container sx={styles.imagesWrapper}>
            {insuranceCardFrontUrl && (
              <Grid item>
                <Typography sx={styles.imageHeader}>FRONT</Typography>
                <ImageUploadStatus
                  testIdPrefix={
                    SEARCH_NETWORK_FORM_TEST_IDS.INSURANCE_CARD_FRONT_IMAGE_PREFIX
                  }
                  status={cardFrontUploadStatus}
                  imageUrl={insuranceCardFrontUrl}
                />
              </Grid>
            )}
            {insuranceCardBackUrl && (
              <Grid item>
                <Typography sx={styles.imageHeader}>BACK</Typography>
                <ImageUploadStatus
                  testIdPrefix={
                    SEARCH_NETWORK_FORM_TEST_IDS.INSURANCE_CARD_BACK_IMAGE_PREFIX
                  }
                  status={cardBackUploadStatus}
                  imageUrl={insuranceCardBackUrl}
                />
              </Grid>
            )}
          </Grid>
        </>
      )}
      {
        // TODO(ON-1149): move '!isUserShouldTakeInsurancePhotos' value to 'isAddAnotherInsuranceButtonVisible' var when we will get real data
        isAddAnotherInsuranceButtonVisible && !isUserShouldTakeInsurancePhotos && (
          <Button
            // TODO(ON-1149): rename onAddAnotherInsuranceButton to onClickAddAnotherInsuranceButton
            onClick={onAddAnotherInsuranceButton}
            data-testid={
              SEARCH_NETWORK_FORM_TEST_IDS.ADD_ANOTHER_INSURANCE_BUTTON
            }
            variant="text"
            sx={styles.addAnotherInsurance}
            disabled={isAddAnotherInsuranceDisabled}
            startIcon={<AddIcon />}
          >
            <Typography>Add another health insurance</Typography>
          </Button>
        )
      }
      {isContinueButtonVisible && (
        <FormFooter
          submitButtonLabel={submitButtonLabel}
          onSubmit={onContinueToConfirmDetailsClick}
        />
      )}
    </Box>
  );
};

export default SearchNetworkForm;
