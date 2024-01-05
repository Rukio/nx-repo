-- +goose Up
-- +goose StatementBegin
DROP INDEX partner_clinical_providers_partner_id_provider_id_idx;

DROP INDEX partner_configuration_sources_partner_id_configuration_id_idx;

DROP INDEX partner_insurance_packages_partner_id_package_id_idx;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
CREATE UNIQUE INDEX partner_clinical_providers_partner_id_provider_id_idx ON partner_clinical_providers(partner_id, athena_clinical_provider_id);

CREATE UNIQUE INDEX partner_configuration_sources_partner_id_configuration_id_idx ON partner_configuration_sources (partner_id, partner_configuration_id);

CREATE UNIQUE INDEX partner_insurance_packages_partner_id_package_id_idx ON public.partner_insurance_packages (partner_id, package_id, deleted_at);

-- +goose StatementEnd
