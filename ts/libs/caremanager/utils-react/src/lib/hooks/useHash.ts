import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export type HashCheckState = Record<string, boolean>;
type HashState = {
  initialState: HashCheckState;
  hashPattern: string;
};

export const useHash = ({ initialState, hashPattern }: HashState) => {
  const location = useLocation();
  const hashSuffix = `-${hashPattern}`;
  let linkState = initialState;

  if (location.hash.includes(hashSuffix)) {
    Object.keys(linkState).forEach((v) => {
      linkState[v] = false;
    });
    const anchor = location.hash.replace(hashSuffix, '').replace('#', '');
    linkState = { ...linkState, ...{ [anchor]: true } };
  }

  const [hash, setHash] = useState<HashCheckState>(linkState);

  const handleChange =
    (taskType: string) =>
    (_event: React.SyntheticEvent | false, newExpanded: boolean) => {
      setHash({ ...hash, ...{ [taskType]: newExpanded } });
    };

  return { hash, handleChange };
};
