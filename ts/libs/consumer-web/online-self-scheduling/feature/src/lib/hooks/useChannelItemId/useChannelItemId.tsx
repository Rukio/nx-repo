import { useSearchParams } from 'react-router-dom';
import {
  ChannelItem,
  getChannelItems,
  getDefaultChannelItem,
} from '../../utils/statsig';
import cookie from 'js-cookie';
import { useMemo } from 'react';

export const UTM_TERM_KEY = 'utm_term';
export const UTM_MEDIUM_KEY = 'utm_medium';

const UP_TO_SIX_DIGITS_REGEXP = /^\d{1,6}$/;

const isUtmTermValid = (term: string): boolean =>
  UP_TO_SIX_DIGITS_REGEXP.test(term);

const getUtmMediumChannelItemId = (
  utmMedium: string,
  channelItems: ChannelItem[]
): number | null => {
  const utmMediumChannelItem = channelItems.find(
    (channelItem) => channelItem.medium === utmMedium
  );

  return utmMediumChannelItem?.channel_item_id || null;
};

// Reusable function to validate UTM and get channelItemId
const getValidChannelItemId = (
  utmTerm: string,
  utmMedium: string,
  channelItems: ChannelItem[]
): string => {
  if (isUtmTermValid(utmTerm)) {
    return utmTerm;
  }

  const utmMediumChannelItemId = getUtmMediumChannelItemId(
    utmMedium,
    channelItems
  );

  if (utmMediumChannelItemId) {
    return String(utmMediumChannelItemId);
  }

  return '';
};

export const useChannelItemId = () => {
  const [queryParams] = useSearchParams();
  const queryUtmTerm = queryParams.get(UTM_TERM_KEY) || '';
  const queryUtmMedium = queryParams.get(UTM_MEDIUM_KEY) || '';

  const cookieSource = cookie.get('source');
  const channelItems = getChannelItems();
  const defaultChannelItem = getDefaultChannelItem();
  const defaultChannelItemId =
    defaultChannelItem?.channel_item_id?.toString() || '';

  const memoizedChannelItemId = useMemo(() => {
    // Validate utm_term and utm_medium from current URL
    const validChannelItemId = getValidChannelItemId(
      queryUtmTerm,
      queryUtmMedium,
      channelItems
    );

    // Validate utm_term and utm_medium from cookie source if available
    if (cookieSource) {
      const queryParams = new URLSearchParams(cookieSource);
      const sourceUtmTerm = queryParams.get(UTM_TERM_KEY) || '';
      const sourceUtmMedium = queryParams.get(UTM_MEDIUM_KEY) || '';

      const cookieChannelItemId = getValidChannelItemId(
        sourceUtmTerm,
        sourceUtmMedium,
        channelItems
      );

      // If validChannelItemId from URL or cookie is empty, return defaultChannelItemId
      if (!validChannelItemId && !cookieChannelItemId) {
        return defaultChannelItemId;
      }

      // Return validChannelItemId from URL or cookie if available
      return validChannelItemId || cookieChannelItemId;
    }

    // If neither the current URL nor the cookie source have valid utm_term or utm_medium, return defaultChannelItemId
    return validChannelItemId || defaultChannelItemId;
  }, [
    queryUtmTerm,
    queryUtmMedium,
    cookieSource,
    channelItems,
    defaultChannelItemId,
  ]);

  return memoizedChannelItemId;
};
