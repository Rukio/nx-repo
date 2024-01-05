import { MenuItem, Select, makeSxStyles } from '@*company-data-covered*/design-system';
import { PROVIDER_MARKETS_DROPDOWN_TEST_IDS } from './TestIds';

const makeStyles = (isSelectDisabled?: boolean) =>
  makeSxStyles({
    customSelect: (theme) => ({
      color: theme.palette.primary.main,
      fontSize: '20px',
      lineHeight: '28px',
      '&::before': {
        borderBottom: 'none',
        borderBottomStyle: 'none !important',
      },
      '& .MuiSvgIcon-root': {
        color: !isSelectDisabled
          ? theme.palette.primary.main
          : theme.palette.text.disabled,
      },
    }),
  });

export interface ProviderMarket {
  id: string;
  name: string;
}

export interface ProviderMarketsDropdownProps {
  selectedMarketId?: string;
  markets: ProviderMarket[];
  onChange: (marketId: string) => void;
}

export const ProviderMarketsDropdown = ({
  selectedMarketId,
  markets,
  onChange,
}: ProviderMarketsDropdownProps) => {
  const styles = makeStyles();
  const isSelectDisabled = markets.length <= 1;

  return (
    <Select
      data-testid={PROVIDER_MARKETS_DROPDOWN_TEST_IDS.SELECT}
      variant="standard"
      value={selectedMarketId ?? ''}
      sx={styles.customSelect}
      disabled={isSelectDisabled}
    >
      {markets.map(({ id, name }: ProviderMarket) => (
        <MenuItem
          value={id}
          onClick={() => onChange(id)}
          key={id}
          data-testid={PROVIDER_MARKETS_DROPDOWN_TEST_IDS.SELECT_ITEM(id)}
        >
          {name}
        </MenuItem>
      ))}
    </Select>
  );
};
