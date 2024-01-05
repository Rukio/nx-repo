package monitoring

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestNoopScope(t *testing.T) {
	s := &NoopScope{}
	s1 := s.With("abc", nil, nil)
	testutils.MustMatch(t, s, s1)

	s1.WritePoint("name", nil, nil)
}
