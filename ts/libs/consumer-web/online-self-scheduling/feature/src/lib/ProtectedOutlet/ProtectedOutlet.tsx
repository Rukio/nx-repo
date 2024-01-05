import { FC } from 'react';
import { Outlet, OutletProps } from 'react-router-dom';
import {
  ProtectedContent,
  ProtectedContentProps,
  RedirectLoginOptions,
} from '@*company-data-covered*/auth0/feature';
import { CacheManager } from '../CacheManager';

export type ProtectedOutletProps = {
  protectedContentProps?: Omit<ProtectedContentProps, 'children'>;
  outletProps?: OutletProps;
};

export const ProtectedOutlet: FC<ProtectedOutletProps> = ({
  protectedContentProps,
  outletProps,
}) => {
  const protectedContentRedirectOptions: RedirectLoginOptions = {
    appState: {
      returnTo: window.location.pathname + window.location.search,
    },
  };

  return (
    <ProtectedContent
      {...protectedContentProps}
      redirectOptions={protectedContentRedirectOptions}
    >
      <CacheManager>
        <Outlet {...outletProps} />
      </CacheManager>
    </ProtectedContent>
  );
};
