import { FC, ChangeEventHandler, useId } from 'react';
import {
  TextField,
  Typography,
  Select,
  RadioGroup,
  Radio,
  Button,
  Paper,
  makeSxStyles,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  SelectChangeEvent,
  Divider,
  Box,
} from '@*company-data-covered*/design-system';
import { NETWORK_FORM_TEST_IDS } from './testIds';
import { AddressForm } from './AddressForm';

export type State = {
  id: string;
  name: string;
};

export type InsuranceNetworkAddress = {
  city?: string;
  stateName?: string;
  zipCode?: string;
  addressLineOne?: string;
};

export type InsuranceNetworkForm = {
  name: string;
  insuranceClassificationId: string;
  packageId: string;
  address?: InsuranceNetworkAddress;
  notes: string;
  active: boolean;
  eligibilityCheck: boolean;
  providerEnrollment: boolean;
  insurancePayerId: string;
  emcCode: string;
  addresses: InsuranceNetworkAddress[];
};

type NetworkClassification = {
  id: number;
  name: string;
};

export type NetworkFormProps = {
  network?: InsuranceNetworkForm;
  networkClassifications: NetworkClassification[];
  addressStates: State[];
  isEditingForm?: boolean;
  isAddAddressButtonVisible: boolean;
  addAddressButtonTitle: string;
  onChangeField: (fieldName: string, value: string | boolean) => void;
  onChangeNetworkAddressFormField: (
    fieldName: string,
    value: string,
    addressToUpdateIndex: number
  ) => void;
  onArchive?: () => void;
  onAddAddress: () => void;
  onRemoveAddress: (addressToUpdateIndex: number) => void;
  isDisabled?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    formRoot: {
      maxWidth: '800px',
      width: '100%',
      p: 3,
    },
    inputContainer: {
      mt: 3,
    },
    inputTitle: {
      mb: 1,
    },
    divider: {
      mt: 3,
    },
  });

const NetworkForm: FC<NetworkFormProps> = ({
  network,
  networkClassifications,
  addressStates,
  isEditingForm,
  isAddAddressButtonVisible,
  addAddressButtonTitle,
  onChangeField,
  onChangeNetworkAddressFormField,
  onArchive,
  onAddAddress,
  onRemoveAddress,
  isDisabled = false,
}) => {
  const styles = makeStyles();
  const classificationSelectorTestId =
    NETWORK_FORM_TEST_IDS.CLASSIFICATION_SELECT;

  const handleChangeStatus: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { value, name } = event.target;
    onChangeField(name, JSON.parse(value));
  };
  const handleOnSelectNetworkOption = (event: SelectChangeEvent<string>) => {
    const { value, name } = event.target;
    onChangeField(name, value);
  };
  const handleChangeInput: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => {
    const { name, value } = event.target;
    onChangeField(name, value);
  };

  const renderSelect = ({
    label,
    labelId,
    name,
    value = '',
    selectTestId,
    data,
    getItemTestIdSelector,
  }: {
    label: string;
    labelId: string;
    name: keyof InsuranceNetworkForm;
    value?: string;
    selectTestId: string;
    data: NetworkClassification[];
    getItemTestIdSelector: (id: number) => string;
  }) => {
    return (
      <FormControl fullWidth sx={styles.inputContainer}>
        <InputLabel id={labelId}>{label}</InputLabel>
        <Select
          labelId={labelId}
          label={label}
          fullWidth
          data-testid={selectTestId}
          onChange={handleOnSelectNetworkOption}
          name={name}
          value={value}
          disabled={isDisabled}
        >
          {data.map((dataItem) => {
            const selector = getItemTestIdSelector(dataItem.id);

            return (
              <MenuItem
                key={selector}
                value={dataItem.id}
                data-testid={selector}
              >
                {dataItem.name}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    );
  };
  const renderQuestion = ({
    question,
    value = true,
    name,
  }: {
    question: string;
    value?: boolean;
    name: keyof InsuranceNetworkForm;
  }) => (
    <Box sx={styles.inputContainer}>
      <Typography variant="h6" sx={styles.inputTitle}>
        {question}
      </Typography>
      <FormControl>
        <RadioGroup name={name} value={value} onChange={handleChangeStatus}>
          <FormControlLabel
            control={
              <Radio
                inputProps={{ 'aria-label': 'Status active' }}
                data-testid={NETWORK_FORM_TEST_IDS.getActiveQuestionTestId(
                  name
                )}
              />
            }
            label="Yes"
            value="true"
            disabled={isDisabled}
          />
          <FormControlLabel
            control={
              <Radio
                inputProps={{ 'aria-label': 'Status inactive' }}
                data-testid={NETWORK_FORM_TEST_IDS.getInactiveQuestionTestId(
                  name
                )}
              />
            }
            label="No"
            value="false"
            disabled={isDisabled}
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );

  return (
    <Paper sx={styles.formRoot}>
      <TextField
        label="Network Name"
        name="name"
        fullWidth
        value={network?.name ?? ''}
        inputProps={{
          'data-testid': NETWORK_FORM_TEST_IDS.NAME_INPUT,
        }}
        onChange={handleChangeInput}
        disabled={isDisabled}
      />
      {renderSelect({
        label: 'Classification',
        labelId: useId(),
        name: 'insuranceClassificationId',
        value: network?.insuranceClassificationId,
        selectTestId: classificationSelectorTestId,
        data: networkClassifications,
        getItemTestIdSelector:
          NETWORK_FORM_TEST_IDS.getClassificationSelectOptionTestId,
      })}
      <FormControl fullWidth sx={styles.inputContainer}>
        <TextField
          label="Athena Package ID"
          name="packageId"
          fullWidth
          value={network?.packageId ?? ''}
          inputProps={{
            'data-testid': NETWORK_FORM_TEST_IDS.PACKAGE_ID_INPUT,
          }}
          onChange={handleChangeInput}
          disabled={isDisabled}
        />
      </FormControl>
      <FormControl fullWidth sx={styles.inputContainer}>
        <TextField
          label="EMC Code"
          name="emcCode"
          fullWidth
          value={network?.emcCode ?? ''}
          inputProps={{
            'data-testid': NETWORK_FORM_TEST_IDS.EMC_CODE_INPUT,
          }}
          onChange={handleChangeInput}
          disabled={isDisabled}
        />
      </FormControl>
      <Divider sx={styles.divider} />
      {network?.addresses.map((address, index) => {
        const addressTitle =
          index === 0 ? 'claims address' : `claims address ${index + 1}`;

        return (
          <AddressForm
            key={NETWORK_FORM_TEST_IDS.getAddressFormTestId(index)}
            address={address}
            addressIndex={index}
            states={addressStates}
            addressTitle={addressTitle}
            onChangeNetworkAddressFormField={onChangeNetworkAddressFormField}
            onRemoveAddress={onRemoveAddress}
            isDisabled={isDisabled}
          />
        );
      })}
      {isAddAddressButtonVisible && (
        <FormControl sx={styles.inputContainer}>
          <Button
            variant="outlined"
            size="large"
            data-testid={NETWORK_FORM_TEST_IDS.ADD_ANOTHER_ADDRESS_BUTTON}
            onClick={onAddAddress}
          >
            {addAddressButtonTitle}
          </Button>
        </FormControl>
      )}
      <Divider sx={styles.divider} />
      {renderQuestion({
        question: 'Active?',
        value: network?.active,
        name: 'active',
      })}
      {renderQuestion({
        question: 'Run Eligibility Check',
        value: network?.eligibilityCheck,
        name: 'eligibilityCheck',
      })}
      {renderQuestion({
        question: 'Enable Provider Enrollment for this Network?',
        value: network?.providerEnrollment,
        name: 'providerEnrollment',
      })}
      <FormControl fullWidth sx={styles.inputContainer}>
        <TextField
          multiline
          placeholder="Network Note"
          fullWidth
          value={network?.notes ?? ''}
          name="notes"
          rows={5}
          inputProps={{
            'data-testid': NETWORK_FORM_TEST_IDS.NOTES_INPUT,
          }}
          onChange={handleChangeInput}
          disabled={isDisabled}
        />
      </FormControl>
      {isEditingForm && (
        <FormControl sx={styles.inputContainer}>
          <Button
            variant="outlined"
            color="error"
            size="large"
            data-testid={NETWORK_FORM_TEST_IDS.ARCHIVE_BUTTON}
            onClick={onArchive}
            disabled={isDisabled}
          >
            Archive this Network
          </Button>
        </FormControl>
      )}
    </Paper>
  );
};

export default NetworkForm;
