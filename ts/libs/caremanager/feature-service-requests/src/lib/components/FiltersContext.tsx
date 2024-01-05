import { useSearchParams } from '@*company-data-covered*/caremanager/utils-react';
import { FC, ReactNode, createContext, useContext } from 'react';

type Props = {
  children: ReactNode;
};

type ContextValue = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  marketIds: string[];
  setMarketIds: (ids: string[]) => void;
  statusId: string | null;
  setStatusId: (id: string | null) => void;
};

const Context = createContext<ContextValue>({
  searchTerm: '',
  setSearchTerm: () => null,
  marketIds: [],
  setMarketIds: () => null,
  statusId: '',
  setStatusId: () => null,
});

export const useFiltersContext = () => useContext(Context);

export const FiltersProvider: FC<Props> = ({ children }) => {
  const { searchParams, searchParamsObject, setSearchParams } =
    useSearchParams();

  const marketIds = searchParams.getAll('marketIds');
  const setMarketIds = (ids: string[]) =>
    setSearchParams({ ...searchParamsObject, marketIds: ids });

  const searchTerm = searchParams.get('searchTerm') || '';
  const setSearchTerm = (term: string) =>
    setSearchParams({ ...searchParamsObject, searchTerm: term });

  const statusId = searchParams.get('statusId');
  const setStatusId = (id: string | null) =>
    setSearchParams({ ...searchParamsObject, statusId: id });

  return (
    <Context.Provider
      value={{
        marketIds,
        setMarketIds,
        searchTerm,
        setSearchTerm,
        statusId,
        setStatusId,
      }}
    >
      {children}
    </Context.Provider>
  );
};
