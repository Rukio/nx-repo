-- +goose Up
-- +goose StatementBegin
INSERT INTO
    service_regions (description, iana_time_zone_name)
VALUES
    ('Atlanta', 'America/New_York'),
    ('Austin', 'America/Chicago'),
    ('Beaumont', 'America/Chicago'),
    ('Billings', 'America/Denver'),
    ('Boise', 'America/Denver'),
    ('Chicago', 'America/Chicago'),
    ('Cincinnati', 'America/New_York'),
    ('Cleveland', 'America/New_York'),
    ('Colorado Springs', 'America/Denver'),
    ('Columbus', 'America/New_York'),
    ('Dallas', 'America/Chicago'),
    ('Daytona Beach', 'America/New_York'),
    ('Denver', 'America/Denver'),
    ('Fort Lauderdale', 'America/New_York'),
    ('Fort Myers', 'America/New_York'),
    ('Fort Worth', 'America/Chicago'),
    ('Hartford', 'America/New_York'),
    ('Houston', 'America/Chicago'),
    ('Indianapolis', 'America/New_York'),
    ('Kansas City', 'America/Chicago'),
    ('Knoxville', 'America/New_York'),
    ('Las Vegas', 'America/Los_Angeles'),
    ('Louisville', 'America/New_York'),
    ('Miami', 'America/New_York'),
    ('Morristown', 'America/New_York'),
    ('Nashville', 'America/Chicago'),
    ('Northern Virginia', 'America/New_York'),
    ('Ocala', 'America/New_York'),
    ('Oklahoma City', 'America/Chicago'),
    ('Olympia', 'America/Los_Angeles'),
    ('Orange County', 'America/Los_Angeles'),
    ('Orlando', 'America/New_York'),
    ('Phoenix', 'America/Phoenix'),
    ('Portland', 'America/Los_Angeles'),
    ('Raleigh-Durham', 'America/New_York'),
    ('Reno', 'America/Los_Angeles'),
    ('Richmond', 'America/New_York'),
    ('Ridgewood', 'America/New_York'),
    ('San Antonio', 'America/Chicago'),
    ('Seattle', 'America/Los_Angeles'),
    ('South Metro Fire Rescue', 'America/Denver'),
    ('Spokane', 'America/Los_Angeles'),
    ('Springfield', 'America/New_York'),
    ('Stevens Point', 'America/Chicago'),
    (
        'TPA COVID Response Team (Metro Fire Rescue)',
        'America/New_York'
    ),
    ('Tacoma', 'America/Los_Angeles'),
    ('Tampa', 'America/New_York'),
    ('Test', 'America/Denver'),
    ('Tucson', 'America/Phoenix'),
    ('West Metro Fire Rescue', 'America/Denver');

WITH market_mappings AS (
    SELECT
        *
    FROM
        (
            VALUES
                (177, 'ATL', 'Atlanta'),
                (202, 'AUS', 'Austin'),
                (215, 'BMT', 'Beaumont'),
                (213, 'BIL', 'Billings'),
                (176, 'BOI', 'Boise'),
                (207, 'CHI', 'Chicago'),
                (206, 'CIN', 'Cincinnati'),
                (190, 'CLE', 'Cleveland'),
                (160, 'COS', 'Colorado Springs'),
                (198, 'COL', 'Columbus'),
                (169, 'DAL', 'Dallas'),
                (197, 'DAB', 'Daytona Beach'),
                (159, 'DEN', 'Denver'),
                (208, 'FTL', 'Fort Lauderdale'),
                (204, 'FTM', 'Fort Myers'),
                (178, 'FTW', 'Fort Worth'),
                (186, 'HRT', 'Hartford'),
                (165, 'HOU', 'Houston'),
                (188, 'IND', 'Indianapolis'),
                (200, 'KSC', 'Kansas City'),
                (192, 'KNX', 'Knoxville'),
                (162, 'LAS', 'Las Vegas'),
                (203, 'LOU', 'Louisville'),
                (193, 'MIA', 'Miami'),
                (185, 'MOR', 'Morristown'),
                (191, 'NSH', 'Nashville'),
                (201, 'NVA', 'Northern Virginia'),
                (199, 'OCL', 'Ocala'),
                (166, 'OKC', 'Oklahoma City'),
                (172, 'OLY', 'Olympia'),
                (212, 'OCC', 'Orange County'),
                (196, 'ORL', 'Orlando'),
                (161, 'PHX', 'Phoenix'),
                (175, 'POR', 'Portland'),
                (189, 'RDU', 'Raleigh-Durham'),
                (179, 'RNO', 'Reno'),
                (164, 'RIC', 'Richmond'),
                (171, 'NJR', 'Ridgewood'),
                (194, 'SAT', 'San Antonio'),
                (174, 'SEA', 'Seattle'),
                (180, 'SMFR', 'South Metro Fire Rescue'),
                (173, 'SPO', 'Spokane'),
                (168, 'SPR', 'Springfield'),
                (220, 'STE', 'Stevens Point'),
                (
                    205,
                    'CRT',
                    'TPA COVID Response Team (Metro Fire Rescue)'
                ),
                (170, 'TAC', 'Tacoma'),
                (214, 'TES', 'Test'),
                (181, 'TPA', 'Tampa'),
                (195, 'TUS', 'Tucson'),
                (167, 'WMFR', 'West Metro Fire Rescue')
        ) AS t(
            station_market_id,
            short_name,
            service_region_description
        )
)
INSERT INTO
    markets (station_market_id, short_name, service_region_id)
SELECT
    market_mappings.station_market_id,
    market_mappings.short_name,
    service_regions.id
FROM
    market_mappings
    JOIN service_regions ON market_mappings.service_region_description = service_regions.description;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    markets;

DELETE FROM
    service_regions;

-- +goose StatementEnd
