import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

type SidePanelContextValue = {
  isSidePanelOpen: boolean;
  setSidePanelOpen: (visitId: string, isOpen: boolean) => void;
  closeSidePanel: () => void;
  selectedVisitId: string | null;
};

const SidePanelContext = createContext<SidePanelContextValue>({
  isSidePanelOpen: false,
  setSidePanelOpen: () => undefined,
  closeSidePanel: () => undefined,
  selectedVisitId: null,
});

export const usePanelContext = () => useContext(SidePanelContext);

export const SidePanelProvider = ({ children }: PropsWithChildren) => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const setSidePanelOpen = useCallback((visitId: string, isOpen: boolean) => {
    setSelectedVisitId(isOpen ? visitId : null);
    setIsSidePanelOpen(isOpen);
  }, []);

  const closeSidePanel = useCallback(() => {
    setIsSidePanelOpen(false);
    setSelectedVisitId(null);
  }, []);

  return (
    <SidePanelContext.Provider
      value={{
        isSidePanelOpen,
        selectedVisitId,
        setSidePanelOpen,
        closeSidePanel,
      }}
    >
      {children}
    </SidePanelContext.Provider>
  );
};
