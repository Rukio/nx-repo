package policies.patient_accounts

test_is_patient {
	# type is patient
	is_patient with input as {
		"actor": {"type": "patient", "properties": {"account_id": 1}},
		"resource": {"account_id": 1},
	}

	# type is not patient
	not is_patient with input as {
		"actor": {"type": "user", "properties": {"account_id": 1}},
		"resource": {"account_id": 1},
	}
}

test_belongs_to_account {
	# type and account_id match
	belongs_to_account with input as {
		"actor": {"type": "patient", "properties": {"account_id": 1}},
		"resource": {"account_id": 1},
	}

	# account_id does not match
	not belongs_to_account with input as {
		"actor": {"type": "patient", "properties": {"account_id": 1}},
		"resource": {"account_id": 2},
	}

	# account_id match and type doesn't
	not belongs_to_account with input as {
		"actor": {"type": "user", "properties": {"account_id": 1}},
		"resource": {"account_id": 1},
	}

	# type and patient_id match
	belongs_to_account with input as {
		"actor": {"type": "patient", "properties": {"patients": [1]}},
		"resource": {"patient_id": 1},
	}

	# patient_id does not match
	not belongs_to_account with input as {
		"actor": {"type": "patient", "properties": {"patients": [1]}},
		"resource": {"patient_id": 2},
	}

	# patient_id match and type doesn't
	not belongs_to_account with input as {
		"actor": {"type": "user", "properties": {"patients": [1]}},
		"resource": {"patient_id": 1},
	}

	# type and unverified_patient_id match
	belongs_to_account with input as {
		"actor": {"type": "patient", "properties": {"unverified_patients": [1]}},
		"resource": {"unverified_patient_id": 1},
	}

	# unverified_patient_id does not match
	not belongs_to_account with input as {
		"actor": {"type": "patient", "properties": {"unverified_patients": [1]}},
		"resource": {"unverified_patient_id": 2},
	}

	# unverified_patient_id match and type doesn't
	not belongs_to_account with input as {
		"actor": {"type": "user", "properties": {"unverified_patients": [1]}},
		"resource": {"unverified_patient_id": 1},
	}
}

test_manage_account_patient_links {
	# m2m
	not manage_account_patient_links with input as {
		"actor": {"type": "m2m", "properties": {"client_name": "client B"}},
		"resource": {"account_id": 1},
	}

	# patient
	not manage_account_patient_links with input as {
		"actor": {"type": "patient", "properties": {"account_id": 1}},
		"resource": {"account_id": 2},
	}

	# user
	not manage_account_patient_links with input as {
		"actor": {"type": "user", "properties": {"account_id": 1}},
		"resource": {"account_id": 1},
	}
}
