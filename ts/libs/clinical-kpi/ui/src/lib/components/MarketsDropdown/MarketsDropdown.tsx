import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

import { MARKETS_DROPDOWN_TEST_IDS } from './TestIds';

export interface Market {
  name: string;
  id: string;
}

export interface MarketsDropdownProps {
  selectedMarketId?: string;
  onMarketChange?: (marketId: string) => void;
  markets: Market[];
}

const makeStyles = () =>
  makeSxStyles({
    selectWrapper: {
      minWidth: '220px',
    },
  });

const MarketsDropdown: React.FC<MarketsDropdownProps> = ({
  selectedMarketId,
  onMarketChange,
  markets,
}) => {
  const styles = makeStyles();

  const handleMarketChange = (event: SelectChangeEvent) => {
    onMarketChange?.(event.target.value);
  };

  return (
    <FormControl sx={styles.selectWrapper} size="medium">
      <InputLabel data-testid={MARKETS_DROPDOWN_TEST_IDS.LABEL}>
        Market
      </InputLabel>
      <Select
        data-testid={MARKETS_DROPDOWN_TEST_IDS.SELECT}
        variant="outlined"
        size="medium"
        label="Market"
        onChange={handleMarketChange}
        value={selectedMarketId ?? ''}
      >
        {markets.map(({ id, name }) => (
          <MenuItem
            key={id}
            data-testid={MARKETS_DROPDOWN_TEST_IDS.SELECT_ITEM(id)}
            value={id}
          >
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MarketsDropdown;
