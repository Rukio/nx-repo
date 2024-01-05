package validation

import (
	"fmt"
	"testing"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

var (
	validatorNonRecoverableErr = func(_ *optimizerpb.VRPProblem) *Error {
		return &Error{
			Name:        "non_recoverable_error",
			Msg:         "non recoverable error",
			Recoverable: false,
		}
	}
	validatorRecoverableErr = func(_ *optimizerpb.VRPProblem) *Error {
		return &Error{
			Name:        "recoverable_error",
			Msg:         "recoverable error",
			Recoverable: true,
		}
	}
	validatorSuccessful = func(_ *optimizerpb.VRPProblem) *Error {
		return nil
	}
)

func TestValidator(t *testing.T) {
	tcs := []struct {
		Desc              string
		Validators        []ProblemValidator
		FailOnRecoverable bool

		HasError bool
	}{
		{Desc: "happy case", FailOnRecoverable: true, Validators: []ProblemValidator{validatorSuccessful}},
		{Desc: "recoverable error no fail", FailOnRecoverable: false, Validators: []ProblemValidator{validatorRecoverableErr, validatorSuccessful}},
		{Desc: "recoverable error with fail", FailOnRecoverable: true, HasError: true, Validators: []ProblemValidator{validatorRecoverableErr, validatorSuccessful}},
		{Desc: "non-recoverable error fails regardless", FailOnRecoverable: false, HasError: true, Validators: []ProblemValidator{validatorNonRecoverableErr, validatorNonRecoverableErr}},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			v := &Validator{
				config: Config{FailOnRecoverableError: tc.FailOnRecoverable, ProblemValidators: tc.Validators},
				scope:  monitoring.NewMockScope(),
			}
			err := v.Validate(nil /* the problem doesn't matter for these tests */)
			testutils.MustMatch(t, true, tc.HasError == (err != nil), fmt.Sprintf("%v", err))
		})
	}
}
