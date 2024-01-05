import React from 'react';
import { Chip } from '@*company-data-covered*/design-system';

type IncompleteTaskFilterProps = {
  selected: boolean;
  setSelected: (_: boolean) => void;
};

const IncompleteTaskFilter: React.FC<IncompleteTaskFilterProps> = ({
  selected,
  setSelected,
}) => {
  const defaultLabel = 'Has Incomplete Task';

  const handleClick = () => {
    setSelected(!selected);
  };

  return (
    <Chip
      data-testid="incomplete-task-filter"
      variant="outlined"
      color={selected ? 'primary' : 'default'}
      label={defaultLabel}
      onClick={handleClick}
    />
  );
};

export default IncompleteTaskFilter;
