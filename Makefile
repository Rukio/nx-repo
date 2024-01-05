SHELL := /bin/bash

VERSION ?= $(shell git rev-parse HEAD 2>/dev/null || echo "dev")
GENERATED_TARGET_DIR ?= $(CURDIR)/generated
BUILD_TARGET_DIR ?= $(GENERATED_TARGET_DIR)/bin
INSTALL_BIN_DIR := $(CURDIR)/bin
PY_PROTO_DIR := $(CURDIR)/py/lib/proto/proto

GO_BUILD_FLAGS := -ldflags "-X github.com/*company-data-covered*/services/go/pkg/buildinfo.Version=$(VERSION)"
GO_DB_TEST_BUILD_TAGS := db_test
GO_DB_TEST_FLAGS := -tags=$(GO_DB_TEST_BUILD_TAGS)
GO_CODE_COVERAGE_OUTPUT := go-code-coverage.out
GO_CODE_COVERAGE_JSON_OUTPUT := go-code-coverage-report.json
GO_TEST_FLAGS := -shuffle=on -count=1 -coverprofile=$(GO_CODE_COVERAGE_OUTPUT)
GOTESTSUM_COMMAND := gotestsum --jsonfile $(GO_CODE_COVERAGE_JSON_OUTPUT)
GRADLE_BUILD_FLAGS := -PgitVersion=$(VERSION)

GO_GEN_DIR := $(CURDIR)/go/pkg/generated
TS_GEN_DIR := $(CURDIR)/ts/libs/shared/protos/src
TS_GEN_CAREMANAGER_DIR := $(CURDIR)/ts/libs/caremanager/data-access/src/lib/__generated__

PYTHON_VERS ?= $(shell awk '/python/ {print $$2}' .tool-versions)

PRETTIER_FORMAT := npx prettier --write
PRETTIER_LINT := npx prettier --check
CLANG_FORMAT := clang-format -i -style=google
CLANG_LINT := clang-format --dry-run -style=google -Werror

SQL_FORMATTER := node scripts/sql-formatter \
	--language postgresql \
	--indent 4 \
	--lines-between-queries 2 \
	--uppercase

MARKDOWN_FILES := "**/*.md"
YAML_FILES := "**/*.yaml" "**/*.yml"
JSON_FILES := "**/*.json"
JS_FILES := "**/*.js"

DOCKER_TARGET_ARCH ?= $(shell ([[ "$$(uname -m)" == "arm64" ]] || [[ "$$(uname -m)" == "aarch64" ]]) && echo "linux/arm64" || echo "linux/amd64")

DOCKER_COMPOSE_DEV_DB_PROJECT := dev-db
DOCKER_COMPOSE_DEV_MONITORING_PROJECT := dev-monitoring
DOCKER_COMPOSE_DEV_ELASTICSEARCH_PROJECT := dev-elasticsearch
DOCKER_COMPOSE_DEV_KAFKA_PROJECT := dev-kafka
DOCKER_COMPOSE_DEV_REDIS_PROJECT := dev-redis
DOCKER_COMPOSE_DEV_OPA_PROJECT := dev-opa

SUDO_COMMAND := sudo

DEV_DB_POSTGRESQL_PORT := 5433
DEV_DB_REDIS_PORT := 6380
DEV_ELASTICSEARCH_PORT := 9201
DEV_ZOOKEEPER_PORT := 2181
DEV_ZOOKEEPER_VERSION := 3.8.0
DEV_KAFKA_PORT := 9092
DEV_KAFKA_VERSION := 3.2.3
DEV_OPA_PORT := 8181

OPA_BUNDLE := opa/bundle

# Current code coverage, once the percentage start increasing
# should be updated accordingly
CURRENT_CODE_COVERAGE := 49.9
TARGET_CODE_COVERAGE := 80.0

# Load .env file if it exists
ifneq (,$(wildcard ./.env.development.local))
	include ./.env.development.local
	export
endif
export PATH := $(INSTALL_BIN_DIR):$(PATH)
export GOBIN := $(INSTALL_BIN_DIR)
export BUF_CACHE_DIR := $(INSTALL_BIN_DIR)/buf_module_cache

# Benchmark pattern
BENCH ?= .

# This section is pulled into the pipeline for use in caching
# TOOL_VERSIONS
PY_PROTOBUF_VERSION := v3.20.1
GRPC_GATEWAY := v2.10.2
GRPC_REPO_VERSION := v1.54.0
GOOSE_VERSION := v3.10.0
BUF_VERSION := v1.9.0
SQLC_VERSION := v1.19.1
PROTOC_GEN_GO_VERSION := v1.28.1
PROTOC_GO_GRPC_VERSION := v1.2.0
GOTESTSUM_VERSION := v1.10.0
GRPC_URL_VERSION := v1.8.7
GOLANGCI_LINT_VERSION := v1.53.2
# END_TOOL_VERSIONS

# Setup tools to work with repo
.PHONY: setup-common-gen
setup-common-gen:
	go install github.com/kyleconroy/sqlc/cmd/sqlc@$(SQLC_VERSION)
	go install -tags='no_mysql no_sqlite3' github.com/pressly/goose/v3/cmd/goose@$(GOOSE_VERSION)
# toliver.jue,stephen.li
	go install github.com/bufbuild/buf/cmd/buf@$(BUF_VERSION)
	go install google.golang.org/protobuf/cmd/protoc-gen-go@$(PROTOC_GEN_GO_VERSION)
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@$(PROTOC_GO_GRPC_VERSION)
# lucas.peterson
	go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@$(GRPC_GATEWAY)
	go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@$(GRPC_GATEWAY)
# toliver.jue,stephen.li
	go install gotest.tools/gotestsum@$(GOTESTSUM_VERSION)

.PHONY: setup-common-lint
setup-common-lint:
	go install github.com/fullstorydev/grpcurl/cmd/grpcurl@$(GRPC_URL_VERSION)
# eli.goldstein,toliver.jue
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION)

.PHONY: setup-common-install
setup-common-install: ensure-github-token
	npm install

.PHONY: setup-linux-deploy
setup-linux-deploy:
	go install -tags='no_mysql no_sqlite3' github.com/pressly/goose/v3/cmd/goose@$(GOOSE_VERSION)

.PHONY: setup-linux-lint
setup-linux-lint: setup-common-lint
# stephen.li
	$(SUDO_COMMAND) apt-get install clang-format
# Add newest postgres version to old Ubuntu releases
# Ref: https://wiki.postgresql.org/wiki/Apt
# toliver.jue
	$(SUDO_COMMAND) apt-get install -y lsb-release
	$(SUDO_COMMAND) sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $$(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
	wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | $(SUDO_COMMAND) apt-key add -
	$(SUDO_COMMAND) apt-get update
	$(SUDO_COMMAND) apt-get install postgresql-client-14

.PHONY: setup-mac-lint
setup-mac-lint: setup-common-lint
# stephen.li
	brew install clang-format
# Remove after golangci-lint upgraded after 1.50.1.
# Ref: https://github.com/sourcegraph/go-diff/pull/65
	brew install diffutils
# daniel.golosow
	brew install hadolint

.PHONY: setup-linux-install
setup-linux-install:
	$(SUDO_COMMAND) apt-get update

.PHONY: setup-linux
setup-linux: ## Setup of tools for Linux
setup-linux: ## Required repo access:
setup-linux: ##   - *company-data-covered*/design-system
setup-linux: setup-linux-install setup-common-install setup-common-gen setup-linux-lint

.PHONY: setup-ci-go
setup-ci-go: ## Setup of tools for CI
setup-ci-go: setup-common-install setup-common-gen setup-linux-lint

.PHONY: setup-linux-python-gen
setup-linux-python-gen:
# the limited godeps that python needs, built from source in a
# new stage in the dockerfile due to the arm64 version not being downloadable
	go install github.com/kyleconroy/sqlc/cmd/sqlc@$(SQLC_VERSION)
	go install -tags='no_mysql no_sqlite3' github.com/pressly/goose/v3/cmd/goose@$(GOOSE_VERSION)

.PHONY: setup-linux-python
setup-linux-python: setup-linux-python-gen
	mkdir -p $(INSTALL_BIN_DIR)
	mkdir -p $(PY_PROTO_DIR)
	scripts/download-buf.sh $(INSTALL_BIN_DIR) $(BUF_VERSION)
	poetry install

.PHONY: setup-docker-go
setup-docker-go: ## Setup of Docker go build container
setup-docker-go: SUDO_COMMAND :=
setup-docker-go: setup-linux-install setup-common-gen

.PHONY: setup-mac-install-asdf-java
setup-mac-install-asdf-java:
# Ref: https://github.com/halcyon/asdf-java#macos
	grep -q "java_macos_integration_enable = yes" ~/.asdfrc || echo 'java_macos_integration_enable = yes' > ~/.asdfrc

.PHONY: setup-mac-install-asdf
setup-mac-install-asdf: setup-mac-install-asdf-java
# toliver.jue,dj.ambrisco,manu.sabherwal
	brew install asdf

	asdf plugin-add golang || true
	asdf plugin-add java || true
	asdf plugin-add gradle || true
	asdf plugin-add nodejs || true

# python install deps
	brew install openssl readline sqlite3 xz zlib tcl-tk
	asdf plugin-add python || true
	asdf plugin-add poetry || true

	asdf install

# Check that asdf has priority in PATH, or else open up instructions.
	(which go | grep asdf -q) || \
	  (echo "WARNING: asdf not in PATH. Make sure to follow instructions for adding to shell after a brew install." && \
	    open "https://asdf-vm.com/guide/getting-started.html#_3-install-asdf" && \
		false)

.PHONY: setup-mac-install-poetry
setup-mac-install-poetry:
# poetry does not differentiate between minor versions of python when
# installing envs, for example bumping from 3.10.6 to 3.10.9 won't recreate the env.
# Therefore, we will destroy + re-create the poetry env used here
# NOTE: this only recreates the python version for the poetry env at the root of services
	scripts/update-poetry-python-vers.sh  "$(shell awk '/python/ {print $$2}' .tool-versions)"
	poetry install

.PHONY:  update-python-vers
update-python-vers:
# updates all pyproject.toml files + poetry envs to be inline with the python vers in .tool-versions
	asdf install python
	scripts/update-poetry-config-python-vers.sh

.PHONY: setup-mac-install
setup-mac-install: setup-mac-install-asdf setup-mac-install-poetry
# toliver.jue,dj.ambrisco
	brew install awscli
# toliver.jue,dj.ambrisco
	brew install jq
# toliver.jue,dj.ambrisco
	brew install postgresql@14
# toliver.jue,dj.ambrisco
	brew install docker && brew link docker
# toliver.jue,dj.ambrisco
	brew install docker-compose
# toliver.jue,dj.ambrisco
	brew install colima
# dj.ambrisco,ivan.reyes
	brew install terraform
# manu.sabherwal
# needed for grpc build in gen-proto-python
	brew install cmake
# manu.sabherwal
	brew install pre-commit
	pre-commit install
# toliver.jue,stephen.li
	brew install influxdb@1
# kuang-han.huang
	brew install --cask aptible
# daniel.golosow,nik.buskirk
	brew install opa
# lucas.peterson,cesar.landeros
	brew install coreutils

.PHONY: setup-env-vars
setup-env-vars:
	scripts/download-env-secrets.sh

.PHONY: setup-mac
setup-mac: ## Setup of tools for MacOS
setup-mac: ## Required repo access:
setup-mac: ##   - *company-data-covered*/design-system
setup-mac: setup-mac-install setup-common-install setup-common-gen setup-mac-lint setup-env-vars

.PHONY: ensure-github-token
ensure-github-token: ## Ensure that GITHUB_TOKEN is set.
ensure-github-token:
	@[[ -n "$(GITHUB_TOKEN)" ]] || (echo 'Missing GITHUB_TOKEN. Please create a GitHub PAT and add it to your ~/.zshrc. The PAT should only have "read:packages" permission (https://github.com/settings/tokens/new?description=*company-data-covered*&scopes=read:packages)' && false)

.PHONY: clean-build
clean-build:
	rm -rf $(BUILD_TARGET_DIR)/*

.PHONY: clean-gen-go
clean-gen-go:
	rm -rf $(GO_GEN_DIR)

.PHONY: clean-gen-java
clean-gen-java:
	find java -name build.gradle -print0 | xargs -0 -n1 dirname | xargs -n1 gradle clean --project-dir

.PHONY: clean-gen-ts
clean-gen-ts:
	rm -rf $(TS_GEN_DIR)

.PHONY: clean-gen
# Note: clean-gen-java is intentionally not here, as Java is using Gradle, which manages state hermetically.
clean-gen: clean-gen-go clean-gen-ts

.PHONY: clean
clean: ## Cleanup all generated files and builds
clean: clean-gen clean-build

.PHONY: gen-sql
gen-sql:
	find sql -mindepth 2 -maxdepth 2 -name sqlc.yaml | xargs -n 1 sqlc generate -f

.PHONY: gen-proto-python
gen-proto-python: ## Downloads protoc and grpc binaries and configures poetry env
gen-proto-python:
	scripts/download-protoc.sh $(PY_PROTOBUF_VERSION) $(INSTALL_BIN_DIR)
	scripts/gen-py-grpc-binaries.sh $(GRPC_REPO_VERSION) $(INSTALL_BIN_DIR)
	$(INSTALL_BIN_DIR)/buf generate --template buf.gen.python.yaml
	poetry run python py/tools/scripts/scripts/refactor_protos.py $(PY_PROTO_DIR)

.PHONY: gen-proto-grpc-checks
gen-proto-grpc-checks: ## Creates version files for circleci to restore protoc and grpc caches
gen-proto-grpc-checks:
	echo '$(PY_PROTOBUF_VERSION)' > proto.version
	echo '$(GRPC_REPO_VERSION)' > grpc.version

.PHONY: test-python
test-python: ## Runs all pytests in py directory, storing results in a 'generated/test' folder
test-python: gen-proto-python gen-sql
	find $(CURDIR)/py -name 'tests' -print0 | xargs -0 -n1 dirname | xargs -n1 $(CURDIR)/scripts/run-poetry-tests.sh
	find $(CURDIR)/py -name '.coverage.*' | xargs poetry run coverage combine --keep
	poetry run coverage xml

test-python-%: ## Runs pytests only on the directory specified
test-python-%: gen-proto-python gen-sql
	find $(CURDIR)/py/ -name '$(*F)' -print0 | xargs -0 -n1 dirname | xargs -n1 $(CURDIR)/scripts/run-poetry-tests.sh

run-python-server-%: ## Runs server.py from the directory specified
run-python-server-%: gen-proto-python
	$(CURDIR)/scripts/run-grpc-proxy-server.sh &
	$(CURDIR)/scripts/run-poetry-server.sh $(*F)

.PHONY: test-telep-model-server
test-telep-model-server: ## runs a simple integration test for telep model server
test-telep-model-server: gen-proto-python gen-sql
	cd $(CURDIR)/py/projects/telep_model_server && poetry install && poetry run python tests/integration_test_gha.py

.PHONY: gen-proto-ts
gen-proto-ts:
	$(INSTALL_BIN_DIR)/buf generate --template buf.gen.ts.yaml

.PHONY: gen-proto-openapi
gen-proto-openapi:
	$(INSTALL_BIN_DIR)/buf generate --template buf.gen.openapi.yaml

.PHONY: gen-proto-go
gen-proto-go:
	$(INSTALL_BIN_DIR)/buf generate --template buf.gen.go.yaml

.PHONY: gen-proto
gen-proto: ##NOTE: builds rely on gen-proto to generate golang protos, and can't afford the
gen-proto: ##      cost of installing other proto deps, so will only gen golang protos for now
gen-proto: gen-proto-go

.PHONY: generate
generate: clean-gen gen-proto gen-sql

.PHONY: generate-ts
generate-ts: clean-gen-ts gen-proto-ts

.PHONY: generate-ts-caremanager
generate-ts-caremanager: generate-ts
	$(INSTALL_BIN_DIR)/buf generate --template buf.gen.caremanager.yaml --path proto/caremanager/service.proto
	rm -rf $(TS_GEN_CAREMANAGER_DIR)
	npx @openapitools/openapi-generator-cli@2.7.0 generate

.PHONY: lint-go
lint-go: generate
	$(INSTALL_BIN_DIR)/golangci-lint run --build-tags="$(GO_DB_TEST_BUILD_TAGS)" $(CURDIR)/go/...

.PHONY: lint-markdown
lint-markdown:
	$(PRETTIER_LINT) $(MARKDOWN_FILES)

.PHONY: lint-yaml
lint-yaml:
	$(PRETTIER_LINT) $(YAML_FILES)

.PHONY: lint-json
lint-json:
	$(PRETTIER_LINT) $(JSON_FILES)

.PHONY: lint-js
lint-js:
	$(PRETTIER_LINT) $(JS_FILES)

lint-ts: ## Lints all TS projects
lint-ts:
	npx nx run-many --target=lint

.PHONY: lint-sql
lint-sql:
	find sql -type f \( -name '*.sql' ! -path 'sql/*/schema.sql' \) | xargs -n 1 -P0 -I {} \
		$(SQL_FORMATTER) --check-diff {}

.PHONY: lint-proto
lint-proto:
	find proto -name '*.proto' | xargs $(CLANG_LINT)
	$(INSTALL_BIN_DIR)/buf lint

	find proto -type f \( -name '*.proto' ! -path 'proto/common/*' \) | xargs -n 1 -P0 sh -c 'grep -H "^option ruby_package = \".*GRPC\"\;" $$0 || (echo $$0: missing ruby_package && exit 255)'

.PHONY: lint-java
lint-java:
	find java -mindepth 1 -maxdepth 1 -type d | xargs -n 1 -I {} \
		sh -c 'cd {} && gradle spotlessCheck'

.PHONY: lint-terraform
lint-terraform:
	terraform fmt -recursive -check ./infra

.PHONY: lint-docker
lint-docker:
	hadolint docker/*.Dockerfile --verbose

.PHONY: lint-opa
lint-opa:
	opa fmt $(CURDIR)/$(OPA_BUNDLE) --fail --list

.PHONY: lint
# Note: lint-java is intentionally not here, as this forces everyone to run Java/Gradle.
# Note: lint-terraform is intentionally not here,
#       as this forces our Go CircleCI config to include the binary when it's otherwise checked by a separate CircleCI config.
lint: ## Lint all files
lint: lint-go lint-markdown lint-yaml lint-json lint-js lint-ts lint-sql lint-proto lint-docker

.PHONY: format-markdown
format-markdown:
	$(PRETTIER_FORMAT) $(MARKDOWN_FILES)

.PHONY: format-yaml
format-yaml:
	$(PRETTIER_FORMAT) $(YAML_FILES)

.PHONY: format-json
format-json:
	$(PRETTIER_FORMAT) $(JSON_FILES)

.PHONY: format-js
format-js:
	$(PRETTIER_FORMAT) $(JS_FILES)

.PHONY: format-ts
format-ts:
	npx nx format

.PHONY: format-sql
format-sql:
	find sql -type f \( -name '*.sql' ! -path 'sql/*/schema.sql' \) | xargs -n 1 -P $(shell nproc) -I {} \
		$(SQL_FORMATTER) --output {} {}

.PHONY: format-go
format-go:
	# Note: not all linters support auto-fix: https://golangci-lint.run/usage/linters/
	$(INSTALL_BIN_DIR)/golangci-lint run --build-tags="$(GO_DB_TEST_BUILD_TAGS)" $(CURDIR)/go/... --fix

.PHONY: format-proto
format-proto:
	find proto -name '*.proto' | xargs $(CLANG_FORMAT)

.PHONY: format-java
format-java:
	find java -mindepth 1 -maxdepth 1 -type d | xargs -n 1 -I {} \
		sh -c 'cd {} && gradle spotlessApply'

.PHONY: format-terraform
format-terraform:
	terraform fmt -recursive ./infra

.PHONY: format-opa
format-opa:
	opa fmt $(CURDIR)/$(OPA_BUNDLE) --write

.PHONY: format
# Note: format-java is intentionally not here, as this forces everyone to run Java/Gradle.
format: ## Auto format code
format: format-go format-markdown format-yaml format-json format-js format-ts format-sql format-proto format-terraform

build-go-%: generate
	CGO_ENABLED=0 go build $(GO_BUILD_FLAGS) -o $(BUILD_TARGET_DIR)/go/cmd/$(*F)/$(*F) $(CURDIR)/go/cmd/$(*F)/

.PHONY: build-go
build-go: generate
	mkdir -p $(BUILD_TARGET_DIR)
	go build $(GO_BUILD_FLAGS) -o $(BUILD_TARGET_DIR) $(CURDIR)/go/cmd/...

.PHONY: build-test-db-go
build-test-db-go: ## Builds all test code, including with db tests.
build-test-db-go: generate
	go list $(CURDIR)/go/... | grep -v generated | xargs -n 1 go test $(GO_BUILD_FLAGS) $(GO_DB_TEST_FLAGS) -c

run-go-%: ## Run a Go server
run-go-%: build-go-% nobuild-run-go-%
	true

nobuild-run-go-%:
	$(BUILD_TARGET_DIR)/go/cmd/$(*F)/$(*F)

run-ts-%: ## Run a TS application
run-ts-%:
	npx nx serve $(*F)

test-ts-e2e-watch-%: ## Runs E2E tests in watch mode for a TS project
test-ts-e2e-watch-%:
	npx nx e2e $(*F) --watch

test-ts-e2e-%: ## Runs E2E tests for a TS project
test-ts-e2e-%:
	npx nx e2e $(*F)

test-ts-%: ## Test a TS project
test-ts-%:
	npx nx test $(*F)

build-ts-%: ## Build a TS project
build-ts-%:
	npx nx build $(*F)

.PHONY: build-ts
build-ts: ## Builds all TS projects
build-ts:
	npx nx run-many --target=build

.PHONY: test-ts
test-ts: ## Tests all TS projects and runs test coverage
test-ts:
	npx nx run-many --target=test --code-coverage --coverageReporters=lcov

test-go-pkg-%: generate
	$(GOTESTSUM_COMMAND) -- $(GO_BUILD_FLAGS) $(GO_TEST_FLAGS) $(CURDIR)/go/pkg/$(*F)/...

test-go-%: generate
	$(GOTESTSUM_COMMAND) -- $(GO_BUILD_FLAGS) $(GO_TEST_FLAGS) $(CURDIR)/go/cmd/$(*F)/...

test-db-go-pkg-%: generate
	$(GOTESTSUM_COMMAND) -- $(GO_BUILD_FLAGS) $(GO_DB_TEST_FLAGS) $(GO_TEST_FLAGS) $(CURDIR)/go/pkg/$(*F)/...

test-db-go-%: generate
	$(GOTESTSUM_COMMAND) -- $(GO_BUILD_FLAGS) $(GO_DB_TEST_FLAGS) $(GO_TEST_FLAGS) $(CURDIR)/go/cmd/$(*F)/...

.PHONY: test-go
test-go: ## Runs all tests that don't use the database.
test-go: generate
	go list $(CURDIR)/go/... | grep -v generated | xargs $(GOTESTSUM_COMMAND) -- $(GO_BUILD_FLAGS) $(GO_TEST_FLAGS)

.PHONY: test-db-go
test-db-go: ## Runs all tests, including those that use database.
test-db-go: --db-check-base-url generate
	go list $(CURDIR)/go/... | grep -v generated | xargs $(GOTESTSUM_COMMAND) -- $(GO_BUILD_FLAGS) $(GO_DB_TEST_FLAGS) $(GO_TEST_FLAGS)

.PHONY: test-opa
test-opa: ## Runs OPA policy tests
test-opa:
	opa test $(CURDIR)/${OPA_BUNDLE} --verbose

.PHONY: test-opa-coverage
test-opa-coverage: ## Returns OPA test coverage percentage
test-opa-coverage:
	@opa test $(CURDIR)/${OPA_BUNDLE} --coverage | jq ".coverage"

benchmark-go-%: generate
	go test $(GO_BUILD_FLAGS) -bench=$(BENCH) -run ^$$ $(CURDIR)/go/cmd/$(*F)/...

benchmark-db-go-pkg-%: generate
	go test $(GO_BUILD_FLAGS) $(GO_DB_TEST_FLAGS) -bench=$(BENCH) -run ^$$ $(CURDIR)/go/pkg/$(*F)/...

benchmark-db-go-%: generate
	go test $(GO_BUILD_FLAGS) $(GO_DB_TEST_FLAGS) -bench=$(BENCH) -run ^$$ $(CURDIR)/go/cmd/$(*F)/...

build-java-%:
	cd $(CURDIR)/java/$(*F) && gradle build $(GRADLE_BUILD_FLAGS)

run-java-%:
	cd $(CURDIR)/java/$(*F) && gradle run $(GRADLE_BUILD_FLAGS)

test-java-%:
	cd $(CURDIR)/java/$(*F) && gradle test $(GRADLE_BUILD_FLAGS)

benchmark-java-%:
	cd $(CURDIR)/java/$(*F) && gradle benchmark $(GRADLE_BUILD_FLAGS)

run-docker-%: ensure-docker
	docker-compose -p $(*F) -f $(CURDIR)/docker/compose/docker-compose-$(*F).yaml up

.PHONY: --db-check-url
--db-check-url:
	@[[ -n "$(DATABASE_URL)" ]] || (echo "No DATABASE_URL set" && false)

.PHONY: --db-check-base-url
--db-check-base-url:
	@[[ -n "$(BASE_DATABASE_URL)" ]] || (echo "No BASE_DATABASE_URL set" && false)

 --db-check-target-migration-%:
ifneq ($(TARGET_DATABASE_VERSION),)
	find $(CURDIR)/sql/$(*F)/migrations/$(TARGET_DATABASE_VERSION)_*.sql || (echo "No migration found for version: $(TARGET_DATABASE_VERSION)" && false)
else
	@true
endif

db-migrate-%: ## Migrate a database to either latest or TARGET_DATABASE_VERSION.
db-migrate-%: --db-check-url --db-check-target-migration-%
ifneq ("$(TARGET_DATABASE_VERSION)","")
	echo "Migrating \"$(*F)\" to version=$(TARGET_DATABASE_VERSION)"
	"$(INSTALL_BIN_DIR)/goose" -dir "$(CURDIR)/sql/$(*F)/migrations" -table schema_migrations postgres "${DATABASE_URL}" up-to "$(TARGET_DATABASE_VERSION)"
else
	echo "Migrating \"$(*F)\" to latest version"
	"$(INSTALL_BIN_DIR)/goose" -dir "$(CURDIR)/sql/$(*F)/migrations" -table schema_migrations postgres "${DATABASE_URL}" up
endif

db-rollback-%: ## Rollback a single database migration or to TARGET_DATABASE_VERSION.
db-rollback-%: --db-check-url --db-check-target-migration-%
ifneq ("$(TARGET_DATABASE_VERSION)","")
	echo "Rolling back \"$(*F)\" to version=$(TARGET_DATABASE_VERSION)"
	"$(INSTALL_BIN_DIR)/goose" -dir "$(CURDIR)/sql/$(*F)/migrations" -table schema_migrations postgres "${DATABASE_URL}" down-to "$(TARGET_DATABASE_VERSION)"
else
	echo "Rolling back \"$(*F)\" to previous version"
	"$(INSTALL_BIN_DIR)/goose" -dir "$(CURDIR)/sql/$(*F)/migrations" -table schema_migrations postgres "${DATABASE_URL}" down
endif

db-reset-%: --db-check-url
	"$(INSTALL_BIN_DIR)/goose" -dir "$(CURDIR)/sql/$(*F)/migrations" -table schema_migrations postgres "${DATABASE_URL}" reset

db-status-%: --db-check-url
	"$(INSTALL_BIN_DIR)/goose" -dir "$(CURDIR)/sql/$(*F)/migrations" -table schema_migrations postgres "${DATABASE_URL}" status

db-create-migration-%:
	mkdir -p "$(CURDIR)/sql/$(*F)/migrations"
	"$(INSTALL_BIN_DIR)/goose" -dir "$(CURDIR)/sql/$(*F)/migrations" -table schema_migrations postgres "UNNEEDED_DATABASE_URL" create "$(name)" sql

.PHONY: ensure-docker
ensure-docker:
	docker info >/dev/null 2>&1 || colima start --cpu 4 --memory 8 --disk 50

docker-build-go-%: export DOCKER_IMAGE_TAG ?= $(*F):latest
docker-build-go-%: export DOCKER_PORT ?= 0
docker-build-go-%:
	docker build --platform $(DOCKER_TARGET_ARCH) -t $(DOCKER_IMAGE_TAG) --build-arg DOCKER_PORT="$(DOCKER_PORT)" --build-arg BUILD_TARGET=$(*F) --build-arg VERSION=$(VERSION) -f docker/go.Dockerfile .

docker-build-java-%: export DOCKER_IMAGE_TAG ?= $(*F):latest
docker-build-java-%:
	cd $(CURDIR)/java/$(*F) && gradle jibDockerBuild --image=$(DOCKER_IMAGE_TAG) -PdockerArch=$(DOCKER_TARGET_ARCH) $(GRADLE_BUILD_FLAGS)

docker-build-python-%: export DOCKER_IMAGE_TAG ?= $(*F):latest
docker-build-python-%: export DOCKER_PORT ?= 10000 50051
docker-build-python-%: export HEALTHCHECK_PORT ?= 10000
docker-build-python-%:
	docker build --platform $(DOCKER_TARGET_ARCH) -t $(DOCKER_IMAGE_TAG) \
	--build-arg GRPC_REPO_VERSION=$(GRPC_REPO_VERSION) \
	--build-arg PY_PROTOBUF_VERSION=$(PY_PROTOBUF_VERSION) \
	--build-arg BUILD_TARGET=$(subst -,_,$(*F)) \
	--build-arg DOCKER_PORT="$(DOCKER_PORT)" \
	--build-arg BUF_VERSION=$(BUF_VERSION) \
	--build-arg GIT_SHA=$(VERSION) \
	--build-arg PYTHON_VERS=$(PYTHON_VERS) \
	-f docker/python.Dockerfile .

docker-build-opa: export DOCKER_IMAGE_TAG ?= opa:latest
docker-build-opa:
	docker build --platform $(DOCKER_TARGET_ARCH) -t $(DOCKER_IMAGE_TAG) \
	--build-arg BUNDLE=$(OPA_BUNDLE) \
	-f docker/opa.Dockerfile .

.PHONY: clean-dev-db
clean-dev-db: ensure-docker
	docker-compose -p $(DOCKER_COMPOSE_DEV_DB_PROJECT) -f $(CURDIR)/docker/compose/docker-compose-postgres.yaml down --volumes

.PHONY: stop-dev-db
stop-dev-db: ensure-docker
	docker-compose -p $(DOCKER_COMPOSE_DEV_DB_PROJECT) -f $(CURDIR)/docker/compose/docker-compose-postgres.yaml down

.PHONY: run-dev-db
run-dev-db: ensure-docker
	docker-compose -p $(DOCKER_COMPOSE_DEV_DB_PROJECT) -f $(CURDIR)/docker/compose/docker-compose-postgres.yaml up --detach

.PHONY: wait-dev-db
wait-dev-db: run-dev-db
	scripts/wait-for-postgres.sh 20 0.2 $(DEV_DB_POSTGRESQL_PORT)

ensure-dev-db-%: ## Ensure a service database exists with all migrations for a single database schema
ensure-dev-db-%: export DB_POSTGRESQL_PORT=$(DEV_DB_POSTGRESQL_PORT)
ensure-dev-db-%: wait-dev-db ensure-test-db-%
	@true

.PHONY: ensure-dev-db
ensure-dev-db: $(patsubst sql/%/,ensure-dev-db-%,$(wildcard sql/*/))

ensure-test-db-%: export BASE_DATABASE_URL=postgres://postgres@localhost:$(DB_POSTGRESQL_PORT)/?sslmode=disable
ensure-test-db-%: export DATABASE_URL=postgres://postgres@localhost:$(DB_POSTGRESQL_PORT)/$(subst -,_,$(*F))?sslmode=disable
ensure-test-db-%:
	echo "SELECT 'CREATE DATABASE $(subst -,_,$(*F))' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$(subst -,_,$(*F))')\gexec" | psql "$(BASE_DATABASE_URL)"
	$(MAKE) db-migrate-$(*F)
	$(MAKE) dump-db-schema-$(*F)

reset-dev-db-%: ## Reset a service database using all the down migrations for a single database schema
reset-dev-db-%: export DB_POSTGRESQL_PORT=$(DEV_DB_POSTGRESQL_PORT)
reset-dev-db-%: wait-dev-db
	$(MAKE) reset-test-db-$(*F)

.PHONY: reset-dev-db
reset-dev-db: $(patsubst sql/%/,reset-dev-db-%,$(wildcard sql/*/))

reset-test-db-%: export BASE_DATABASE_URL=postgres://postgres@localhost:$(DB_POSTGRESQL_PORT)/?sslmode=disable
reset-test-db-%: export DATABASE_URL=postgres://postgres@localhost:$(DB_POSTGRESQL_PORT)/$(subst -,_,$(*F))?sslmode=disable
reset-test-db-%:
	$(MAKE) db-reset-$(*F)

.PHONY: ensure-test-db
ensure-test-db:
	find sql -mindepth 1 -maxdepth 1 -type d -print0| xargs -0 -n1 basename | xargs -n1 -I {} $(MAKE) ensure-test-db-{}

.PHONY: reset-test-db
reset-test-db:
	find sql -mindepth 1 -maxdepth 1 -type d -print0| xargs -0 -n1 basename | xargs -n1 -I {} $(MAKE) reset-test-db-{}

connect-dev-db-%:
	psql -h localhost -p $(DEV_DB_POSTGRESQL_PORT) -U postgres $(*F)

dump-db-schema-%:
	pg_dump -h localhost -p $(DB_POSTGRESQL_PORT) -U postgres -d $(subst -,_,$(*F)) \
		--schema-only \
		--no-owner \
		--no-privileges \
		--no-publications \
		--no-subscriptions \
		--no-tablespaces \
		| grep -v -e "Dumped by pg_dump" -e "Dumped from database version" > $(CURDIR)/sql/$(*F)/schema.sql

.PHONY: ensure-dev-monitoring
ensure-dev-monitoring: ## Run influxDB and grafana locally. If there are new changes to be picked up, recreate the containers.
ensure-dev-monitoring: ensure-docker
	docker-compose -p ${DOCKER_COMPOSE_DEV_MONITORING_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-monitoring.yaml up --detach

.PHONY: connect-dev-monitoring
connect-dev-monitoring: ensure-dev-monitoring
	/opt/homebrew/opt/influxdb@1/bin/influx

.PHONY: clean-dev-monitoring
clean-dev-monitoring: ## Stop running influxDB and grafana locally
clean-dev-monitoring: ensure-docker
	docker-compose -p ${DOCKER_COMPOSE_DEV_MONITORING_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-monitoring.yaml down --volumes

.PHONY: run-dev-elasticsearch
run-dev-elasticsearch: ensure-docker
	docker-compose -p ${DOCKER_COMPOSE_DEV_ELASTICSEARCH_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-elasticsearch.yaml up --detach

.PHONY: wait-dev-elasticsearch
wait-dev-elasticsearch: run-dev-elasticsearch
	scripts/wait-for-elasticsearch.sh 20 1.5 $(DEV_ELASTICSEARCH_PORT)

.PHONY: ensure-dev-elasticsearch
ensure-dev-elasticsearch: ## Run elasticsearch locally
ensure-dev-elasticsearch: wait-dev-elasticsearch
	@true

.PHONY: clean-dev-elasticsearch
clean-dev-elasticsearch: ## Stop running elasticsearch locally
clean-dev-elasticsearch: ensure-docker
	docker-compose -p ${DOCKER_COMPOSE_DEV_ELASTICSEARCH_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-elasticsearch.yaml down --volumes

.PHONY: ensure-dev-kafka
ensure-dev-kafka: ## Run Kafka and Zookeeper locally.
ensure-dev-kafka:
	docker-compose -p ${DOCKER_COMPOSE_DEV_KAFKA_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-kafka.yaml up --detach

.PHONY: clean-dev-kafka
clean-dev-kafka: ## Stop running Kafka and Zookeeper locally
clean-dev-kafka:
	docker-compose -p ${DOCKER_COMPOSE_DEV_KAFKA_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-kafka.yaml down --volumes

.PHONY: ensure-dev-redis
ensure-dev-redis: ## Run Redis locally
ensure-dev-redis:
	docker-compose -p ${DOCKER_COMPOSE_DEV_REDIS_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-redis.yaml up --detach

.PHONY: clean-dev-redis
clean-dev-redis: ## Stop running Redis locally
clean-dev-redis:
	docker-compose -p ${DOCKER_COMPOSE_DEV_REDIS_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-redis.yaml down --volumes

.PHONY: ensure-dev-opa
ensure-dev-opa: ## Run custom OPA locally
ensure-dev-opa:
	docker-compose -p ${DOCKER_COMPOSE_DEV_OPA_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-opa.yaml up --build --detach

.PHONY: clean-dev-opa
clean-dev-opa: ## Stop running the custom OPA locally
clean-dev-opa:
	docker-compose -p ${DOCKER_COMPOSE_DEV_OPA_PROJECT} -f $(CURDIR)/docker/compose/docker-compose-opa.yaml down

.PHONY: opa-repl
opa-repl: ## Read-eval-print-loop for testing OPA policies
opa-repl:
	 opa run -b ${OPA_BUNDLE}

help:
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2} '
