import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  TextField,
} from '../..';
import { ClinicalProviderSearchFormType, ClinicalProviderSearchTerms } from '.';
import CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS from './testIds';
import { makeSxStyles } from '../../utils/makeSxStyles';
import { formatPhoneNumber } from '../../utils/formatters';
import {
  hasValue,
  isValidZipCode,
  isValidPhoneNumber,
} from '../../utils/validators';

export interface SearchFormProps {
  type: ClinicalProviderSearchFormType;
  defaultSearchTermValues: Partial<ClinicalProviderSearchTerms>;
  onSearch: (searchTerms: ClinicalProviderSearchTerms) => void;
}

interface FormTextFieldHelperProps {
  fieldName: string;
  showLabel?: boolean;
  value: string;
  testId: string;
  autoFocus?: boolean;
}

const makeStyles = () =>
  makeSxStyles({
    formContents: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    },
    distanceSelect: {
      width: '100%',
    },
    selectItem: {
      my: 1,
    },
    searchButton: {
      width: '100%',
    },
  });

const getSearchTerms = (
  searchTerms: Partial<ClinicalProviderSearchTerms>
): ClinicalProviderSearchTerms => ({
  practiceName: '',
  providerFirstName: '',
  providerLastName: '',
  pharmacyName: '',
  phone: '',
  rangeInMiles: '',
  zipCode: '',
  ...searchTerms,
});

const noFieldErrors: { [key: string]: string } = {
  practiceName: '',
  providerFirstName: '',
  providerLastName: '',
  pharmacyName: '',
  phone: '',
  zipCode: '',
  rangeInMiles: '',
};

const RangeInMilesChoices = ['10', '25', '50', '100'];

const FieldLabels: Record<string, string> = {
  providerFirstName: 'First Name',
  providerLastName: 'Last Name',
  practiceName: 'Practice Name',
  phone: 'Phone Number',
  pharmacyName: 'Pharmacy Name',
  zipCode: 'Zip Code',
};

const SearchForm: React.FC<SearchFormProps> = ({
  type,
  defaultSearchTermValues,
  onSearch,
}: SearchFormProps) => {
  const styles = makeStyles();
  const [searchTerms, setSearchTerms] = useState<ClinicalProviderSearchTerms>(
    getSearchTerms(defaultSearchTermValues)
  );
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string>>(noFieldErrors);

  useEffect(() => {
    setSearchTerms((currentSearchTerms) => ({
      ...currentSearchTerms,
      ...defaultSearchTermValues,
    }));
    setFieldErrors(noFieldErrors);
  }, [type, defaultSearchTermValues]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerms({ ...searchTerms, [event.target.name]: event.target.value });
    setFieldErrors({ ...fieldErrors, [event.target.name]: '' });
  };

  const isSearchButtonEnabled = () => {
    const {
      practiceName,
      providerFirstName,
      providerLastName,
      pharmacyName,
      phone,
      rangeInMiles,
      zipCode,
    } = searchTerms;

    return (
      (type === ClinicalProviderSearchFormType.Name &&
        providerFirstName &&
        providerLastName &&
        zipCode &&
        rangeInMiles) ||
      (type === ClinicalProviderSearchFormType.Practice &&
        practiceName &&
        zipCode &&
        rangeInMiles) ||
      (type === ClinicalProviderSearchFormType.Phone && phone) ||
      (type === ClinicalProviderSearchFormType.Pharmacy &&
        pharmacyName &&
        zipCode &&
        rangeInMiles)
    );
  };

  const validateField = (fieldName: string) => {
    let errorMessage = '';

    switch (fieldName) {
      case 'providerFirstName':
      case 'providerLastName':
      case 'practiceName':
      case 'pharmacyName':
      case 'rangeInMiles':
        if (!hasValue(searchTerms[fieldName])) {
          errorMessage = `${FieldLabels[fieldName]} is required.`;
        }
        break;
      case 'zipCode':
        if (!searchTerms.zipCode || !isValidZipCode(searchTerms.zipCode)) {
          errorMessage = 'Please enter a valid 5 digit zip code.';
        }
        break;
      case 'phone':
        if (!searchTerms.phone || !isValidPhoneNumber(searchTerms.phone)) {
          errorMessage = 'Please enter a valid 10 digit phone number';
        }
        break;
      default:
        break;
    }
    setFieldErrors({
      ...fieldErrors,
      [fieldName]: errorMessage,
    });
  };

  const renderTextField = ({
    fieldName,
    showLabel = false,
    value,
    testId,
    autoFocus = false,
  }: FormTextFieldHelperProps) => {
    return (
      <FormControl variant="outlined">
        <TextField
          name={fieldName}
          label={showLabel ? FieldLabels[fieldName] : null}
          placeholder={FieldLabels[fieldName]}
          value={value}
          onChange={onChange}
          onBlur={() => validateField(fieldName)}
          inputProps={{
            'data-dd-privacy': 'mask',
            'data-testid': testId,
          }}
          autoFocus={autoFocus}
        />
        {fieldErrors[fieldName] && (
          <FormHelperText
            error
            data-testid={`${testId}-${CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.INPUT_ERROR}`}
          >
            {fieldErrors[fieldName]}
          </FormHelperText>
        )}
      </FormControl>
    );
  };
  const renderLocationSearchFields = () => {
    const { rangeInMiles, zipCode } = searchTerms;

    return (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            name="rangeInMiles"
            value={rangeInMiles}
            onChange={onChange}
            select
            label="Within"
            sx={styles.distanceSelect}
            inputProps={{
              'data-testid':
                CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.RANGE_IN_MILES_INPUT,
            }}
          >
            {RangeInMilesChoices.map((d) => (
              <MenuItem
                data-testid={`distance-value-${d}`}
                key={d}
                value={d}
                aria-label={d}
              >
                {d} miles
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6}>
          {renderTextField({
            fieldName: 'zipCode',
            showLabel: true,
            value: zipCode,
            testId: CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.ZIP_CODE_INPUT,
          })}
        </Grid>
      </Grid>
    );
  };

  const renderForm = () => {
    const {
      practiceName,
      providerFirstName,
      providerLastName,
      pharmacyName,
      phone,
    } = searchTerms;

    switch (type) {
      case ClinicalProviderSearchFormType.Name:
        return (
          <>
            {renderTextField({
              fieldName: 'providerFirstName',
              value: providerFirstName,
              testId: CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FIRST_NAME_INPUT,
              autoFocus: true,
            })}
            {renderTextField({
              fieldName: 'providerLastName',
              value: providerLastName,
              testId: CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.LAST_NAME_INPUT,
            })}
            {renderLocationSearchFields()}
          </>
        );

      case ClinicalProviderSearchFormType.Practice:
        return (
          <>
            {renderTextField({
              fieldName: 'practiceName',
              value: practiceName,
              testId:
                CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PRACTICE_NAME_INPUT,
              autoFocus: true,
            })}
            {renderLocationSearchFields()}
          </>
        );

      case ClinicalProviderSearchFormType.Phone:
        return renderTextField({
          fieldName: 'phone',
          value: formatPhoneNumber(phone),
          testId: CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PHONE_INPUT,
          autoFocus: true,
        });

      case ClinicalProviderSearchFormType.Pharmacy:
        return (
          <>
            {renderTextField({
              fieldName: 'pharmacyName',
              value: pharmacyName,
              testId:
                CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.PHARMACY_NAME_INPUT,
              autoFocus: true,
            })}
            {renderLocationSearchFields()}
          </>
        );

      default:
        return null;
    }
  };

  const handleSubmit = () => {
    const cleanPhone = searchTerms.phone
      ? searchTerms.phone.replace(/\D/g, '')
      : '';
    onSearch({ ...searchTerms, phone: cleanPhone });
  };

  return (
    <form>
      <Box sx={styles.formContents}>
        {renderForm()}
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={!isSearchButtonEnabled()}
          sx={styles.searchButton}
          data-testid={CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.SEARCH_BUTTON}
        >
          Search
        </Button>
      </Box>
    </form>
  );
};

export default SearchForm;
