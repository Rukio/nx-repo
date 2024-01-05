package policies.partner

import data.utils.actor

default belongs_to_partner := false

default is_super_admin := false

# Rules

belongs_to_partner {
	actor.partner_has_id(input.resource.partner_id)
}

belongs_to_partner {
	actor.partner_has_role("super_admin")
}

is_super_admin {
	actor.partner_has_role("super_admin")
}
