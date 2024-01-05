import { FC } from 'react';

import { Meta } from '@storybook/react';
import LatestShiftTrendChart, { LineChartData } from '../index';

const chartData: LineChartData[] = [
  {
    date: '12 Feb',
    providerSeen: 5,
    marketAverage: 6,
  },
  {
    date: '13 Feb',
    providerSeen: 4,
    marketAverage: 5,
  },
  {
    date: '14 Feb',
    providerSeen: 7,
    marketAverage: 8,
  },
  {
    date: '15 Feb',
    providerSeen: 1,
    marketAverage: 3,
  },
  {
    date: '16 Feb',
    providerSeen: 3,
    marketAverage: 5,
  },
  {
    date: '17 Feb',
    providerSeen: 2,
    marketAverage: 4,
  },
  {
    date: '18 Feb',
    providerSeen: 7,
    marketAverage: 9,
  },
];

export default {
  title: 'Components/LatestShiftTrendChart',
  component: LatestShiftTrendChart,
} as Meta<typeof LatestShiftTrendChart>;

export const BasicLatestShiftTrendChart: FC = () => (
  <LatestShiftTrendChart chartData={chartData} />
);
