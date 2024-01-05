package utils.actor

import data.static.actor_types
import input.actor

is_a(type) {
	actor
	type == actor.type
}

valid_type(type) {
	actor
	actor_types.types[_] == type
}

has_property(property) {
	actor
	object.keys(actor.properties)[_] == property
}

value_equals(type, key, val) {
	type == actor.type
	val == actor.properties[key]
}

value_contains(type, key, val) {
	type == actor.type
	val == actor.properties[key][_]
}

value_contained(type, key, values) {
	type == actor.type
	values[_] == actor.properties[key]
}

value_intersects(type, key, values) {
	type == actor.type
	values[_] == actor.properties[key][_]
}

# Users

is_user {
	is_a("user")
}

user_has_id(id) {
	value_equals("user", "id", id)
}

user_has_group(group) {
	value_contains("user", "groups", group)
}

user_has_any_group(groups) {
	value_intersects("user", "groups", groups)
}

user_has_role(role) {
	value_contains("user", "roles", role)
}

user_has_any_role(roles) {
	value_intersects("user", "roles", roles)
}

user_has_market(market) {
	value_contains("user", "markets", market)
}

user_has_any_market(markets) {
	value_intersects("user", "markets", markets)
}

user_has_any_market_role(market_roles) {
	value_contained("user", "market_role", market_roles)
}

# M2M

is_m2m {
	is_a("m2m")
}

m2m_has_any_client_name(client_names) {
	value_contained("m2m", "client_name", client_names)
}

# Patient (Patient properties are provisional, subject to change)

is_patient {
	is_a("patient")
}

patient_has_athena_id(id) {
	value_equals("patient", "athena_id", id)
}

patient_has_account_id(id) {
	value_equals("patient", "account_id", id)
}

patient_account_has_patient_id(id) {
	value_contains("patient", "patients", id)
}

patient_account_has_unverified_patient_id(id) {
	value_contains("patient", "unverified_patients", id)
}

# Partner (Partner properties are provisional, subject to change)

is_partner {
	is_a("partner")
}

partner_has_id(id) {
	value_equals("partner", "partner_id", id)
}

partner_has_role(role) {
	value_equals("partner", "role", role)
}
