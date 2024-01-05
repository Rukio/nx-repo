-- name: AddAuditEvent :one
INSERT INTO
    audit_events (
        source,
        agent,
        event_type,
        event_timestamp,
        event_data_type,
        event_data,
        context_metadata
    )
VALUES
    ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
