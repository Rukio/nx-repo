import { Button, ButtonGroup } from '../..';
import { makeSxStyles } from '../../utils/makeSxStyles';
import { ClinicalProviderSearchFormType } from './index';
import CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS from './testIds';

export interface FormSelectorProps {
  searchForms: ClinicalProviderSearchFormType[];
  selectedForm: ClinicalProviderSearchFormType;
  onSelect: (form: ClinicalProviderSearchFormType) => void;
}

const makeStyles = () =>
  makeSxStyles({
    buttonGroup: {
      marginBottom: 3,
    },
    buttonSelected: (theme) => ({
      background: theme.palette.primary.main,
      color: 'white',
      '&:hover': {
        background: theme.palette.primary.main,
      },
    }),
  });

const FormSelector: React.FC<FormSelectorProps> = ({
  searchForms,
  selectedForm,
  onSelect,
}) => {
  const styles = makeStyles();

  const isButtonSelected = (formName: ClinicalProviderSearchFormType) =>
    selectedForm === formName;

  const ButtonLabels = {
    [ClinicalProviderSearchFormType.Name]: 'Name',
    [ClinicalProviderSearchFormType.Practice]: 'Practice',
    [ClinicalProviderSearchFormType.Phone]: 'Phone',
    [ClinicalProviderSearchFormType.Pharmacy]: 'Pharmacy',
  };

  return (
    <ButtonGroup color="primary" fullWidth={true} sx={styles.buttonGroup}>
      {searchForms.map((formName) => (
        <Button
          key={`${CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FORM_SELECT_BUTTON}-${formName}`}
          data-testid={`${CLINICAL_PROVIDER_SEARCH_FORM_TEST_IDS.FORM_SELECT_BUTTON}-${formName}`}
          size="large"
          sx={isButtonSelected(formName) ? styles.buttonSelected : null}
          onClick={() => onSelect(formName)}
        >
          By {ButtonLabels[formName]}
        </Button>
      ))}
    </ButtonGroup>
  );
};

export default FormSelector;
