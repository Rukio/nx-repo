import { useContext } from 'react';
import { SegmentContext } from '../SegmentProvider';

/**
 * useSegment is the hook which returns current instance of Segment analytics.
 *
 * @returns {import('@segment/analytics-next').AnalyticsBrowser}
 *
 * @example
 * ```typescript
 * const Component = () => {
 *  const segment = useSegment()
 *  const onTrackButtonClick = () => segment.track('Button was clicked!')
 *
 *  return (
 *    <button onClick={onTrackButtonClick}>Click me!</button>
 *  )
 * }
 * ```
 */
export const useSegment = () => {
  const segmentAnalytics = useContext(SegmentContext);

  if (!segmentAnalytics) {
    throw new Error(
      'useSegment can be used only in components wrapped with <SegmentProvider />'
    );
  }

  return segmentAnalytics;
};
