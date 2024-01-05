package utils.actor

import data.utils.testing

test_type_matches {
	is_a("user") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
	not is_a("m2m") with input as {"actor": {"type": "user", "properties": {"client_name": "station"}}}
}

test_valid_type {
	valid_type("user") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
	not valid_type("invalid") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
}

test_has_property {
	has_property("id") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
	not has_property("client_name") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
}

test_value_equals {
	value_equals("user", "id", "1") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
	not value_equals("m2m", "id", "1") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
}

test_value_contains {
	value_contains("user", "groups", "two") with input as {"actor": {"type": "user", "properties": {"groups": ["two", "three"]}}}
	not value_contains("user", "groups", "five") with input as {"actor": {"type": "user", "properties": {"groups": ["two", "three"]}}}
	not value_contains("m2m", "groups", "two") with input as {"actor": {"type": "user", "properties": {"groups": ["two", "three"]}}}
}

test_value_intersects {
	value_intersects("user", "groups", ["one", "two"]) with input as {"actor": {"type": "user", "properties": {"groups": ["two", "three"]}}}
	not value_intersects("user", "groups", ["four", "five"]) with input as {"actor": {"type": "user", "properties": {"groups": ["two", "three"]}}}
	not value_intersects("m2m", "groups", ["one", "two"]) with input as {"actor": {"type": "user", "properties": {"groups": ["two", "three"]}}}
}

test_is_user {
	is_user with input as testing.mock_user_actor(10, ["admin"])
	not is_user with input as testing.mock_m2m_actor("some client")
}

test_user_id_matches {
	user_has_id("1") with input as {"actor": {"type": "user", "properties": {"id": "1"}}}
	not user_has_id("1") with input as {"actor": {"type": "user", "properties": {"id": "2"}}}
	not user_has_id("1") with input as {"actor": {"type": "invalid", "properties": {"id": "1"}}}
}

test_user_has_group {
	user_has_group("one") with input as {"actor": {"type": "user", "properties": {"groups": ["one", "two"]}}}
	not user_has_group("nope") with input as {"actor": {"type": "user", "properties": {"groups": ["one", "two"]}}}
	not user_has_group("one") with input as {"actor": {"type": "invalid", "properties": {"groups": ["one", "two"]}}}
}

test_user_has_any_group {
	user_has_any_group(["one", "two"]) with input as {"actor": {"type": "user", "properties": {"groups": ["two", "three"]}}}
	not user_has_any_group(["one", "two"]) with input as {"actor": {"type": "user", "properties": {"groups": ["three", "four"]}}}
	not user_has_any_group(["one", "two"]) with input as {"actor": {"type": "invalid", "properties": {"groups": ["two", "three"]}}}
}

test_user_has_role {
	user_has_role("one") with input as {"actor": {"type": "user", "properties": {"roles": ["one", "two"]}}}
	not user_has_role("nope") with input as {"actor": {"type": "user", "properties": {"roles": ["one", "two"]}}}
	not user_has_role("one") with input as {"actor": {"type": "partner", "properties": {"roles": ["one", "two"]}}}
}

test_user_has_any_role {
	user_has_any_role(["one", "two"]) with input as {"actor": {"type": "user", "properties": {"roles": ["two", "three"]}}}
	not user_has_any_role(["one", "two"]) with input as {"actor": {"type": "user", "properties": {"roles": ["three", "four"]}}}
	not user_has_any_role(["one", "two"]) with input as {"actor": {"type": "partner", "properties": {"roles": ["two", "three"]}}}
}

test_user_has_market {
	user_has_market("COL") with input as {"actor": {"type": "user", "properties": {"markets": ["DEN", "COL"]}}}
	not user_has_market("COL") with input as {"actor": {"type": "user", "properties": {"markets": ["DEN", "LVA"]}}}
	not user_has_market("COL") with input as {"actor": {"type": "patient", "properties": {"markets": ["DEN", "COL"]}}}
}

test_user_has_any_market {
	user_has_any_market(["COL", "TST"]) with input as {"actor": {"type": "user", "properties": {"markets": ["DEN", "COL"]}}}
	not user_has_any_market(["COL", "TST"]) with input as {"actor": {"type": "user", "properties": {"markets": ["DEN", "LVA"]}}}
	not user_has_any_market(["COL", "TST"]) with input as {"actor": {"type": "patient", "properties": {"markets": ["DEN", "COL"]}}}
}

test_is_m2m {
	is_m2m with input as testing.mock_m2m_actor("some client")
	not is_m2m with input as testing.mock_user_actor(1, ["admin"])
}

test_m2m_has_any_client_name {
	m2m_has_any_client_name(["client A", "client B"]) with input as {"actor": {"type": "m2m", "properties": {"client_name": "client B"}}}
	not m2m_has_any_client_name(["client A", "client B"]) with input as {"actor": {"type": "m2m", "properties": {"client_name": "client C"}}}
	not m2m_has_any_client_name(["client A", "client B"]) with input as {"actor": {"type": "user", "properties": {"client_name": "client B"}}}
	not m2m_has_any_client_name(["client A", "client B"]) with input as {}
	not m2m_has_any_client_name([]) with input as {"actor": {"type": "m2m", "properties": {"client_name": "client B"}}}
}

test_is_patient {
	is_patient with input as {"actor": {"type": "patient", "properties": {"athena_id": "1"}}}
	not is_patient with input as testing.mock_user_actor(1, ["admin"])
}

test_patient_athena_id_matches {
	patient_has_athena_id("1") with input as {"actor": {"type": "patient", "properties": {"athena_id": "1"}}}
	not patient_has_athena_id("1") with input as {"actor": {"type": "patient", "properties": {"athena_id": "2"}}}
	not patient_has_athena_id("1") with input as {"actor": {"type": "user", "properties": {"athena_id": "1"}}}
}

test_patient_account_id_matches {
	patient_has_account_id("1") with input as {"actor": {"type": "patient", "properties": {"account_id": "1"}}}
	not patient_has_account_id("1") with input as {"actor": {"type": "patient", "properties": {"account_id": "2"}}}
	not patient_has_account_id("1") with input as {"actor": {"type": "user", "properties": {"account_id": "1"}}}
}

test_patient_account_patient_id_matches {
	patient_account_has_patient_id("1") with input as {"actor": {"type": "patient", "properties": {"patients": ["1"]}}}
	not patient_account_has_patient_id("1") with input as {"actor": {"type": "patient", "properties": {"patients": ["2"]}}}
	not patient_account_has_patient_id("1") with input as {"actor": {"type": "user", "properties": {"patients": ["1"]}}}
}

test_patient_account_has_unverified_patient_id_matches {
	patient_account_has_unverified_patient_id("1") with input as {"actor": {"type": "patient", "properties": {"unverified_patients": ["1"]}}}
	not patient_account_has_unverified_patient_id("1") with input as {"actor": {"type": "patient", "properties": {"unverified_patients": ["2"]}}}
	not patient_account_has_unverified_patient_id("1") with input as {"actor": {"type": "user", "properties": {"unverified_patients": ["1"]}}}
}

test_is_partner {
	is_partner with input as {"actor": {"type": "partner", "properties": {"partner_id": "1"}}}
	not is_partner with input as testing.mock_user_actor(1, ["admin"])
}

test_partner_id_matches {
	partner_has_id("1") with input as {"actor": {"type": "partner", "properties": {"partner_id": "1"}}}
	not partner_has_id("1") with input as {"actor": {"type": "partner", "properties": {"partner_id": "2"}}}
	not partner_has_id("1") with input as {"actor": {"type": "user", "properties": {"partner_id": "1"}}}
}

test_partner_has_role {
	partner_has_role("admin") with input as {"actor": {"type": "partner", "properties": {"role": "admin"}}}
	not partner_has_role("admin") with input as {"actor": {"type": "partner", "properties": {"role": "user"}}}
	not partner_has_role("admin") with input as {"actor": {"type": "user", "properties": {"role": "admin"}}}
	not partner_has_role("admin") with input as {"actor": {"partner": "user", "properties": {}}}
}

test_user_has_any_market_role {
	user_has_any_market_role(["role A", "role B"]) with input as {"actor": {"type": "user", "properties": {"market_role": "role A"}}}
	not user_has_any_market_role(["role A", "role B"]) with input as {"actor": {"type": "user", "properties": {"market_role": "role C"}}}
	not user_has_any_market_role(["role A", "role B"]) with input as {}
	not user_has_any_market_role([]) with input as {"actor": {"type": "user", "properties": {"market_role": "role A"}}}
}
