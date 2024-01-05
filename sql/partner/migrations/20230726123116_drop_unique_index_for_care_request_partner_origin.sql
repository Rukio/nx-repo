-- +goose Up
-- +goose StatementBegin
DROP INDEX care_request_partners_station_partner_origin_idx;

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
CREATE UNIQUE INDEX care_request_partners_station_partner_origin_idx ON care_request_partners(
    station_care_request_id,
    partner_id,
    care_request_partner_origin_id
);

-- +goose StatementEnd
