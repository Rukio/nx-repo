import { Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import { INSURANCE_DASHBOARD_ROUTES, PayerPathParams } from '../constants';
import {
  NavigationBar,
  NavigationBarTab,
  DetailsPageHeader,
} from '@*company-data-covered*/insurance/ui';
import {
  resetPayerForm,
  selectPayer,
  useAppDispatch,
} from '@*company-data-covered*/insurance/data-access';

const PayerNavigation = () => {
  const location = useLocation();
  const { payerId = '' } = useParams<PayerPathParams>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: payer } = useSelector(selectPayer(payerId || skipToken));

  const payerTabs: NavigationBarTab[] = [
    {
      link: INSURANCE_DASHBOARD_ROUTES.getPayerDetailsTabPath(payerId),
      label: 'Payer Details',
    },
    {
      link: INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(payerId),
      label: 'Networks',
    },
  ];

  const onGoBack = () => {
    dispatch(resetPayerForm());
    navigate(INSURANCE_DASHBOARD_ROUTES.PAYERS);
  };

  return (
    <>
      <DetailsPageHeader title={payer?.name || ''} onGoBack={onGoBack} />
      <NavigationBar currentLocation={location.pathname} tabs={payerTabs} />
      <Outlet />
    </>
  );
};

export default PayerNavigation;
