module github.com/*company-data-covered*/services

go 1.19

require (
	cloud.google.com/go/maps v0.5.0 // toliver.jue
	github.com/auth0/go-jwt-middleware/v2 v2.1.0 // stephen.li, dj.ambrisco
	github.com/aws/aws-sdk-go-v2 v1.18.0 // rodrigo.perez, dan.cohn
	github.com/aws/aws-sdk-go-v2/config v1.15.4 // rodrigo.perez, dan.cohn
	github.com/aws/aws-sdk-go-v2/credentials v1.12.0 // daniel.golosow, dj.ambrisco
	github.com/aws/aws-sdk-go-v2/service/s3 v1.26.8 // rodrigo.perez, dan.cohn
	github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime v1.14.4 // dan.cohn
	github.com/aws/aws-sdk-go-v2/service/secretsmanager v1.15.9 // daniel.golosow, dj.ambrisco
	github.com/aws/aws-sdk-go-v2/service/sns v1.17.6 // rodrigo.perez, dan.cohn
	github.com/aws/smithy-go v1.13.5 // rodrigo.perez, dan.cohn
	github.com/bsm/redislock v0.9.2 // stephen.li, viacheslav.kulichenko
	github.com/DataDog/datadog-go/v5 v5.1.1 // viacheslav.kulichenko, lucas.peterson
	github.com/elastic/go-elasticsearch/v7 v7.17.1 // carlos.garibay, dan.cohn
	github.com/google/go-cmp v0.5.9 // toliver.jue, stephen.li
	github.com/google/uuid v1.3.0 // daniel.golosow, tyler.hunt
	github.com/grpc-ecosystem/go-grpc-middleware v1.4.0 // stephen.li
	github.com/grpc-ecosystem/grpc-gateway/v2 v2.15.2 // lucas.peterson
	github.com/influxdata/influxdb1-client v0.0.0-20220302092344-a9ab5670611c // stephen.li
	github.com/jackc/pgconn v1.13.0 // toliver.jue, dj.ambrisco
	github.com/jackc/pgtype v1.12.0 // toliver.jue, dj.ambrisco
	github.com/jackc/pgx/v4 v4.17.2 // toliver.jue, dj.ambrisco
	github.com/nyaruka/phonenumbers v1.1.0 // stephen.li, toliver.jue
	github.com/open-policy-agent/opa v0.50.1 // daniel.golosow, nik.buskirk
	github.com/pkg/errors v0.9.1 // stephen.li, toliver.jue
	github.com/redis/go-redis/v9 v9.0.2 // stephen.li, lucas.peterson
	github.com/robfig/cron/v3 v3.0.1 // serhii.komarov
	github.com/rs/cors v1.8.2 // cesar.landeros
	github.com/sendgrid/rest v2.6.9+incompatible // dan.cohn
	github.com/sendgrid/sendgrid-go v3.11.1+incompatible // dan.cohn
	github.com/Shopify/sarama v1.37.2 // tyler.hunt, daniel.golosow
	github.com/slack-go/slack v0.12.1 // dmitry.hruzin
	github.com/statsig-io/go-sdk v1.6.1 // daniel.golosow, dj.ambrisco
	github.com/twilio/twilio-go v1.4.0 // dmitry.hruzin
	go.uber.org/zap v1.21.0 // toliver.jue, stephen.li, daniel.montoya
	golang.org/x/exp v0.0.0-20220428152302-39d4317da171 // dan.cohn
	golang.org/x/sync v0.1.0 // toliver.jue
	golang.org/x/time v0.3.0 // daniel.montoya
	google.golang.org/genproto v0.0.0-20230223222841-637eb2293923 // lucas.peterson
	google.golang.org/grpc v1.54.0 // toliver.jue, dj.ambrisco, keep in sync with gRPC version in Makefile
	google.golang.org/protobuf v1.28.1 // toliver.jue, dj.ambrisco
	googlemaps.github.io/maps v1.3.2 // toliver.jue, stephen.li
	gopkg.in/DataDog/dd-trace-go.v1 v1.50.0 // alexis.zapata, jon.corbin
	github.com/hashicorp/vault/api v1.9.2 // kyle.mcgrew, tyler.hunt
	github.com/hashicorp/vault/api/auth/approle v0.4.1 // kyle.mcgrew, tyler.hunt
)

// Force versions to fix vulnerabilities.
// Use to force imports: go/pkg/gomodimports/gomodimports.go.
require github.com/pkg/sftp v1.13.5 // toliver.jue, PT-1116

require (
	github.com/DataDog/appsec-internal-go v1.0.0 // indirect
	github.com/DataDog/datadog-agent/pkg/obfuscate v0.43.1 // indirect
	github.com/DataDog/datadog-agent/pkg/remoteconfig/state v0.45.0-rc.1 // indirect
	github.com/DataDog/go-libddwaf v1.1.0 // indirect
	github.com/DataDog/go-tuf v0.3.0--fix-localmeta-fork // indirect
	github.com/DataDog/gostackparse v0.5.0 // indirect
	github.com/DataDog/sketches-go v1.2.1 // indirect
	github.com/Microsoft/go-winio v0.5.2 // indirect
	github.com/OneOfOne/xxhash v1.2.8 // indirect
	github.com/agnivade/levenshtein v1.1.1 // indirect
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.4.1 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.12.4 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.1.33 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.4.27 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.3.11 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.0.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.9.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.1.5 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.9.4 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.13.4 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.11.4 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.16.4 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/bytecodealliance/wasmtime-go/v3 v3.0.2 // indirect
	github.com/cenkalti/backoff/v3 v3.0.0 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/containerd/containerd v1.6.19 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dustin/go-humanize v1.0.0 // indirect
	github.com/eapache/go-resiliency v1.3.0 // indirect
	github.com/eapache/go-xerial-snappy v0.0.0-20180814174437-776d5712da21 // indirect
	github.com/eapache/queue v1.1.0 // indirect
	github.com/ghodss/yaml v1.0.0 // indirect
	github.com/go-ini/ini v1.67.0 // indirect
	github.com/go-jose/go-jose/v3 v3.0.0 // indirect
	github.com/go-logr/logr v1.2.3 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/gobwas/glob v0.2.3 // indirect
	github.com/golang/mock v1.6.0 // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/golang/snappy v0.0.4 // indirect
	github.com/google/pprof v0.0.0-20210423192551-a2663126120b // indirect
	github.com/gorilla/mux v1.8.0 // indirect
	github.com/gorilla/websocket v1.4.2 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-cleanhttp v0.5.2 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/hashicorp/go-retryablehttp v0.6.6 // indirect
	github.com/hashicorp/go-rootcerts v1.0.2 // indirect
	github.com/hashicorp/go-secure-stdlib/parseutil v0.1.6 // indirect
	github.com/hashicorp/go-secure-stdlib/strutil v0.1.2 // indirect
	github.com/hashicorp/go-sockaddr v1.0.2 // indirect
	github.com/hashicorp/go-uuid v1.0.3 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/jackc/chunkreader/v2 v2.0.1 // indirect
	github.com/jackc/pgio v1.0.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgproto3/v2 v2.3.1 // indirect
	github.com/jackc/pgservicefile v0.0.0-20221227161230-091c0ba34f0a // indirect
	github.com/jackc/puddle v1.3.0 // indirect
	github.com/jcmturner/aescts/v2 v2.0.0 // indirect
	github.com/jcmturner/dnsutils/v2 v2.0.0 // indirect
	github.com/jcmturner/gofork v1.7.6 // indirect
	github.com/jcmturner/gokrb5/v8 v8.4.3 // indirect
	github.com/jcmturner/rpc/v2 v2.0.3 // indirect
	github.com/klauspost/compress v1.15.11 // indirect
	github.com/kr/fs v0.1.0 // indirect
	github.com/matttproud/golang_protobuf_extensions v1.0.4 // indirect
	github.com/mitchellh/go-homedir v1.1.0 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/moby/locker v1.0.1 // indirect
	github.com/opencontainers/go-digest v1.0.0 // indirect
	github.com/opencontainers/image-spec v1.1.0-rc2 // indirect
	github.com/outcaste-io/ristretto v0.2.1 // indirect
	github.com/philhofer/fwd v1.1.1 // indirect
	github.com/pierrec/lz4/v4 v4.1.17 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/prometheus/client_golang v1.14.0 // indirect
	github.com/prometheus/client_model v0.3.0 // indirect
	github.com/prometheus/common v0.37.0 // indirect
	github.com/prometheus/procfs v0.8.0 // indirect
	github.com/rcrowley/go-metrics v0.0.0-20201227073835-cf1acfcdf475 // indirect
	github.com/richardartoul/molecule v1.0.1-0.20221107223329-32cfee06a052 // indirect
	github.com/rogpeppe/go-internal v1.9.0 // indirect
	github.com/ryanuber/go-glob v1.0.0 // indirect
	github.com/secure-systems-lab/go-securesystemslib v0.5.0 // indirect
	github.com/sirupsen/logrus v1.9.0 // indirect
	github.com/spaolacci/murmur3 v1.1.0 // indirect
	github.com/statsig-io/ip3country-go v0.2.0 // indirect
	github.com/tchap/go-patricia/v2 v2.3.1 // indirect
	github.com/tinylib/msgp v1.1.6 // indirect
	github.com/ua-parser/uap-go v0.0.0-20211112212520-00c877edfe0f // indirect
	github.com/xeipuuv/gojsonpointer v0.0.0-20190905194746-02993c407bfb // indirect
	github.com/xeipuuv/gojsonreference v0.0.0-20180127040603-bd5ef7bd5415 // indirect
	github.com/yashtewari/glob-intersection v0.1.0 // indirect
	go.opencensus.io v0.24.0 // indirect
	go.opentelemetry.io/otel v1.14.0 // indirect
	go.opentelemetry.io/otel/sdk v1.14.0 // indirect
	go.opentelemetry.io/otel/trace v1.14.0 // indirect
	go.uber.org/atomic v1.10.0 // indirect
	go.uber.org/multierr v1.6.0 // indirect
	go4.org/intern v0.0.0-20211027215823-ae77deb06f29 // indirect
	go4.org/unsafe/assume-no-moving-gc v0.0.0-20220617031537-928513b29760 // indirect
	golang.org/x/crypto v0.7.0 // indirect
	golang.org/x/net v0.8.0 // indirect
	golang.org/x/sys v0.6.0 // indirect
	golang.org/x/text v0.8.0 // indirect
	golang.org/x/xerrors v0.0.0-20220907171357-04be3eba64a2 // indirect
	gopkg.in/square/go-jose.v2 v2.6.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	inet.af/netaddr v0.0.0-20220811202034-502d2d690317 // indirect
	oras.land/oras-go/v2 v2.0.0 // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/stretchr/testify v1.8.2 // indirect
)
