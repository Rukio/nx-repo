package policies.audit

import data.static.m2m_clients
import data.utils.testing

test_create_audit_event {
	create_audit_event with input as testing.mock_m2m_actor(m2m_clients.Athena)
	create_audit_event with input as testing.mock_m2m_actor(m2m_clients.CareManager)
	create_audit_event with input as testing.mock_m2m_actor(m2m_clients.Onboarding)
	create_audit_event with input as testing.mock_m2m_actor(m2m_clients.Patients)
	create_audit_event with input as testing.mock_m2m_actor(m2m_clients.AthenaListener)
	create_audit_event with input as testing.mock_m2m_actor(m2m_clients.PatientAccounts)
	not create_audit_event with input as testing.mock_m2m_actor("Some Other Service M2M")
	not create_audit_event with input as testing.mock_user_actor(10, ["admin"])
}
