import {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

type Props = {
  children: ReactNode;
};

type SidebarContextValue = {
  sidebarIsOpen?: boolean;
  openSidebar?: (id: string) => void;
  closeSidebar?: () => void;
  selectedRequestId?: string | undefined;
  clearSelectedRequestId?: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({});

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider: FC<Props> = ({ children }) => {
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>();

  const openSidebar = useCallback((id: string) => {
    setSelectedRequestId(id);
    setSidebarIsOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarIsOpen(false);
  }, []);

  const clearSelectedRequestId = useCallback(() => {
    setSelectedRequestId(undefined);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        sidebarIsOpen,
        selectedRequestId,
        openSidebar,
        closeSidebar,
        clearSelectedRequestId,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
