-- +goose Up
-- +goose StatementBegin
CREATE TABLE audit_events (
    id bigserial PRIMARY KEY,
    source TEXT NOT NULL,
    agent TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event_data_type TEXT NOT NULL,
    event_data JSON,
    context_metadata JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN audit_events.source IS 'The source system (service, application, or otherwise) generating the audit event';

COMMENT ON COLUMN audit_events.agent IS 'The user or account initiating the audit event';

COMMENT ON COLUMN audit_events.event_type IS 'The name of the action or event generating the audit event data';

COMMENT ON COLUMN audit_events.event_timestamp IS 'The timestamp of audited event';

COMMENT ON COLUMN audit_events.event_data_type IS 'The logical entity being mutated or accessed';

COMMENT ON COLUMN audit_events.event_data IS 'Any data related to the audited event and its data type itself which may also include PHI';

COMMENT ON COLUMN audit_events.context_metadata IS 'Any data related to the system context in which the audited event occurred';

COMMENT ON COLUMN audit_events.created_at IS 'The creation timestamp of audited event record itself';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
DROP TABLE audit_events;

-- +goose StatementEnd
