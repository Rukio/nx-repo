import React, { FC } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Dot,
  Label,
  ResponsiveContainer,
} from 'recharts';

import { useTheme } from '@*company-data-covered*/design-system';

export interface LineChartData {
  date: string;
  providerSeen: number;
  marketAverage: number;
}

interface LatestShiftTrendChartProps {
  chartData: LineChartData[];
}

const tickStyle: React.CSSProperties = {
  fontFamily: 'Open Sans',
  fontWeight: 400,
  fontSize: '12px',
  lineHeight: '16px',
  letterSpacing: '0.4px',
  color: '#9AA3A9',
};
const labelStyle: React.CSSProperties = {
  fontFamily: 'Open Sans',
  fontWeight: 600,
  fontSize: '10px',
  lineHeight: '14px',
  letterSpacing: '0.4px',
  textAnchor: 'end',
  color: '#9AA3A9',
};

const LatestShiftTrendChart: FC<LatestShiftTrendChartProps> = ({
  chartData,
}) => {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 30, left: 60 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" strokeOpacity={0} interval={0} style={tickStyle}>
          <Label
            value="Shifts"
            position="left"
            dy={-2.5}
            dx={-25}
            style={labelStyle}
          />
        </XAxis>
        <YAxis orientation="right" strokeOpacity={0} dy={-5} style={tickStyle}>
          <Label
            value="Patient Visits"
            position="top"
            dy={-15}
            dx={-8}
            style={labelStyle}
          />
        </YAxis>
        <Tooltip />
        <Legend align="left" />
        <Line
          type="monotone"
          dataKey="marketAverage"
          name="Market"
          stroke={theme.palette.secondary.dark}
          strokeDasharray="8 8"
          strokeWidth="2"
          dot={<Dot fill={theme.palette.secondary.dark} r={4} />}
          legendType="circle"
        />
        <Line
          type="monotone"
          dataKey="providerSeen"
          name="You"
          stroke={theme.palette.info.light}
          strokeWidth="2"
          dot={<Dot fill={theme.palette.info.light} r={4} />}
          legendType="circle"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LatestShiftTrendChart;
