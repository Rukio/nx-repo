export type CARE_MANAGER_PAGES =
  | 'EPISODES_CREATE'
  | 'EPISODES_EDIT'
  | 'EPISODES_HOMEPAGE'
  | 'EPISODES_VISITS'
  | 'TASK_TEMPLATES_LIST'
  | 'TASK_TEMPLATES_CREATE'
  | 'TASK_TEMPLATES_EDIT';

type NavigationProps = {
  location: CARE_MANAGER_PAGES;
  id?: string;
  searchParams?: string;
};

export const navigateTo = ({
  location,
  id,
  searchParams = '',
}: NavigationProps) => {
  switch (location) {
    case 'EPISODES_HOMEPAGE':
      cy.visit('/episodes');
      break;
    case 'EPISODES_EDIT':
      cy.visit(`/episodes/${id}/overview`);
      break;
    case 'EPISODES_VISITS':
      cy.visit(`/episodes/${id}/visits`);
      break;
    case 'TASK_TEMPLATES_LIST':
      cy.visit(`/settings/task-templates${searchParams}`);
      break;
    case 'TASK_TEMPLATES_CREATE':
      cy.visit('/settings/task-templates/new');
      break;
    case 'TASK_TEMPLATES_EDIT':
      cy.visit(`/settings/task-templates/${id}/edit`);
      break;
    default:
      break;
  }
};
