-- +goose Up
-- +goose StatementBegin
CREATE TABLE legacy_risk_protocols (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE legacy_risk_protocols IS 'Stores Legacy risk protocols from TurfOrSurf by their name to associate back to a symptom';

COMMENT ON COLUMN legacy_risk_protocols.name IS 'The name of the risk protocol';

ALTER TABLE
    symptoms
ADD
    COLUMN legacy_risk_protocol_id UUID,
ADD
    FOREIGN KEY (legacy_risk_protocol_id) REFERENCES legacy_risk_protocols(id);

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    symptoms DROP COLUMN legacy_risk_protocol_id;

DROP TABLE legacy_risk_protocols;

-- +goose StatementEnd
