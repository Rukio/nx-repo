-- +goose Up
-- +goose StatementBegin
CREATE TABLE service_request_status (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_request_status IS 'This is the list of status that can be assigned to records in the service_requests table via its status_id column';

COMMENT ON COLUMN service_request_status.name IS 'The name of the Service Request Status';

COMMENT ON COLUMN service_request_status.slug IS 'A slug representation of the Service Request Status.';

COMMENT ON COLUMN service_request_status.is_active IS 'Used to know if the Status is still marked as active or archived';

INSERT INTO
    service_request_status (name, slug, is_active)
VALUES
    ('Requested', 'requested', TRUE),
    ('Clinical Screening', 'clinical_screening', TRUE),
    ('Secondary Screening', 'secondary_screening', TRUE),
    ('Accepted', 'accepted', TRUE),
    ('Resolved', 'resolved', FALSE),
    ('Rejected', 'rejected', FALSE);

CREATE TABLE service_request_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE service_request_categories IS 'This is the list of categories that can be assigned to service_requests via the category_id column';

COMMENT ON COLUMN service_request_categories.name IS 'The name of the Service Request Category';

COMMENT ON COLUMN service_request_status.slug IS 'A slug representation of the Service Request Category.';

INSERT INTO
    service_request_categories (name, slug)
VALUES
    ('Advanced Care', 'advance_care');

CREATE TABLE service_requests (
    id BIGSERIAL PRIMARY KEY,
    care_request_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
    status_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    is_insurance_verified BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to_user_id BIGINT,
    cms_number TEXT,
    reject_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("status_id") REFERENCES service_request_status("id"),
    FOREIGN KEY ("category_id") REFERENCES service_request_categories("id")
);

COMMENT ON TABLE service_requests IS 'CareManager ServiceRequests table';

COMMENT ON COLUMN service_requests.care_request_id IS 'ID of Station''s related Care Request';

COMMENT ON COLUMN service_requests.market_id IS 'The Market associated with this Service Request';

COMMENT ON COLUMN service_requests.assigned_to_user_id IS 'The User assigned to resolve this Service Request';

COMMENT ON COLUMN service_requests.status_id IS 'The Service Request Status assigned to this Service Request';

COMMENT ON COLUMN service_requests.is_insurance_verified IS 'Has the Patient''s insurance been verified';

COMMENT ON COLUMN service_requests.cms_number IS 'Has a partnership with a health care system under CMS''s (https://www.cms.gov/) Acute Hospital Care at Home Individual Waiver.';

COMMENT ON COLUMN service_requests.reject_reason IS 'A text with the reason why the Service Request was rejected';

ALTER TABLE
    episodes
ADD
    COLUMN service_request_id BIGINT,
ADD
    FOREIGN KEY ("service_request_id") REFERENCES service_requests("id");

COMMENT ON COLUMN episodes.service_request_id IS 'An optional reference to the Service Request from which the episode originated.';

-- +goose StatementEnd
-- +goose Down
-- +goose StatementBegin
ALTER TABLE
    episodes DROP COLUMN service_request_id;

DROP TABLE service_requests;

DROP TABLE service_request_categories;

DROP TABLE service_request_status;

-- +goose StatementEnd
