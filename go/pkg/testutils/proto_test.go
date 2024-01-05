package testutils

import (
	"testing"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
)

func TestExampleAssertExhaustiveOneOfMapping(t *testing.T) {
	AssertExhaustiveOneOfMapping(t,
		&logisticspb.ShiftTeamRestBreakRequest{},
		// break_type is the proto one_of that we're looking for, and the map are the ones we've handled.
		"break_type", []string{"on_demand"},
		// For this test in particular... simply add the new types to the array above.
		//
		// And a descriptive message letting the dev know what to do when this trap test is triggered.
		"upon failure of this proto trap test, implement whatever logic it was trying "+
			"to enforce; then add the one_of option to the map above (either in this PR, or by associating) a "+
			"// TODO(JIRA-REF) ticket at the point of interest where logic needs to be implemented",
	)
}
