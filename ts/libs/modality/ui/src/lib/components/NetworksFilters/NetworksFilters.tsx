import { FC, ChangeEventHandler } from 'react';
import {
  TextField,
  FormControl,
  Grid,
  Box,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  SearchIcon,
} from '@*company-data-covered*/design-system';
import { NETWORKS_FILTERS_TEST_IDS } from './testIds';

export type Market = {
  id: number;
  name: string;
  shortName: string;
  state: string;
};

export type NetworksFiltersProps = {
  selectedMarket?: Market;
  markets: Market[];
  onChangeMarket: (marketId: Market['id']) => void;
  defaultSearch?: string;
  onChangeSearch: (search: string) => void;
};

const NetworksFilters: FC<NetworksFiltersProps> = ({
  markets,
  onChangeMarket,
  selectedMarket,
  onChangeSearch,
  defaultSearch,
}) => {
  const handleChangeMarket = (event: SelectChangeEvent<number>) => {
    onChangeMarket(Number(event.target.value));
  };
  const handleChangeSearch: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => {
    onChangeSearch(event.target.value);
  };

  return (
    <Box>
      <Grid item container xs={4} mb={3}>
        <FormControl fullWidth>
          <InputLabel
            id={NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT_LABEL}
            data-testid={NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT_LABEL}
          >
            Select a Market
          </InputLabel>
          <Select
            data-testid={NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT}
            labelId={NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT_LABEL}
            value={selectedMarket?.id || ''}
            onChange={handleChangeMarket}
            label="Select a Market"
          >
            {markets.map((item) => (
              <MenuItem
                data-testid={NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT_OPTION}
                key={item.id}
                value={item.id}
              >
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item container xs={6}>
        <TextField
          InputProps={{ startAdornment: <SearchIcon /> }}
          fullWidth
          defaultValue={defaultSearch ?? ''}
          onChange={handleChangeSearch}
          placeholder="Search by insurance network or Athena package ID"
          inputProps={{
            'data-testid': NETWORKS_FILTERS_TEST_IDS.SEARCH_FIELD,
          }}
        />
      </Grid>
    </Box>
  );
};

export default NetworksFilters;
