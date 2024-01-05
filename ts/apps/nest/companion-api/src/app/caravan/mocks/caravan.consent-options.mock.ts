import { CaravanConsentOptions } from '../types/caravan.consent-options';

export function buildMockCaravanConsentOptions(
  init: Partial<CaravanConsentOptions> = {}
): CaravanConsentOptions {
  return {
    signers: [
      {
        order: 1,
        name: 'Patient',
        id: 1,
      },
      {
        order: 2,
        name: 'MPOA',
        id: 2,
      },
      {
        order: 3,
        name: 'Legal Guardian',
        id: 3,
      },
      {
        order: 4,
        name: 'Someone Else',
        id: 4,
      },
    ],
    languages: [
      {
        order: 1,
        name: 'English',
        id: 1,
      },
      {
        order: 2,
        name: 'Spanish',
        id: 2,
      },
    ],
    frequencies: [
      {
        order: 1,
        name: 'First Visit For Patient',
        id: 1,
      },
      {
        order: 2,
        name: 'Every Visit For Patient',
        id: 2,
      },
      {
        order: 3,
        name: 'First Visit For Patient Within That Service Line',
        id: 3,
      },
      {
        order: 4,
        name: 'First Visit For Patient Within A Care Episode',
        id: 4,
      },
    ],
    categories: [
      {
        required: true,
        order: 1,
        name: 'Consent to Treat',
        id: 1,
      },
      {
        required: true,
        order: 2,
        name: 'HIPAA Notice of Privacy Practices',
        id: 2,
      },
      {
        required: false,
        order: 3,
        name: 'Service Line Specific',
        id: 3,
      },
      {
        required: false,
        order: 4,
        name: 'State Required',
        id: 4,
      },
      {
        required: false,
        order: 5,
        name: 'Patient Operations',
        id: 5,
      },
      {
        required: false,
        order: 6,
        name: 'Patient Communication',
        id: 6,
      },
    ],
    capture_methods: [
      {
        order: 1,
        name: 'Digital',
        id: 1,
      },
      {
        order: 2,
        name: 'Print',
        id: 2,
      },
      {
        order: 3,
        name: 'Digital or Print',
        id: 3,
      },
    ],
    ...init,
  };
}
