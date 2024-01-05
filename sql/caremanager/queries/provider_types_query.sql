-- name: GetProviderTypes :many
SELECT
    *
FROM
    provider_types
ORDER BY
    id;
