import { getJestProjects } from '@nx/jest';

export default {
  projects: getJestProjects(),
  testTimeout: 15000, // Increased from 5s to reduce flaky tests
};
