package monitoring

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestMockScope(t *testing.T) {
	ms := NewMockScope()

	name := "name"
	tags := Tags{"tag_1": "tag_1_val"}
	fields := Fields{"field_1": "field_1_val"}
	fields2 := Fields{"field_2": "field_2_val"}

	ms.WritePoint(name, tags, fields)
	testutils.MustMatch(t, 1, len(ms.capturedPoints[name]))
	testutils.MustMatch(t, ms.capturedPoints[name][0], capturedArgs{
		name:   name,
		tags:   tags,
		fields: fields,
	})
	ms.WritePoint(name, tags, fields2)
	testutils.MustMatch(t, 2, len(ms.capturedPoints[name]))
	testutils.MustMatch(t, ms.capturedPoints[name][1], capturedArgs{
		name:   name,
		tags:   tags,
		fields: fields2,
	})
	scoped := ms.With(name, tags, fields).(*MockScope)
	testutils.MustMatch(t, ms, scoped, "the mock scope isn't copied, it simply captures the args")

	testutils.MustMatch(t, 1, len(scoped.capturedWith[name]))
	testutils.MustMatch(t, scoped.capturedWith[name][0], capturedArgs{
		name:   name,
		tags:   tags,
		fields: fields,
	})
	ms.With(name, tags, fields2)
	testutils.MustMatch(t, 2, len(scoped.capturedWith[name]))
	testutils.MustMatch(t, scoped.capturedWith[name][1], capturedArgs{
		name:   name,
		tags:   tags,
		fields: fields2,
	})
}
