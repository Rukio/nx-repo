import { VisitListElement } from '@*company-data-covered*/caremanager/data-access-types';

const sortByETAAscending = (a: VisitListElement, b: VisitListElement) => {
  const firstDate = a.eta ? new Date(a.eta) : new Date(0);
  const secondDate = b.eta ? new Date(b.eta) : new Date(0);

  return -secondDate.getTime() + firstDate.getTime();
};

const sortByCreatedAtAscending = (a: VisitListElement, b: VisitListElement) => {
  const firstDate = new Date(a.createdAt);
  const secondDate = new Date(b.createdAt);

  return firstDate.getTime() - secondDate.getTime();
};

const sortByUpdatedStatusAtOrCreatedAtAscending = (
  a: VisitListElement,
  b: VisitListElement
) => {
  const firstDate = a.statusUpdatedAt
    ? new Date(a.statusUpdatedAt)
    : new Date(a.createdAt);
  const secondDate = b.statusUpdatedAt
    ? new Date(b.statusUpdatedAt)
    : new Date(b.createdAt);

  return firstDate.getTime() - secondDate.getTime();
};

const sortByETAorUpdateStatusAtIfOnSceneAscending = (
  a: VisitListElement,
  b: VisitListElement
) => {
  let firstDate = a.eta ? new Date(a.eta) : new Date(0);
  let secondDate = b.eta ? new Date(b.eta) : new Date(0);

  if (a.status === 'on_scene' && a.statusUpdatedAt) {
    firstDate = new Date(a.statusUpdatedAt);
  }

  if (b.status === 'on_scene' && b.statusUpdatedAt) {
    secondDate = new Date(b.statusUpdatedAt);
  }

  return firstDate.getTime() - secondDate.getTime();
};

export const sortUpcomingVisits = (
  upcomingVisits: VisitListElement[]
): VisitListElement[] => {
  const visitsWithETA = upcomingVisits
    .filter((visit) => visit.eta !== undefined)
    .sort(sortByETAAscending);
  const visitsWithoutETA = upcomingVisits
    .filter((visit) => visit.eta === undefined)
    .sort(sortByCreatedAtAscending);

  return visitsWithETA.concat(visitsWithoutETA);
};

export const sortPastVisits = (
  pastVisits: VisitListElement[]
): VisitListElement[] => {
  return [...pastVisits].sort(sortByUpdatedStatusAtOrCreatedAtAscending);
};

export const sortActiveVisits = (
  activeVisits: VisitListElement[]
): VisitListElement[] => {
  const visitsWithoutETAorNotOnScene = activeVisits
    .filter((visit) => visit.eta === undefined && visit.status !== 'on_scene')
    .sort(sortByCreatedAtAscending);
  const visitWithETAorOnScene = activeVisits
    .filter((visit) => visit.eta !== undefined || visit.status === 'on_scene')
    .sort(sortByETAorUpdateStatusAtIfOnSceneAscending);

  return visitWithETAorOnScene.concat(visitsWithoutETAorNotOnScene);
};
