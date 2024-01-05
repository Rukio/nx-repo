// Package attributes contains utilities for mapping attribute names back and forth
// across the logistics service boundary in a backward-compatible manner, allowing
// for renaming attributes safely.
//
// Suggested Workflow to safely introduce an attribute-rename on Station:
//  1. Have an attribute that we want to rename for some reason, e.g. "accidental_obscenity"
//  2. Add "accidental_obscenity" to the externalToInternal mapping, picking a better name
//  3. Merge and deploy logistics service (optimizer service is stateless, so we don't care there)
//  4. Merge and deploy the station change to rename "accidental_obscenity" to the desired value.
//
// Happy renaming!
package attributes

import (
	"fmt"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
)

// ExternalAttribute is an alias for *commonpb.Attribute to support backwards compatibility.
// It represents an attribute name outside the logistics service boundary, thus all internal
// attributes must be mapped back into external attributes before leaving that boundary.
type ExternalAttribute commonpb.Attribute

// ExternalAttributes allows for easy mapping for a slice of external attributes.
type ExternalAttributes []*ExternalAttribute

// InternalAttribute is an alias for *commonpb.Attribute to support backwards compatibility.
// It represents an attribute within the logistics service boundary, thus all external
// attributes must be mapped back into internal attributes when entering that boundary.
type InternalAttribute commonpb.Attribute

// InternalAttributes allows for easy mapping for a slice of internal attributes.
type InternalAttributes []*InternalAttribute

// Attributes makes it simple to export to Internal/External if their provenance is not known.
type Attributes []*commonpb.Attribute

func invertAndValidate(in map[string]string) (map[string]string, error) {
	res := make(map[string]string, len(externalToInternal))
	for k, v := range in {
		if old, ok := res[v]; ok {
			return nil, fmt.Errorf("only 1-1 attribute name mappings are supported: %s and %s cannot both map to %s", old, k, v)
		}
		if old, ok := res[k]; ok {
			return nil, fmt.Errorf("degree 2 cycle found in externalToInternal mapping: %s -> %s -> %s", k, old, v)
		}
		res[v] = k
	}
	return res, nil
}

var (
	externalToInternal = map[string]string{
		"skill_id:52": "shift_type:acute_care",
	}

	internalToExternal = func() map[string]string {
		inverted, err := invertAndValidate(externalToInternal)
		if err != nil {
			panic(err)
		}
		return inverted
	}()
)

func (a *ExternalAttribute) ToInternal() *InternalAttribute {
	if internal, ok := externalToInternal[a.Name]; ok {
		return &InternalAttribute{Name: internal}
	}
	return &InternalAttribute{Name: a.Name}
}

func (a *InternalAttribute) ToExternal() *ExternalAttribute {
	if external, ok := internalToExternal[a.Name]; ok {
		return &ExternalAttribute{Name: external}
	}
	return &ExternalAttribute{Name: a.Name}
}

func (as ExternalAttributes) ToInternal() InternalAttributes {
	if as == nil {
		return nil
	}
	res := make(InternalAttributes, len(as))
	for i, a := range as {
		res[i] = a.ToInternal()
	}
	return res
}

func (as InternalAttributes) ToExternal() ExternalAttributes {
	if as == nil {
		return nil
	}
	res := make(ExternalAttributes, len(as))
	for i, a := range as {
		res[i] = a.ToExternal()
	}
	return res
}

func (as Attributes) ToInternal() InternalAttributes {
	if as == nil {
		return nil
	}
	res := make(InternalAttributes, len(as))
	for i, a := range as {
		res[i] = (&ExternalAttribute{Name: a.Name}).ToInternal()
	}
	return res
}

func (as Attributes) ToExternal() ExternalAttributes {
	if as == nil {
		return nil
	}
	res := make(ExternalAttributes, len(as))
	for i, a := range as {
		res[i] = (&InternalAttribute{Name: a.Name}).ToExternal()
	}
	return res
}

func (as ExternalAttributes) ToCommon() []*commonpb.Attribute {
	if as == nil {
		return nil
	}
	res := make([]*commonpb.Attribute, len(as))
	for i, a := range as {
		res[i] = &commonpb.Attribute{Name: a.Name}
	}
	return res
}

func (as InternalAttributes) ToCommon() []*commonpb.Attribute {
	if as == nil {
		return nil
	}
	res := make([]*commonpb.Attribute, len(as))
	for i, a := range as {
		res[i] = &commonpb.Attribute{Name: a.Name}
	}
	return res
}
