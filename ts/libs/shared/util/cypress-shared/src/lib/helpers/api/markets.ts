import { Markets, SUPPORTED_TEST_MARKETS } from '../../types/api/markets';
import { sendGETRequest } from './request';

// Tests that require assignment must use a unique market or it's possible tests run in parallel will end shifts for the same market
// Below is a breakdown of which market is used by which test group

// TODO in the future to figure how to assign CRs without ending shifts so any test can run against any market
/**
 * @property {object} atlanta - Atlanta market definition. Reserved for createShift.spec.js.
 * @property {object} denver - Denver market definition. Reserved for Onboarding - Integration.
 * @property {object} columbus - Columbus market definition. Reserved for shift.spec.js
 * @property {object} nashville - Nashville market definition. Reserved for scheduling.spec.js.
 * @property {object} lasVegas - Las Vegas market definition. Reserved for Onboarding E2E.
 * @property {object} houston - Houston market definition. Reserved for assignedQueueTodayAccepted.spec.js.
 * @property {object} dallas - Dallas market definition. Reserved for assignedQueueTodayAccepted.spec.js.
 * @property {object} cleveland - Cleveland market definition. Reserved for assignedQueueTodayEnRoute.spec.js.
 * @property {object} olympia - Olympia market definition. Reserved for assignedQueueTodayOnScene.spec.js
 * @property {object} pheonix - Pheonix market definition. Reserved for assignedQueueTomorrow.spec.js.
 * @property {object} tucson - Tucson market definition. Reserved for assignedQueueTomorrow.spec.js.
 * @property {object} tacoma - Tacoma market definition. Reserved for assignedQueueTodayCommitted.spec.js.
 * @property {object} northernVirginia - North Virginia market definition. Reserved for telepresentationQueueToday.spec.js
 * @property {object} richmond - Richmond market definition. Reserved for telepresentationQueueToday.spec.js.
 * @property {object} portland - Portland market definition. Reserved for companion repo.
 * @property {object} tampa - Tampa market definition. Reserved for onboarding-web repo.
 * @property {object} miami - Knoxville market definition. Reserved for onboarding-web repo.
 * @property {object} daytonaBeach - Knoxville market definition. Reserved for Care Manager Repo.
 * @property {object} sanAntonio - San Antonio market definition. Reserved for Telepresentation LV1.


 */
const MARKETS: Record<SUPPORTED_TEST_MARKETS, Markets.MarketBody> = {
  // Onboarding - Integration
  denver: {
    id: 159,
    name: 'Denver',
    shortName: 'DEN',
    fullState: 'Colorado',
    timeZoneCity: 'Denver',
    careRequestAddress: {
      streetAddress1: '3827 N Lafayette St',
      streetAddress2: 'Unit 1',
      city: 'Denver',
      state: 'CO',
      zipCode: '80205-3339',
      latitude: '39.7705577',
      longitude: '-104.9694149',
    },
  },
  // createShift.spec.js
  atlanta: {
    id: 177,
    name: 'Atlanta',
    shortName: 'ATL',
    fullState: 'Georgia',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '5563 Trinity Ave',
      streetAddress2: '',
      city: 'Atlanta',
      state: 'GA',
      zipCode: '30303',
      latitude: '33.7483678',
      longitude: '-84.3907138',
    },
  },
  // shift.spec.js
  columbus: {
    id: 198,
    name: 'Columbus',
    shortName: 'COL',
    fullState: 'Ohio',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '281 W Lane Ave',
      streetAddress2: 'Unit 1',
      city: 'Columbus',
      state: 'OH',
      zipCode: '43210-1132',
      latitude: '40.0064231',
      longitude: '-83.0307028',
    },
  },
  // scheduling.spec.js
  nashville: {
    id: 191,
    name: 'Nashville',
    shortName: 'NSH',
    fullState: 'Tennessee',
    timeZoneCity: 'Chicago',
    careRequestAddress: {
      streetAddress1: '2500 West End Ave',
      streetAddress2: 'Unit 1',
      city: 'Nashville',
      state: 'TN',
      zipCode: '37232-0030',
      latitude: '36.1554939',
      longitude: '-86.8351387',
    },
  },
  // Onboarding - End to End
  lasVegas: {
    id: 162,
    name: 'Las Vegas',
    shortName: 'LAS',
    fullState: 'Nevada',
    timeZoneCity: 'Los_Angeles',
    careRequestAddress: {
      streetAddress1: '2880 S Las Vegas Blvd',
      streetAddress2: 'Unit 1',
      city: 'Las Vegas',
      state: 'NV',
      zipCode: '89109-1138',
      latitude: '36.1380849',
      longitude: '-115.161882',
    },
  },
  // assignedQueueTodayAccepted.spec.js
  houston: {
    id: 165,
    name: 'Houston',
    shortName: 'HOU',
    fullState: 'Texas',
    timeZoneCity: 'Los_Angeles',
    careRequestAddress: {
      streetAddress1: '5656 Kelley St',
      streetAddress2: 'Unit 1',
      city: 'Houston',
      state: 'TX',
      zipCode: '77026-1966',
      latitude: '29.8154603',
      longitude: '-95.3100882',
    },
  },
  // assignedQueueTodayAccepted.spec.js
  dallas: {
    id: 169,
    name: 'Dallas',
    shortName: 'DAL',
    fullState: 'Texas',
    timeZoneCity: 'Los_Angeles',
    careRequestAddress: {
      streetAddress1: '6201 Harry Hines Blvd',
      streetAddress2: 'Unit 1',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75235',
      latitude: '32.8145023',
      longitude: '-96.83749222',
    },
  },
  // assignedQueueTodayEnRoute.spec.js
  cleveland: {
    id: 190,
    name: 'Cleveland',
    shortName: 'CLE',
    fullState: 'Ohio',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '18101 Lorain Ave',
      streetAddress2: 'Unit 1',
      city: 'Cleveland',
      state: 'OH',
      zipCode: '441111',
      latitude: '41.451988',
      longitude: '-81.83358',
    },
  },
  // assignedQueueTodayOnScene.spec.js
  seattle: {
    id: 174,
    name: 'Seattle',
    shortName: 'SEA',
    fullState: 'Washington',
    timeZoneCity: 'Los_Angeles',
    careRequestAddress: {
      streetAddress1: '1124 Pike St',
      streetAddress2: 'Unit 1',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101-1924',
      latitude: '47.6142962',
      longitude: '-122.325185',
    },
  },
  // assignedQueueTodayOnScene.spec.js
  olympia: {
    id: 172,
    name: 'Olympia',
    shortName: 'OLY',
    fullState: 'Washington',
    timeZoneCity: 'Los_Angeles',
    careRequestAddress: {
      streetAddress1: '413 Lilly Rd NE',
      streetAddress2: 'Unit 1',
      city: 'Olympia',
      state: 'WA',
      zipCode: '98506-5133',
      latitude: '47.0532887',
      longitude: '-122.843936',
    },
  },
  // assignedQueueTomorrow.spec.js
  phoenix: {
    id: 161,
    name: 'Phoenix',
    shortName: 'PHX',
    fullState: 'Arizona',
    timeZoneCity: 'Phoenix',
    careRequestAddress: {
      streetAddress1: '455 N Galvin Pkwy',
      streetAddress2: 'Unit 1',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85008-3431',
      latitude: '33.453975',
      longitude: '-111.940692',
    },
  },
  // assignedQueueTomorrow.spec.js
  tucson: {
    id: 195,
    name: 'Tucson',
    shortName: 'TUS',
    fullState: 'Arizona',
    timeZoneCity: 'Phoenix',
    careRequestAddress: {
      streetAddress1: '2405 W Wetmore Rd',
      streetAddress2: 'Unit 1',
      city: 'Tucson',
      state: 'AZ',
      zipCode: '85705-2018',
      latitude: '32.28999382',
      longitude: '-111.008519',
    },
  },
  // assignedQueueTodayCommitted.spec.js
  tacoma: {
    id: 172,
    name: 'Tacoma',
    shortName: 'TAC',
    fullState: 'Washington',
    timeZoneCity: 'Los_Angeles',
    careRequestAddress: {
      streetAddress1: '5400 N Pearl St',
      streetAddress2: '',
      city: 'Tacoma',
      state: 'WA',
      zipCode: '98407',
      latitude: '47.2955786',
      longitude: '-122.5417301',
    },
  },
  // inQueue.spec.js
  knoxville: {
    id: 192,
    name: 'Knoxville',
    shortName: 'KNX',
    fullState: 'Tennessee',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '1050 Worlds Fair Park Dr',
      streetAddress2: 'Unit 1',
      city: 'Knoxville',
      state: 'TN',
      zipCode: '37916',
      latitude: '35.96531845439281',
      longitude: '-83.92542379945596',
    },
  },
  // telepresentationQueueToday.spec.js
  northernVirginia: {
    id: 201,
    name: 'Northern Virginia',
    shortName: 'NVA',
    fullState: 'Virginia',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '7535 Little River Turnpike',
      streetAddress2: 'Fairfax County',
      city: 'Annandale',
      state: 'VA',
      zipCode: '22003',
      latitude: '38.88242',
      longitude: '-77.63278',
    },
  },
  // telepresentationQueueToday.spec.js
  richmond: {
    id: 164,
    name: 'Richmond',
    shortName: 'RIC',
    fullState: 'Virginia',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '200 North Arthur Ashe Boulevard',
      streetAddress2: 'Unit 1',
      city: 'Richmond',
      state: 'VA',
      zipCode: '23220',
      latitude: '37.52142',
      longitude: '-77.59632',
    },
  },
  // companion repo
  portland: {
    id: 175,
    name: 'Portland',
    shortName: 'POR',
    fullState: 'Oregon',
    timeZoneCity: 'Los_Angeles',
    careRequestAddress: {
      streetAddress1: '4001 SW Canyon Rd',
      streetAddress2: 'Unit 1',
      city: 'Portland',
      state: 'OR',
      zipCode: '97221',
      latitude: '45.51269',
      longitude: '-122.70980',
    },
  },
  // onboarding-web repo
  tampa: {
    id: 181,
    name: 'Tampa',
    shortName: 'TPA',
    fullState: 'Florida',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '1701 N Highland Ave',
      streetAddress2: 'Unit 1',
      city: 'Tampa',
      state: 'FL',
      zipCode: '33602',
      latitude: '27.96222',
      longitude: '-82.46219',
    },
  },
  // onboarding-web repo
  miami: {
    id: 193,
    name: 'Miami',
    shortName: 'MIA',
    fullState: 'Florida',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '1550 NW 37th Ave',
      streetAddress2: 'Unit 1',
      city: 'Miami',
      state: 'FL',
      zipCode: '33125',
      latitude: '25.792201',
      longitude: '-80.250192',
    },
  },
  // Care Manager repo
  daytonaBeach: {
    id: 197,
    name: 'Daytona Beach',
    shortName: 'DAB',
    fullState: 'Florida',
    timeZoneCity: 'New_York',
    careRequestAddress: {
      streetAddress1: '299 Bill France Blvd',
      streetAddress2: '',
      city: 'Daytona Beach',
      state: 'FL',
      zipCode: '32114',
      latitude: '29.1976886,',
      longitude: '-81.0689434',
    },
  },
  // Telepresentation LV1
  sanAntonio: {
    id: 194,
    name: 'San Antonio',
    shortName: 'SAT',
    fullState: 'Texas',
    timeZoneCity: 'Chicago',
    careRequestAddress: {
      streetAddress1: '126 Main Plaza',
      streetAddress2: '',
      city: 'San Antonio',
      state: 'TX',
      zipCode: '78205',
      latitude: '29.423949',
      longitude: '-98.4933404',
    },
  },
};

function getMarketAdminPage(id: string) {
  return sendGETRequest({
    url: `/admin/markets/${id}/edit`,
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    },
    form: true,
  });
}

export { MARKETS, getMarketAdminPage };
