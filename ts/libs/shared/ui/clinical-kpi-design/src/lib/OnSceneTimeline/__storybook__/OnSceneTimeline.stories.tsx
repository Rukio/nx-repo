import { FC } from 'react';
import { Meta } from '@storybook/react';

import OnSceneTimeLine, { OnSceneTimeLineEvent, Event } from '../index';

export default {
  title: 'Components/OnSceneTimeLine',
  component: OnSceneTimeLine,
} as Meta<typeof OnSceneTimeLine>;

const timelineData: OnSceneTimeLineEvent[] = [
  {
    type: Event.EnRoute,
    startTime: '2023-05-23T10:00:00',
    endTime: '2023-05-23T10:40:00',
  },
  {
    type: Event.OnScene,
    startTime: '2023-05-23T10:40:00',
    endTime: '2023-05-23T12:20:00',
  },
  {
    type: Event.Idle,
    startTime: '2023-05-23T12:20:00',
    endTime: '2023-05-23T12:40:00',
  },
  {
    type: Event.EnRoute,
    startTime: '2023-05-23T12:40:00',
    endTime: '2023-05-23T13:00:00',
  },
  {
    type: Event.Idle,
    startTime: '2023-05-23T13:00:00',
    endTime: '2023-05-23T13:05:00',
  },
  {
    type: Event.OnScene,
    startTime: '2023-05-23T13:05:00',
    endTime: '2023-05-23T14:00:00',
  },
  {
    type: Event.OnScene,
    startTime: '2023-05-23T14:00:00',
    endTime: '2023-05-23T14:30:00',
  },
  {
    type: Event.Break,
    startTime: '2023-05-23T14:30:00',
    endTime: '2023-05-23T15:00:00',
  },
  {
    type: Event.Idle,
    startTime: '2023-05-23T15:00:00',
    endTime: '2023-05-23T15:10:00',
  },
  {
    type: Event.EnRoute,
    startTime: '2023-05-23T15:10:00',
    endTime: '2023-05-23T15:40:00',
  },
  {
    type: Event.OnScene,
    startTime: '2023-05-23T15:40:00',
    endTime: '2023-05-23T16:00:00',
  },
  {
    type: Event.Idle,
    startTime: '2023-05-23T16:00:00',
    endTime: '2023-05-23T16:15:00',
  },
  {
    type: Event.EnRoute,
    startTime: '2023-05-23T16:15:00',
    endTime: '2023-05-23T17:00:00',
  },
  {
    type: Event.OnScene,
    startTime: '2023-05-23T17:00:00',
    endTime: '2023-05-23T18:45:00',
  },
  {
    type: Event.Idle,
    startTime: '2023-05-23T18:45:00',
    endTime: '2023-05-23T19:00:00',
  },
];

export const BasicOnSceneTimeLine: FC = () => (
  <OnSceneTimeLine events={timelineData}></OnSceneTimeLine>
);
