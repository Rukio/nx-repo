import { FC, ChangeEvent } from 'react';
import {
  makeSxStyles,
  Paper,
  FormControl,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  Alert,
  Grid,
} from '@*company-data-covered*/design-system';
import { NETWORKS_CREDIT_CARD_RULES_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    formRoot: {
      maxWidth: '800px',
      width: '100%',
      p: 3,
    },
    radioFormControl: {
      display: 'flex',
      mt: 3,
      '&:first-of-type': {
        mt: 0,
      },
    },
    radioGroup: {
      width: 'fit-content',
    },
    formControlTitle: {
      mb: 1,
    },
    serviceLineOptionValue: (theme) => ({
      ml: 0.75,
      fontWeight: theme.typography.fontWeightBold,
    }),
  });

export interface ServiceLineCreditCardRule {
  serviceLineId: string;
  serviceLineName: string;
  creditCardRule?: string;
  disabled?: boolean;
}

export type CreditCardRuleOption = {
  label: string;
  displayedValue?: string;
  value: string;
};

export interface NetworksCreditCardRulesFormProps {
  serviceLineRules: ServiceLineCreditCardRule[];
  creditCardRules: CreditCardRuleOption[];
  onChangeCreditCardRule: (serviceLineId: string, value: string) => void;
  isDisabled?: boolean;
}

const NetworksCreditCardRulesForm: FC<NetworksCreditCardRulesFormProps> = ({
  serviceLineRules,
  creditCardRules,
  onChangeCreditCardRule,
  isDisabled = false,
}) => {
  const classes = makeStyles();

  const handleChangeOption =
    (serviceLineId: ServiceLineCreditCardRule['serviceLineId']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      onChangeCreditCardRule(serviceLineId, value);
    };

  const renderServiceLineOptionLabel = (
    creditCardRule: CreditCardRuleOption
  ) => {
    return (
      <Grid container>
        <Typography>{creditCardRule.label}</Typography>
        {creditCardRule.displayedValue && (
          <Typography sx={classes.serviceLineOptionValue}>
            {creditCardRule.displayedValue}
          </Typography>
        )}
      </Grid>
    );
  };

  const renderServiceLineOption = (
    serviceLineId: string,
    creditCardRule: CreditCardRuleOption
  ) => {
    const serviceLineOptionTestIdSelector =
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineOptionTestId(
        serviceLineId,
        creditCardRule.value
      );

    return (
      <FormControlLabel
        key={serviceLineOptionTestIdSelector}
        control={<Radio data-testid={serviceLineOptionTestIdSelector} />}
        label={renderServiceLineOptionLabel(creditCardRule)}
        value={creditCardRule.value}
        disabled={isDisabled}
      />
    );
  };

  const renderServiceLine = (serviceLineRule: ServiceLineCreditCardRule) => {
    const serviceLineTestIdSelector =
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineTestId(
        serviceLineRule.serviceLineId
      );
    const serviceLineAlertTestIdSelector =
      NETWORKS_CREDIT_CARD_RULES_TEST_IDS.getServiceLineAlertTestId(
        serviceLineRule.serviceLineId
      );

    return (
      <FormControl
        key={serviceLineTestIdSelector}
        data-testid={serviceLineTestIdSelector}
        sx={classes.radioFormControl}
      >
        <Typography variant="h6" sx={classes.formControlTitle}>
          {serviceLineRule.serviceLineName}
        </Typography>
        {!serviceLineRule.disabled ? (
          <RadioGroup
            sx={classes.radioGroup}
            name={serviceLineRule.serviceLineName}
            value={serviceLineRule.creditCardRule || ''}
            onChange={handleChangeOption(serviceLineRule.serviceLineId)}
          >
            {creditCardRules.map((creditCardRule) =>
              renderServiceLineOption(
                serviceLineRule.serviceLineId,
                creditCardRule
              )
            )}
          </RadioGroup>
        ) : (
          <Alert
            data-testid={serviceLineAlertTestIdSelector}
            severity="info"
            message={`There are currently no billing cities configured for ${serviceLineRule.serviceLineName}`}
          />
        )}
      </FormControl>
    );
  };

  return (
    <Paper
      sx={classes.formRoot}
      data-testid={NETWORKS_CREDIT_CARD_RULES_TEST_IDS.ROOT}
    >
      {serviceLineRules.map(renderServiceLine)}
    </Paper>
  );
};

export default NetworksCreditCardRulesForm;
