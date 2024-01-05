package monitoring

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestTags(t *testing.T) {
	tags := Tags{
		"abc": "def",
		"boo": "baz",
	}

	tags2 := tags.Clone()
	testutils.MustMatch(t, tags, tags2)

	tags2["foo"] = "fum"
	testutils.MustMatch(t, len(tags)+1, len(tags2), "tags2 should have one more element than tags")
}
