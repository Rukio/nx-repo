-- +goose Up
-- +goose StatementBegin
WITH market_visit_durations AS (
    SELECT
        market_id,
        service_duration_min_sec,
        service_duration_max_sec
    FROM
        (
            VALUES
                (159, 1614, 3780),
                (160, 1558, 3504),
                (161, 1740, 3942),
                (162, 1404, 3024),
                (164, 1434, 3306),
                (165, 1866, 4128),
                (166, 1558, 3504),
                (167, 1558, 3504),
                (168, 1884, 3714),
                (169, 1542, 3510),
                (170, 1176, 3384),
                (171, 1770, 3732),
                (172, 2040, 3942),
                (173, 1380, 3138),
                (174, 1956, 4002),
                (175, 2184, 4584),
                (176, 1074, 2616),
                (177, 1548, 3576),
                (178, 1218, 2922),
                (179, 1558, 3504),
                (180, 1558, 3504),
                (181, 1146, 3408),
                (185, 1746, 3402),
                (186, 1558, 3504),
                (188, 1558, 3504),
                (189, 1428, 3078),
                (190, 1416, 3276),
                (191, 1722, 4074),
                (192, 1356, 3690),
                (193, 1446, 3126),
                (194, 1338, 3252),
                (195, 1554, 3264),
                (196, 1782, 4044),
                (197, 1758, 3630),
                (198, 1020, 2616),
                (199, 1416, 3216),
                (200, 2304, 4578),
                (201, 1752, 3768),
                (202, 1558, 3504),
                (203, 1558, 3504),
                (204, 1536, 3222),
                (205, 1558, 3504),
                (206, 1350, 2850),
                (207, 1440, 3414),
                (208, 1596, 3762),
                (212, 1608, 3300),
                (213, 1032, 2634),
                (214, 1558, 3504),
                (215, 2304, 4104),
                (216, 1644, 4338),
                (217, 1164, 3426),
                (219, 2148, 4362),
                (220, 1272, 2742),
                (221, 1338, 3060),
                (222, 1392, 2982),
                (223, 1692, 3558),
                (224, 1272, 3072),
                (225, 1440, 4128),
                (1226, 1558, 3504)
        ) AS t(
            market_id,
            service_duration_min_sec,
            service_duration_max_sec
        )
)
INSERT INTO
    service_region_canonical_visit_durations(
        service_region_id,
        service_duration_min_sec,
        service_duration_max_sec
    )
SELECT
    markets.service_region_id AS service_region_id,
    market_visit_durations.service_duration_min_sec AS service_duration_min_sec,
    market_visit_durations.service_duration_max_sec AS service_duration_max_sec
FROM
    market_visit_durations
    JOIN markets ON markets.station_market_id = market_visit_durations.market_id;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DELETE FROM
    service_region_canonical_visit_durations;

-- +goose StatementEnd
