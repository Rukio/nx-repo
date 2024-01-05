WITH
-- this applies the given date arguments as filters
date_filter as (
    SELECT
        care_request_id
    FROM
        core.care_request_care_delivery_mart
    WHERE
        complete_datetime_local BETWEEN %(start_date)s AND %(end_date)s

),
-- this filters out the COS pilot
pilot_filter as (
    SELECT
        care_request_id
    FROM
        core.care_request_onboarding_mart
    WHERE
        (created_date <= '2022-05-02'
        OR market_name != 'Colorado Springs')
        AND market_name IS NOT NULL
),
meds AS ( SELECT DISTINCT
    dm.care_request_id,
    pm.medication_id,
    m.hic1_code
FROM
    groom_athena.patient_medications pm
    JOIN stage.medication m ON m.medication_id = pm.medication_id
    JOIN core.care_request_care_delivery_mart dm ON dm.chart_id = pm.chart_id
    JOIN core.care_request_onboarding_mart om ON dm.care_request_id = om.care_request_id
WHERE (om.created_date BETWEEN pm.created_datetime
    AND pm.deactivation_datetime)
    OR(om.created_date > pm.created_datetime
    AND pm.deactivation_datetime IS NULL)
),
hic1 AS (
SELECT
    *
FROM
    meds PIVOT (COUNT(medication_id)
    FOR hic1_code IN('A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'M',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z'))
),
proc AS (
SELECT
    care_request_id,
    chart_id,
    patient_id,
    complete_datetime_local,
    CASE
        WHEN POSITION('96360' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('96361' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('96365' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('96374' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('J7030' IN procedure_codes_aggregated) THEN 1
        ELSE 0
    END AS has_iv,
    CASE
        WHEN POSITION('51701' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('51702' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('51703' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('51705' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('99507' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('A4338' IN procedure_codes_aggregated) THEN 1
        WHEN POSITION('P9612' IN procedure_codes_aggregated) THEN 1
        ELSE 0
    END AS has_catheter,
    SUM(has_iv) OVER (PARTITION BY chart_id ORDER BY complete_datetime_local ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_iv,
    SUM(has_catheter) OVER (PARTITION BY chart_id ORDER BY complete_datetime_local ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_catheter
FROM
    core.care_request_care_delivery_mart
),
rx_admin AS (
SELECT
    care_request_id,
    CASE WHEN is_medication_administered=TRUE THEN 1 ELSE 0 END AS has_rx_admin,
    SUM(has_rx_admin) OVER (PARTITION BY chart_id ORDER BY complete_datetime_local ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_rx_admin,
    CASE
        WHEN chart_id IS NULL
            THEN NULL
        ELSE
            ROW_NUMBER() OVER (PARTITION BY chart_id ORDER BY complete_datetime_local)
    END AS patient_visit_count
FROM
    core.care_request_care_delivery_mart
),
ra AS (
SELECT
    A.care_request_id,
    responses
FROM
    groom_dashboard.risk_assessments A
INNER JOIN (
-- group by care_request_id to get most recent responses for each care request
    SELECT
        care_request_id,
        MAX(created_at) AS created_at
    FROM groom_dashboard.risk_assessments
    GROUP BY
        care_request_id
) B ON A.created_at = B.created_at
    AND A.care_request_id = B.care_request_id
),
final AS (
    SELECT
        om.care_request_id,
        om.created_date,
        mk.market_short_name,
        om.place_of_service,
        om.risk_protocol_standardized,
        om.risk_protocol,
        om.risk_score,
        om.patient_age,
        mh.has_hypertension,
        mh.has_high_cholesterol,
        mh.has_diabetes,
        mh.has_asthma,
        mh.has_copd,
        mh.has_cancer,
        mh.has_coronary_artery_disease,
        mh.has_stroke,
        mh.has_kidney_disease,
        mh.has_depression,
        mh.has_pulmonary_embolism,
        mh.comorbidities_count,
        om.patient_gender,
        om.has_secondary_screening,
        om.high_level_home_health_provider,
        sh.has_advance_directive,
        sh.has_alcohol_use_education,
        sh.has_lacks_transportation,
        sh.has_food_insecurity,
        sh.has_food_insecurity_worry,
        sh.has_activities_daily_living,
        sh.has_fall_risk_unsteady,
        sh.has_fall_risk_worry,
        sh.has_fall_risk_provider,
        sh.has_feels_unsafe,
        sh.has_social_support_taking_advantage,
        sh.has_lacks_social_interactions,
        sh.has_excessive_alcohol_drug_use,
        sh.has_cost_concerns,
        sh.has_housing_insecurity,
        sh.has_resource_help_requested,
        hic1.a AS a_med,
        hic1.b AS b_med,
        hic1.c AS c_med,
        hic1.d AS d_med,
        hic1.f AS f_med,
        hic1.g AS g_med,
        hic1.h AS h_med,
        hic1.j AS j_med,
        hic1.l AS l_med,
        hic1.m AS m_med,
        hic1.n AS n_med,
        hic1.p AS p_med,
        hic1.q AS q_med,
        hic1.r AS r_med,
        hic1.s AS s_med,
        hic1.u AS u_med,
        hic1.v AS v_med,
        hic1.w AS w_med,
        hic1.x AS x_med,
        hic1.y AS y_med,
        hic1.z AS z_med,
        ra.responses,
        proc.prev_iv,
        proc.prev_catheter,
        rx_admin.prev_rx_admin,
        rx_admin.patient_visit_count
    FROM
        core.care_request_onboarding_mart om
    LEFT JOIN
        core.care_request_care_delivery_mart dm ON om.care_request_id = dm.care_request_id
    INNER JOIN
        date_filter on om.care_request_id = date_filter.care_request_id
    INNER JOIN
        pilot_filter on om.care_request_id=pilot_filter.care_request_id
    LEFT JOIN core.patient_past_medical_history mh ON dm.chart_id = mh.chart_id
        AND mh.min_created_datetime < dm.chart_first_closed_datetime
    LEFT JOIN core.patient_social_history sh ON sh.chart_id = dm.chart_id
    LEFT JOIN hic1 ON hic1.care_request_id = om.care_request_id
    LEFT JOIN ra ON ra.care_request_id = om.care_request_id
    LEFT JOIN proc ON proc.care_request_id = om.care_request_id
    LEFT JOIN rx_admin ON om.care_request_id = rx_admin.care_request_id
    LEFT JOIN core.markets mk ON om.market_id = mk.market_id
)
SELECT
    care_request_id,
    created_date,
    market_short_name,
    place_of_service,
    risk_protocol_standardized,
    risk_protocol,
    risk_score,
    patient_age,
    has_hypertension,
    has_high_cholesterol,
    has_diabetes,
    has_asthma,
    has_copd,
    has_cancer,
    has_coronary_artery_disease,
    has_stroke,
    has_kidney_disease,
    has_depression,
    has_pulmonary_embolism,
    comorbidities_count,
    patient_gender,
    has_secondary_screening,
    high_level_home_health_provider,
    has_advance_directive,
    has_alcohol_use_education,
    has_lacks_transportation,
    has_food_insecurity,
    has_food_insecurity_worry,
    has_activities_daily_living,
    has_fall_risk_unsteady,
    has_fall_risk_worry,
    has_fall_risk_provider,
    has_feels_unsafe,
    has_social_support_taking_advantage,
    has_lacks_social_interactions,
    has_excessive_alcohol_drug_use,
    has_cost_concerns,
    has_housing_insecurity,
    has_resource_help_requested,
    a_med,
    b_med,
    c_med,
    d_med,
    f_med,
    g_med,
    h_med,
    j_med,
    l_med,
    m_med,
    n_med,
    p_med,
    q_med,
    r_med,
    s_med,
    u_med,
    v_med,
    w_med,
    x_med,
    y_med,
    z_med,
    responses,
    prev_iv,
    prev_catheter,
    prev_rx_admin,
    patient_visit_count
FROM
    final
;
