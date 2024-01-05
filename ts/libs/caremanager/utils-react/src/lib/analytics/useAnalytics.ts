import { useCallback, useContext } from 'react';
import { EventProperties, UserTraits } from '@segment/analytics-next';
import { AnalyticsContext } from './analyticsContext';
import { PreviousPageContext } from './previousPageContext';

export const TRACK_CREATE_EPISODE = 'cm_create_episode';
export const TRACK_CREATE_NOTE = 'cm_compose_note';
export const TRACK_UPDATE_PATIENT = 'cm_edit_patient_details';
export const TRACK_UPDATE_VISIT_DETAILS = 'cm_edit_visit_details';
export const TRACK_UPDATE_VISIT_SUMMARY = 'cm_edit_visit_summary';
export const TRACK_UPDATE_VISIT_STATUS = 'cm_edit_visit_status';
export const VISIT_EPISODE_OVERVIEW = 'cm_view_episode';
export const VISIT_EPISODE_LIST = 'cm_view_episodes_landing_page';
export const VISIT_VISIT_SUMMARY = 'cm_view_visit_summary';
export const VISIT_EPISODE_VISITS = 'cm_view_visit';

export const useAnalytics = () => {
  const route = useContext(PreviousPageContext);
  const { analytics } = useContext(AnalyticsContext);

  const trackPageViewed = useCallback(
    (name: string) => {
      analytics
        .page(
          {
            category: 'Care Manager Client',
            prevLocation: route.from,
          },
          name
        )
        .catch((err) => {
          console.error('Segment page viewed errored:', err);
        });
    },
    [analytics, route.from]
  );

  const trackEvent = useCallback(
    (eventName: string, properties?: EventProperties) => {
      analytics.track(eventName, properties).catch((err) => {
        console.error('Segment track event errored:', err);
      });
    },
    [analytics]
  );

  const identifyUser = useCallback(
    (id: string, traits?: UserTraits) => {
      analytics
        .identify(
          {
            id,
          },
          traits
        )
        .catch((err) => {
          console.error('Segment id user errored:', err);
        });
    },
    [analytics]
  );

  return {
    trackPageViewed,
    trackEvent,
    identifyUser,
  };
};
