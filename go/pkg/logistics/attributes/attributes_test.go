package attributes

import (
	"testing"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestRoundTrip(t *testing.T) {
	unmappedAttr := &commonpb.Attribute{Name: "unmapped attr"}
	mappedInternalAttrName := "shift_type:acute_care"
	attributes := []*commonpb.Attribute{
		unmappedAttr,
		{Name: mappedInternalAttrName},
	}
	testutils.MustMatch(t, []*commonpb.Attribute{unmappedAttr, {Name: internalToExternal[mappedInternalAttrName]}},
		Attributes(attributes).ToExternal().ToCommon())

	testutils.MustMatch(t,
		attributes,
		Attributes(attributes).ToInternal().ToCommon(),
	)

	testutils.MustMatch(t,
		attributes,
		Attributes(Attributes(attributes).ToInternal().ToExternal().ToInternal().ToCommon()).ToExternal().ToInternal().ToCommon(),
	)
}

func TestRoundTripNils(t *testing.T) {
	var nilAttributes Attributes
	testutils.MustMatch(t, true,
		Attributes(nilAttributes.ToExternal().ToInternal().ToExternal().ToCommon()).ToInternal().ToCommon() == nil,
		"nil is preserved",
	)
}

func TestInvalidMapping(t *testing.T) {
	_, err := invertAndValidate(externalToInternal)
	testutils.MustMatch(t, true, err == nil, "must be valid in production")

	_, err = invertAndValidate(internalToExternal)
	testutils.MustMatch(t, true, err == nil, "and the inverse must be valid in production")

	_, err = invertAndValidate(map[string]string{"a": "b", "c": "b"})
	testutils.MustMatch(t, false, err == nil, "two externals can't map to the same internal")

	_, err = invertAndValidate(map[string]string{"a": "b", "b": "a"})
	testutils.MustMatch(t, false, err == nil, "degree two cycle is invalid")
}
