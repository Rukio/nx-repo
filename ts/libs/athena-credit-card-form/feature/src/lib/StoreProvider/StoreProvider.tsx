import { FC, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { store } from '@*company-data-covered*/athena-credit-card-form/data-access';

const StoreProvider: FC<PropsWithChildren> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
