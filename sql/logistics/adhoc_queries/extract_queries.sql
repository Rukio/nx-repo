SELECT
    *
FROM
    public.attributes;

SELECT
    *
FROM
    public.distance_sources;

SELECT
    *
FROM
    public.distances
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.locations
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.markets;

SELECT
    *
FROM
    public.optimizer_configs;

SELECT
    *
FROM
    public.optimizer_runs
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.schedule_rest_breaks
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.schedule_routes
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.schedule_stats
WHERE
    id >= 1;

SELECT
    *
FROM
    public.schedule_stops
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.schedule_visits
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.schedules
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.service_region_canonical_location_sets;

SELECT
    *
FROM
    public.service_region_canonical_locations;

SELECT
    *
FROM
    public.service_region_minimal_visit_durations;

SELECT
    *
FROM
    public.service_region_open_hours_schedule_days;

SELECT
    *
FROM
    public.service_region_open_hours_schedules;

SELECT
    *
FROM
    public.service_regions;

SELECT
    *
FROM
    public.shift_team_attributes
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.shift_team_locations
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.shift_team_rest_break_requests;

SELECT
    *
FROM
    public.shift_team_snapshots;

SELECT
    *
FROM
    public.unassigned_schedule_visits;

SELECT
    *
FROM
    public.visit_attributes
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.visit_acuity_snapshots
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.visit_phase_snapshots
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.visit_phase_source_types;

SELECT
    *
FROM
    public.visit_phase_types;

SELECT
    *
FROM
    public.visit_snapshots
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.visit_value_snapshots
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';

SELECT
    *
FROM
    public.virtual_app_visit_phase_snapshots
WHERE
    created_at >= CURRENT_DATE - INTERVAL '1 DAY';
