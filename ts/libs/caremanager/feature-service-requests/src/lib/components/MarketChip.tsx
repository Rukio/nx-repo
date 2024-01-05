import { useGetMarkets } from '@*company-data-covered*/caremanager/data-access';
import { Chip, SxProps, Theme } from '@*company-data-covered*/design-system';
import { formatInTimeZone } from 'date-fns-tz';
import { useMemo } from 'react';

const getTimeZoneAbbreviation = (timeZone: string) => {
  try {
    return formatInTimeZone(new Date(), timeZone, 'zzz');
  } catch {
    return;
  }
};

type Props = {
  marketId?: string;
  sx?: SxProps<Theme>;
};

export const MarketChip: React.FC<Props> = ({ marketId, sx }) => {
  const { getMarket, result } = useGetMarkets();
  const market = getMarket(marketId);

  const marketText = useMemo(() => {
    if (!market) {
      return 'Unknown market';
    }

    const timeZoneAbbreviation = getTimeZoneAbbreviation(market.tzName);
    if (timeZoneAbbreviation) {
      return `${market.shortName} (${timeZoneAbbreviation})`;
    }

    return market.shortName;
  }, [market]);

  if (result.isLoading) {
    return null;
  }

  return <Chip sx={sx} label={marketText} variant="outlined" />;
};
