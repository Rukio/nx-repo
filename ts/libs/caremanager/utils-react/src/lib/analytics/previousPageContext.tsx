import React, { createContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PreviousPageContextProps {
  to: string | null;
  from: string | null;
}

const defaultPreviousPageContext = {
  to: null,
  from: null,
};

export const PreviousPageContext = createContext<PreviousPageContextProps>(
  defaultPreviousPageContext
);

interface PreviousPageProviderProps {
  children: React.ReactNode;
}

export const PreviousPageProvider: React.FC<PreviousPageProviderProps> = ({
  children,
}) => {
  const location = useLocation();
  const [route, setRoute] = useState({
    to: location.pathname,
    from: location.pathname,
  });

  useEffect(() => {
    setRoute((prev) => ({ to: location.pathname, from: prev.to }));
  }, [location]);

  return (
    <PreviousPageContext.Provider value={route}>
      {children}
    </PreviousPageContext.Provider>
  );
};
