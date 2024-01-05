package policies.partner

test_belongs_to_partner {
	# type and partner_id match
	belongs_to_partner with input as {
		"actor": {"type": "partner", "properties": {"partner_id": "1-2-3"}},
		"resource": {"partner_id": "1-2-3"},
	}

	# partner_id does not match
	not belongs_to_partner with input as {
		"actor": {"type": "partner", "properties": {"partner_id": "1-2-3"}},
		"resource": {"partner_id": "1-2-3-4"},
	}

	# partner_id is missing
	not belongs_to_partner with input as {
		"actor": {"type": "partner", "properties": {"partner_id": "1-2-3"}},
		"resource": {},
	}

	# type is not partner
	not belongs_to_partner with input as {
		"actor": {"type": "user", "properties": {"partner_id": "1-2-3"}},
		"resource": {"partner_id": "1-2-3"},
	}

	# user is super admin
	belongs_to_partner with input as {
		"actor": {"type": "partner", "properties": {"role": "super_admin"}},
		"resource": {"partner_id": "1-2-3"},
	}
}

test_is_super_admin {
	# type and role match
	is_super_admin with input as {"actor": {"type": "partner", "properties": {"role": "super_admin"}}}

	# role does not match
	not is_super_admin with input as {"actor": {"type": "partner", "properties": {"role": "user"}}}

	# type does not match
	not is_super_admin with input as {"actor": {"type": "user", "properties": {"role": "super_admin"}}}
}
