import { FC, ReactElement, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  useCacheSelfScheduleDataMutation,
  selectManageSelfScheduleLoadingState,
  useGetCachedSelfScheduleDataQuery,
  selectIsPreLoginDataEmpty,
  selectPreLoginData,
  persistor,
  selectCachedSelfScheduleData,
  selectPreLoginChannelItemId,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { CircularProgress, makeSxStyles } from '@*company-data-covered*/design-system';
import { CACHE_MANAGER_TEST_IDS } from './testIds';

export type CacheManagerProps = {
  children: ReactElement;
};

const makeStyles = () =>
  makeSxStyles({
    loaderRoot: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
  });

export const CacheManager: FC<CacheManagerProps> = ({ children }) => {
  const styles = makeStyles();

  const [cacheSelfScheduleData] = useCacheSelfScheduleDataMutation();

  const { isSuccess: isSelfScheduledDataCachedSuccessfully } = useSelector(
    selectManageSelfScheduleLoadingState
  );
  const preLoginChannelItemId = useSelector(selectPreLoginChannelItemId);

  useGetCachedSelfScheduleDataQuery();

  const { isSuccess: isGetCachedSelfScheduleDataSuccess } = useSelector(
    selectCachedSelfScheduleData()
  );

  const isPreLoginDataEmpty = useSelector(selectIsPreLoginDataEmpty);

  const {
    requester: preLoginRequester,
    preferredEtaRange: preLoginPreferredEtaRange,
  } = useSelector(selectPreLoginData);

  useEffect(() => {
    if (!isPreLoginDataEmpty) {
      cacheSelfScheduleData({
        requester: {
          relationToPatient: preLoginRequester.relationToPatient,
        },
        symptoms: preLoginRequester.symptoms,
        preferredEta: {
          patientPreferredEtaStart: preLoginPreferredEtaRange.startsAt,
          patientPreferredEtaEnd: preLoginPreferredEtaRange.endsAt,
        },
        channelItemId: preLoginChannelItemId,
      });
    }
  }, [
    isPreLoginDataEmpty,
    cacheSelfScheduleData,
    preLoginPreferredEtaRange,
    preLoginRequester.relationToPatient,
    preLoginRequester.symptoms,
    preLoginChannelItemId,
  ]);

  useEffect(() => {
    if (isSelfScheduledDataCachedSuccessfully) {
      persistor.purge();
    }
  }, [isSelfScheduledDataCachedSuccessfully]);

  if (!isGetCachedSelfScheduleDataSuccess) {
    return (
      <CircularProgress
        sx={styles.loaderRoot}
        size={80}
        data-testid={CACHE_MANAGER_TEST_IDS.LOADER}
      />
    );
  }

  return children;
};
