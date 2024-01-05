package policies.patient_accounts

import data.utils.actor

default is_patient := false

default belongs_to_account := false

# TODO: [PT-1695] this will validate a list of acceptable clients
default manage_account_patient_links := false

# Rules

is_patient {
	actor.is_patient
}

belongs_to_account {
	actor.patient_has_account_id(input.resource.account_id)
}

belongs_to_account {
	actor.patient_account_has_patient_id(input.resource.patient_id)
}

belongs_to_account {
	actor.patient_account_has_unverified_patient_id(input.resource.unverified_patient_id)
}

manage_account_patient_links {
	actor.m2m_has_any_client_name([])
}
