import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  INSURANCE_DASHBOARD_ROUTES,
  PayerNetworkPathParams,
} from '../constants';
import {
  NavigationBar,
  NavigationBarTab,
  NetworkHeader,
} from '@*company-data-covered*/insurance/ui';
import {
  NetworkIdSelectQuery,
  domainSelectNetwork,
  resetNetworkForm,
  selectPayerForm,
  useAppDispatch,
  useGetNetworkQuery,
  useGetPayerQuery,
} from '@*company-data-covered*/insurance/data-access';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';

const NetworkNavigation = () => {
  const location = useLocation();
  const { payerId = '', networkId = '' } = useParams<PayerNetworkPathParams>();
  const dispatch = useAppDispatch();
  const networkIdSelectQuery: NetworkIdSelectQuery = networkId || skipToken;
  useGetPayerQuery(payerId || skipToken);
  useGetNetworkQuery(networkIdSelectQuery);

  const { data: insuranceNetwork } = useSelector(
    domainSelectNetwork(networkIdSelectQuery)
  );
  const insurancePayer = useSelector(selectPayerForm);

  const networkTabs: NavigationBarTab[] = [
    {
      link: INSURANCE_DASHBOARD_ROUTES.getNetworkDetailsTabPath(
        payerId,
        networkId
      ),
      label: 'Network Details',
    },
    {
      link: INSURANCE_DASHBOARD_ROUTES.getNetworkBillingCitiesTabPath(
        payerId,
        networkId
      ),
      label: 'Configure Billing Cities',
    },
    {
      link: INSURANCE_DASHBOARD_ROUTES.getNetworkCreditCardTabPath(
        payerId,
        networkId
      ),
      label: 'Credit Card Rules',
    },
    {
      link: INSURANCE_DASHBOARD_ROUTES.getNetworkAppointmentTypeTabPath(
        payerId,
        networkId
      ),
      label: 'Appointment Types',
    },
  ];
  const navigate = useNavigate();

  const onBackClick = () => {
    dispatch(resetNetworkForm());
    navigate(INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(payerId));
  };

  return (
    <>
      <NetworkHeader
        title={insuranceNetwork?.name ?? ''}
        buttonTitle={insurancePayer.name}
        onClick={onBackClick}
      />
      <NavigationBar currentLocation={location.pathname} tabs={networkTabs} />
      <Outlet />
    </>
  );
};

export default NetworkNavigation;
