import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

import { POSITION_DROPDOWN_TEST_IDS } from './TestIds';

export enum ProfilePosition {
  App = 'APP',
  Dhmt = 'DHMT',
}

type PositionList = {
  name: ProfilePosition;
}[];

export const POSITION_LIST: PositionList = [
  { name: ProfilePosition.App },
  { name: ProfilePosition.Dhmt },
];

export interface PositionDropdownProps {
  selectedPositionName: ProfilePosition;
  onPositionChange?: (selectedPositionName: ProfilePosition) => void;
  isDisabled?: boolean;
}

const makeStyles = () =>
  makeSxStyles({
    selectWrapper: {
      minWidth: '220px',
    },
  });

export const PositionDropdown = ({
  selectedPositionName = ProfilePosition.App,
  onPositionChange,
  isDisabled = false,
}: PositionDropdownProps) => {
  const styles = makeStyles();

  const handlePositionChange = (event: SelectChangeEvent) => {
    const positionName = event.target.value as ProfilePosition;
    onPositionChange?.(positionName);
  };

  return (
    <FormControl sx={styles.selectWrapper} size="medium">
      <InputLabel data-testid={POSITION_DROPDOWN_TEST_IDS.LABEL}>
        Position
      </InputLabel>
      <Select
        data-testid={POSITION_DROPDOWN_TEST_IDS.SELECT}
        variant="outlined"
        size="medium"
        label="Position"
        onChange={handlePositionChange}
        disabled={isDisabled}
        value={selectedPositionName}
      >
        {POSITION_LIST.map(({ name }) => (
          <MenuItem
            data-testid={POSITION_DROPDOWN_TEST_IDS.getSelectItem(name)}
            value={name}
            key={name}
          >
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
