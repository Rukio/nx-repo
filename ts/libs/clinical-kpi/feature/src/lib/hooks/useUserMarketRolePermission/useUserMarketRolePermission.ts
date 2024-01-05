import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { selectUserMarketRole } from '@*company-data-covered*/clinical-kpi/data-access';
import { MarketRole } from '@*company-data-covered*/auth0/util';

const useUserMarketRolePermission = (allowedRoles: MarketRole[]) => {
  const marketRole = useSelector(selectUserMarketRole);
  const showLeadsViewIndividualVisibility = useMemo(
    () => marketRole && allowedRoles.includes(marketRole),
    [marketRole, allowedRoles]
  );

  return showLeadsViewIndividualVisibility;
};

export default useUserMarketRolePermission;
