package policies.clinicalkpi

import data.static.m2m_clients
import data.static.market_roles
import data.utils.actor

default view_leads_metrics := false

default view_market_metrics := false

default view_personal_metrics := false

# The base user CRUD actions of this policy all derive from a common rule:

m2m_authorized {
	actor.m2m_has_any_client_name([m2m_clients.ClinicalKPI])
}

user_metrics_authorized {
	actor.user_has_any_market_role([
		market_roles.LeadAPP,
		market_roles.LeadAdvancedCareAPP,
		market_roles.LeadDHMT,
		market_roles.RDO,
		market_roles.RMD,
		market_roles.AreaManager,
		market_roles.MarketManager,
	])
}

user_market_authorized {
	actor.user_has_market(input.resource.MarketId)
}

user_market_authorized {
	actor.user_has_any_market(input.resource.MarketId)
}

belongs_to_provider {
	actor.user_has_id(input.resource.ProviderId)
}

# Rules

view_leads_metrics {
	m2m_authorized
}

view_leads_metrics {
	user_metrics_authorized
}

view_market_metrics {
	m2m_authorized
}

view_market_metrics {
	user_metrics_authorized
	user_market_authorized
}

view_personal_metrics {
	m2m_authorized
}

view_personal_metrics {
	belongs_to_provider
}
