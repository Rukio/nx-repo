import { FC, useMemo } from 'react';
import { buildProvidersLeaderHubRanking } from '../../util';
import { LeaderHubRankingProps } from '../../../constants';
import {
  CareTeamRankTable,
  SearchField,
} from '@*company-data-covered*/clinical-kpi/ui';
import { Box } from '@*company-data-covered*/design-system';

const LeaderHubPeerRankingTable: FC<LeaderHubRankingProps> = ({
  metrics,
  isLoading,
  searchText,
  handleSearch,
  onRowClick,
  changeKey,
  type,
  rankKey,
  valueKey,
}) => {
  const { rankTableProviders } = useMemo(
    () =>
      buildProvidersLeaderHubRanking({
        metrics,
        key: valueKey,
        changeKey,
        type,
        rankKey,
      }),
    [metrics, valueKey, changeKey, type, rankKey]
  );

  return (
    <>
      <Box mt={1} mb={3}>
        <SearchField value={searchText} onChange={handleSearch} />
      </Box>
      <CareTeamRankTable
        rows={rankTableProviders}
        type={type}
        isLoading={isLoading}
        onRowClick={onRowClick}
      />
    </>
  );
};

export default LeaderHubPeerRankingTable;
