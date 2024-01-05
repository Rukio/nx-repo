import { Provider } from 'react-redux';
import { store } from '@*company-data-covered*/clinical-kpi/data-access';

export interface StoreProviderProps {
  children: React.ReactNode;
}

const StoreProvider = ({ children }: StoreProviderProps): JSX.Element => {
  return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
