
WITH
-- Get data about how often the patient has been seen previously
-- and previous stop times

chart AS (
	SELECT
		ml.care_request_id,
		dm.chart_id,
		ml.complete_datetime,
		ml.stop_time_per_care_request,
		dm.is_tele_presentation_visit,
		dm.complete_datetime_local,
		dm.is_first_cr,
		dm.is_last_cr,
		dm.has_next_cr_assigned
	FROM
		stage.ml_os_care_requests ml
		JOIN core.care_request_care_delivery_mart dm ON dm.care_request_id = ml.care_request_id
	WHERE
		stop_time_per_care_request IS NOT NULL
),
prev_st AS (
	SELECT
		chart.*,
		ROW_NUMBER() OVER (PARTITION BY chart_id ORDER BY complete_datetime) AS patient_visit_count,
		SUM(stop_time_per_care_request) OVER (PARTITION BY chart_id ORDER BY complete_datetime ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) / (patient_visit_count - 1) AS avg_prev_stop_time,
	LAG(stop_time_per_care_request) OVER (PARTITION BY chart_id ORDER BY complete_datetime) AS prev_stop_time
FROM
	chart
),
-- Get information about how many medications from each hic1 code a patient
-- is taking at the time of the care request
meds AS ( SELECT DISTINCT
	dm.care_request_id,
	pm.medication_id,
	m.hic1_code
FROM
	groom_athena.patient_medication pm
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
members AS (
SELECT
		*,
		DATEDIFF(MONTH,
			user_created_at::date,
			complete_datetime::date) AS months_since_hired
	FROM (
		SELECT
			ml.shift_team_id,
			ml.care_request_id,
			ml.complete_datetime,
			MAX(b.user_created_at) AS user_created_at,
			a.user_id,
			MAX(a.first_name) AS first_name,
			MAX(a.last_name) AS last_name,
			MAX(b.provider_type) AS provider_type,
			MAX(b.employment_type) AS employment_type,
			MAX(b.salary_hourly_code) AS salary_hourly_code,
			MAX(b.provider_credentials) AS provider_credentials,
			b.provider_can_see_pediatric_patients,
			CASE WHEN provider_type = 'DHMT' THEN
				user_id
			ELSE
				NULL
			END AS dhmt_user_id,
			CASE WHEN provider_type = 'APP' THEN
				user_id
			ELSE
				NULL
			END AS app_user_id,
			CASE WHEN provider_type = 'DHMT' THEN
				1
			ELSE
				0
			END AS dhmt_count,
			CASE WHEN provider_type = 'APP' THEN
				1
			ELSE
				0
			END AS app_count
		FROM
			core.shift_team_members a
			INNER JOIN core.employees b ON a.user_id = b.master_user_id
			INNER JOIN stage.ml_os_care_requests ml ON a.shift_team_id = ml.shift_team_id
		WHERE
			ml.complete_datetime BETWEEN '2022-07-01'
			AND '2023-06-30'
			AND provider_position IN('DHMT',
				'Advanced Practice Provider')
		GROUP BY
			user_id,
			ml.care_request_id,
			ml.shift_team_id,
			ml.complete_datetime,
			b.provider_can_see_pediatric_patients,
			b.provider_type
)),
provider_features AS (
SELECT
		care_request_id,
		COUNT(*) AS members_count,
		LISTAGG (salary_hourly_code,
			'-')
		WITHIN GROUP (ORDER BY provider_type) AS salary_hourly_code,
		LISTAGG (provider_credentials,
			'-')
		WITHIN GROUP (ORDER BY provider_type) AS provider_credentials,
		COUNT(provider_credentials) AS provider_credential_count,
		CASE WHEN COUNT(provider_can_see_pediatric_patients) > 0 THEN
			1
		ELSE
			0
		END AS provider_can_see_pediatric_patients,
		MIN(months_since_hired) AS min_months_since_hired,
		MAX(months_since_hired) AS max_months_since_hired,
		LISTAGG (dhmt_user_id) AS dhmt_user_id,
		LISTAGG (app_user_id) AS app_user_id,
		SUM(dhmt_count) AS dhmt_count,
		SUM(app_count) AS app_count
	FROM
		members GROUP BY
			care_request_id
),
cr_counts AS (
	SELECT
		care_request_id,
		SUM(completed_care_requests) AS combined_complete_crs
	FROM
		(
			SELECT
				user_id,
				care_request_id,
				ROW_NUMBER() OVER (
					PARTITION BY user_id
					ORDER BY
						complete_datetime
				) - 1 AS completed_care_requests
			FROM
				members
		)
	GROUP BY
		care_request_id
),
final AS ( SELECT DISTINCT
	ml.care_request_id,
	ml.complete_datetime,
	ml.market_name,
	ml.shift_team_id,
	ml.place_of_service_original,
	ml.service_line_name,
	om.risk_protocol,
	ml.risk_score,
	ml.patient_age,
	ml.max_num_care_requests,
	prev_st.patient_visit_count,
	prev_st.avg_prev_stop_time,
	prev_st.prev_stop_time,
	prev_st.is_tele_presentation_visit,
	prev_st.is_first_cr,
	prev_st.is_last_cr,
	prev_st.has_next_cr_assigned,
	prev_st.complete_datetime_local,
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
	dm.patient_gender,
	dm.is_dhfu_visit,
    dm.zipcode,
	om.has_secondary_screening,
	om.high_level_home_health_provider,
	om.is_advanced_care_eligible,
	om.created_date,
	EXTRACT(DOW FROM om.created_date) AS day_of_week,
	om.channel_item_name,
	om.channel_item_id,
	om.created_to_accepted_minutes,
	om.is_risk_strat_bypass,
	om.has_risk_strat_or_rs_bypass,
  	om.has_payer_data,
  	om.is_scheduled_care_request,
  	om.has_valid_credit_card_on_file,
	om.request_type_label,
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
	ml.stop_time_per_care_request,
	dm.procedure_codes_aggregated,
	pf.members_count,
	pf.salary_hourly_code,
	pf.provider_credentials,
	pf.provider_credential_count,
	pf.provider_can_see_pediatric_patients,
	pf.min_months_since_hired,
	pf.max_months_since_hired,
  	pf.dhmt_user_id,
  	pf.app_user_id,
	cc.combined_complete_crs
FROM
	stage.ml_os_care_requests AS ml
	LEFT JOIN prev_st ON ml.care_request_id = prev_st.care_request_id
	LEFT JOIN core.care_request_care_delivery_mart dm ON ml.care_request_id = dm.care_request_id
	LEFT JOIN core.care_request_onboarding_mart om ON ml.care_request_id = om.care_request_id
	LEFT JOIN core.patient_past_medical_history mh ON dm.chart_id = mh.chart_id
		AND mh.min_created_datetime < ml.on_scene_datetime
	LEFT JOIN core.patient_social_history sh ON sh.chart_id = dm.chart_id
	LEFT JOIN hic1 ON hic1.care_request_id = ml.care_request_id
	LEFT JOIN provider_features pf ON ml.care_request_id = pf.care_request_id
	LEFT JOIN cr_counts cc ON ml.care_request_id = cc.care_request_id
WHERE
	ml.stop_time_per_care_request IS NOT NULL
	AND ml.care_request_id IS NOT NULL
)
SELECT
	*
FROM
	final
WHERE
	complete_datetime BETWEEN %(start_date)s AND %(end_date)s
