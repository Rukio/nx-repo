// Package validation provides a validation utility on optimizer inputs in order
// to limit the scope of impact of unexpected data on market optimization runs.
// It emits metrics in a consistent fashion to rapidly diagnose recoverable and
// non-recoverable errors, and steadily improve upstream data sources.
package validation

import (
	"fmt"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

// NoValidationConfig is a config that does not validate the problem.
var NoValidationConfig Config

// Error is a structured error type used by the validation package to
// handle consistent metrics reporting and business logic surrounding recoverability.
type Error struct {
	// Name is a lower-cardinality metrics reporting tag than Msg.
	Name string
	// Msg is a descriptive message about the error.
	Msg string
	// Recoverable is whether an error condition can be fixed-forward during the validation action.
	// If false, a validation error will kill the optimization run.
	Recoverable bool
	// Fields are additional fields for metrics reporting -- e.g. the invalid shift_team_id.
	Fields monitoring.Fields
}

// Error implements error.Error.
func (e *Error) Error() string {
	return e.Msg
}

type Config struct {
	// FailOnRecoverableError configures whether encountering a recoverable error will bubble up
	// to the caller as an invalid problem, instead of allowing fix-forward behavior.
	// Should likely be true in dev, but false in prod in order to protect our system's healthy operations.
	FailOnRecoverableError bool

	// ProblemValidators to run on the problem.
	ProblemValidators []ProblemValidator
}

type Validator struct {
	config Config
	scope  monitoring.Scope
}

// ProblemValidator validates a problem, and can mutate it for "recoverable" errors.
type ProblemValidator func(problem *optimizerpb.VRPProblem) *Error

// NewValidator initializes a validator runner with supplied configuration.
// For best results, consider passing in a scope with the optimizer run ID passed in as a field.
func NewValidator(sc monitoring.Scope, cfg Config) *Validator {
	return &Validator{config: cfg, scope: sc.With("validation", nil, nil)}
}

// Validate validates a problem;  fixing-forward recoverable errors when encountered.
func (v *Validator) Validate(problem *optimizerpb.VRPProblem) error {
	for _, validator := range v.config.ProblemValidators {
		if err := validator(problem); err != nil {
			v.scope.WritePoint("error", monitoring.Tags{"name": err.Name, "recoverable": fmt.Sprintf("%t", err.Recoverable)}, err.Fields)
			if !err.Recoverable || v.config.FailOnRecoverableError {
				return err
			}
		}
	}
	return nil
}
