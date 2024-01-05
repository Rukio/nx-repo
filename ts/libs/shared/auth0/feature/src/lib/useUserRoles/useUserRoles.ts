import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUserRoles } from '@*company-data-covered*/auth0/data-access';
import { UserRoles } from '@*company-data-covered*/auth0/util';

/**
 * @param {UserRoles[]} roles - array of roles to check permission on.
 *
 * @returns {boolean[]} - array which contains boolean value for each role.
 *
 * @example
 * ```
 * const [isAdmin, isInsuranceAdmin] = useUserRoles([UserRoles.ADMIN, UserRoles.INSURANCE_ADMIN])
 * ```
 */
export const useUserRoles = (roles: UserRoles[]): boolean[] => {
  const currentUserRoles = useSelector(selectUserRoles);

  return useMemo(() => {
    return roles.map((role) => !!currentUserRoles?.includes(role));
  }, [currentUserRoles, roles]);
};
