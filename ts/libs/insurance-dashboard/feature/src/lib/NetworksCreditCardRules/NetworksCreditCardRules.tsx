import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  NetworksCreditCardRulesForm,
  CreditCardRuleOption,
  FormManageControls,
} from '@*company-data-covered*/insurance/ui';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  useGetNetworkCreditCardRulesQuery,
  useGetNetworkServiceLinesQuery,
  useGetServiceLinesQuery,
  selectNetworkAllServiceLinesCreditCardRules,
  useAppDispatch,
  upsertNetworkCreditCardRules,
  selectNetworkCreditCardRules,
  updateInsuranceNetworkCreditCardRules,
  resetNetworkCreditCardRules,
  selectManageNetworksLoadingState,
  showSuccess,
  showError,
  getErrorMessageFromResponse,
  NetworkCreditCardRules,
} from '@*company-data-covered*/insurance/data-access';
import {
  PayerNetworkPathParams,
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
} from '../constants';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import { useUserRoles } from '@*company-data-covered*/auth0/feature';
import { UserRoles } from '@*company-data-covered*/auth0/util';

const { NETWORK_CREDIT_CARD_RULES_SUCCESS, NETWORK_CREDIT_CARD_RULES_ERROR } =
  DEFAULT_NOTIFICATION_MESSAGES;

const creditCardRuleOptions: CreditCardRuleOption[] = [
  {
    label: 'Credit card is',
    displayedValue: 'optional',
    value: NetworkCreditCardRules.optional,
  },
  {
    label: 'Credit card is',
    displayedValue: 'required',
    value: NetworkCreditCardRules.required,
  },
  {
    label: 'Do not ask',
    value: NetworkCreditCardRules.disabled,
  },
];

const makeStyles = () =>
  makeSxStyles({
    boxFormWrapper: {
      display: 'flex',
      justifyContent: 'center',
      mt: 3,
      mb: 12,
    },
    boxFormControlsWrapper: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
    },
  });

const NetworksCreditCardRules = () => {
  const { networkId, payerId = '' } = useParams<PayerNetworkPathParams>();
  const dispatch = useAppDispatch();
  const styles = makeStyles();
  const navigate = useNavigate();

  const [isInsuranceAdmin] = useUserRoles([UserRoles.INSURANCE_ADMIN]);

  useGetServiceLinesQuery();
  useGetNetworkCreditCardRulesQuery(networkId || skipToken, {
    refetchOnMountOrArgChange: true,
  });
  useGetNetworkServiceLinesQuery(networkId || skipToken, {
    refetchOnMountOrArgChange: true,
  });

  const networkCreditCardRules = useSelector(selectNetworkCreditCardRules);
  const networkServiceLinesCreditCardRules = useSelector(
    selectNetworkAllServiceLinesCreditCardRules(networkId || skipToken)
  );
  const { isLoading } = useSelector(selectManageNetworksLoadingState);

  const handleChangeCreditCardRule = (
    serviceLineId: string,
    creditCardRule: string
  ) => {
    dispatch(
      upsertNetworkCreditCardRules({
        serviceLineId,
        creditCardRule: creditCardRule as NetworkCreditCardRules,
      })
    );
  };
  const handleCancelChanges = () => {
    if (networkId) {
      dispatch(resetNetworkCreditCardRules(networkId));
      navigate(INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(payerId));
    }
  };

  const handleSaveCreditCardRules = () => {
    if (networkId) {
      dispatch(
        updateInsuranceNetworkCreditCardRules(networkId, networkCreditCardRules)
      ).then((res) => {
        if (!isQueryErrorResponse(res)) {
          dispatch(
            showSuccess({
              message: NETWORK_CREDIT_CARD_RULES_SUCCESS,
            })
          );
        } else {
          dispatch(
            showError({
              message:
                getErrorMessageFromResponse(res) ||
                NETWORK_CREDIT_CARD_RULES_ERROR,
            })
          );
        }
      });
    }
  };

  return (
    <>
      <Box sx={styles.boxFormWrapper}>
        <NetworksCreditCardRulesForm
          creditCardRules={creditCardRuleOptions}
          serviceLineRules={networkServiceLinesCreditCardRules}
          onChangeCreditCardRule={handleChangeCreditCardRule}
          isDisabled={!isInsuranceAdmin}
        />
      </Box>
      {isInsuranceAdmin && (
        <Box sx={styles.boxFormControlsWrapper}>
          <FormManageControls
            onCancel={handleCancelChanges}
            onSubmit={handleSaveCreditCardRules}
            isLoading={isLoading}
          />
        </Box>
      )}
    </>
  );
};

export default NetworksCreditCardRules;
