package policies.audit

import data.static.m2m_clients
import data.utils.actor

default create_audit_event := false

create_audit_event {
	actor.m2m_has_any_client_name([
		m2m_clients.Patients,
		m2m_clients.Athena,
		m2m_clients.CareManager,
		m2m_clients.Onboarding,
		m2m_clients.AthenaListener,
		m2m_clients.PatientAccounts,
	])
}
