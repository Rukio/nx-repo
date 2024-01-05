package auth

type PolicyRule string

const (
	PolicyTestPolicy PolicyRule = "testing.only"
	// TODO: (ENG-594) Auto-generate from OPA policies.
	PolicyAuditCreateAuditEvent PolicyRule = "policies.audit.create_audit_event"

	PolicyClinicalKpiMarketMetrics   PolicyRule = "policies.clinicalkpi.view_leads_metrics"
	PolicyClinicalKpiMarketRole      PolicyRule = "policies.clinicalkpi.view_market_metrics"
	PolicyClinicalKpiPersonalMetrics PolicyRule = "policies.clinicalkpi.view_personal_metrics"

	PolicyPartnerBelongsToPartner PolicyRule = "policies.partner.belongs_to_partner"
	PolicyPartnerIsSuperAdmin     PolicyRule = "policies.partner.is_super_admin"

	PolicyPatientAccountsIsPatient                 PolicyRule = "policies.patient_accounts.is_patient"
	PolicyPatientAccountsBelongsToAccount          PolicyRule = "policies.patient_accounts.belongs_to_account"
	PolicyPatientAccountsManageAccountPatientLinks PolicyRule = "policies.patient_accounts.manage_account_patient_links"
)
