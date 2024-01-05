import { useSearchParams } from 'react-router-dom';
import {
  UTM_MEDIUM_KEY,
  UTM_TERM_KEY,
  useChannelItemId,
} from './useChannelItemId';
import { mocked } from 'jest-mock';
import Cookies from 'js-cookie';
import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import {
  CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME,
  ChannelItem,
} from '../../utils/statsig';
import { renderHook } from '../../../testUtils';

const mockedChannelItems: ChannelItem[] = [
  {
    medium: 'organic',
    channel_item_name: 'Google or Other Search',
    channel_item_id: 7,
  },
];

const mockedDefaultChannelItem: ChannelItem = {
  channel_item_name: 'Digital',
  channel_item_id: 21136,
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  getConfig: jest.fn(),
}));

const mockGetConfig = mocked(statsig.getConfig);

const mockUseSearchParams = mocked(useSearchParams);

const validUtmMediumChannelItemId = mockedChannelItems[0].channel_item_id;
const validUtmMedium = mockedChannelItems[0].medium;
const defaultChannelItemId = mockedDefaultChannelItem.channel_item_id;

describe('useChannelItemId', () => {
  it.each([
    {
      description: 'returns utm_term when it is valid',
      utm_term: '123456',
      utm_medium: 'medium1',
      cookieSource: `?${UTM_TERM_KEY}=1234&${UTM_MEDIUM_KEY}=asd`,
      statsigChannelItems: mockedChannelItems,
      statsigDefaultChannelItem: mockedDefaultChannelItem,
      expectedChannelItemId: '123456',
    },
    {
      description: 'returns utm_medium when it is valid',
      utm_term: '',
      utm_medium: validUtmMedium,
      cookieSource: 'invalid',
      statsigChannelItems: mockedChannelItems,
      statsigDefaultChannelItem: mockedDefaultChannelItem,
      expectedChannelItemId: String(validUtmMediumChannelItemId),
    },
    {
      description: 'returns cookie utm_term when it is valid',
      utm_term: '',
      utm_medium: '',
      cookieSource: `?${UTM_TERM_KEY}=1234&${UTM_MEDIUM_KEY}=asd`,
      statsigChannelItems: mockedChannelItems,
      statsigDefaultChannelItem: mockedDefaultChannelItem,
      expectedChannelItemId: '1234',
    },
    {
      description: 'returns cookie utm_medium when it is valid',
      utm_term: '',
      utm_medium: '',
      cookieSource: `?${UTM_TERM_KEY}=asd&${UTM_MEDIUM_KEY}=${validUtmMedium}`,
      statsigChannelItems: mockedChannelItems,
      statsigDefaultChannelItem: mockedDefaultChannelItem,
      expectedChannelItemId: String(validUtmMediumChannelItemId),
    },
    {
      description: 'returns defaultItemId when no valid inputs are found',
      utm_term: 'invalid',
      utm_medium: 'invalid',
      cookieSource: '',
      statsigChannelItems: mockedChannelItems,
      statsigDefaultChannelItem: mockedDefaultChannelItem,
      expectedChannelItemId: String(defaultChannelItemId),
    },
    {
      description:
        'returns defaultItemId when statsig channelItems are empty array',
      utm_term: '',
      utm_medium: String(validUtmMediumChannelItemId),
      cookieSource: 'invalid',
      statsigChannelItems: [],
      statsigDefaultChannelItem: mockedDefaultChannelItem,
      expectedChannelItemId: String(defaultChannelItemId),
    },
    {
      description:
        'returns empty string when statsig defaultchannelItem is null',
      utm_term: '',
      utm_medium: String(validUtmMediumChannelItemId),
      cookieSource: 'invalid',
      statsigChannelItems: [],
      statsigDefaultChannelItem: null,
      expectedChannelItemId: '',
    },
  ])(
    '$description',
    ({
      utm_term,
      utm_medium,
      cookieSource,
      expectedChannelItemId,
      statsigChannelItems,
      statsigDefaultChannelItem,
    }) => {
      mockGetConfig.mockReturnValue(
        new DynamicConfig(
          CHANNEL_ITEM_TO_MEDIUM_MAPPING_CONFIG_NAME,
          {
            channel_items: statsigChannelItems,
            default_channel_item: statsigDefaultChannelItem,
          },
          'ruleId',
          {
            time: 0,
            reason: EvaluationReason.Bootstrap,
          }
        )
      );
      const mockSearchParms = new URLSearchParams(
        `?utm_term=${utm_term}&utm_medium=${utm_medium}`
      );
      mockUseSearchParams.mockReturnValue([mockSearchParms, jest.fn()]);
      Cookies.get = jest.fn().mockImplementation(() => cookieSource);

      const { result } = renderHook(() => useChannelItemId());
      expect(result.current).toEqual(expectedChannelItemId);
    }
  );
});
