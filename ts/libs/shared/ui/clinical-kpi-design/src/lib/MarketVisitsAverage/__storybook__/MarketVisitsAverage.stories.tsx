import { FC } from 'react';
import { Meta } from '@storybook/react';

import MarketVisitsAverage from '../index';

export default {
  title: 'Components/MarketVisitsAverage',
  component: MarketVisitsAverage,
} as Meta<typeof MarketVisitsAverage>;

export const BasicMarketVisitsAverage: FC = () => (
  <MarketVisitsAverage
    hoursWorked={8}
    userPatientCountAverage={7}
    marketPatientCountAverage={5}
  ></MarketVisitsAverage>
);
