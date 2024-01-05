package featureflags

import (
	"encoding/json"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
)

// A feature flag is defined for a specific data type.  The feature flag receives a Feature Flag Provider
// relevant to its type and which has the responsibility of resolving the flag value for the feature flag.
// A provider implements whatever semantics are relevant to its data source in order to provide the value
// to the feature flag.
//
// Example Usage:
//
//   // Create the flag and provide a provider
//   boolFlag := ff.NewBooleanFlag("FEATURE_ENABLED", true)
//   envProvider := ffp.NewEnvProvider()
//   featureEnabled := boolFlag.Get(envProvider)
//   if featureEnabled {
//     fmt.Println("enabled")
//   }
//
//  // If it is desirable to use a flag without tracking the provider, the provider can be attached to the flag
//  // at definition using the `New<FlagType>Evaluator` functions
//  envProvider := ffp.NewEnvProvider()
//  boolFlag := ff.NewBooleanFlagEvaluator("FEATURE_ENABLED", true, envProvider)
//  boolValue := boolFlag()
//
//  // Organization:
//  // A struct could be used strictly for organizing relevant flags in a central access point.
//  type MyFlags struct {
//    FeatureEnabled  BooleanFlagEvaluator
//  }
//  myFlags := MyFlags{
//    FeatureEnabled: ff.NewBooleanFlagEvaluator("FEATURE_ENABLED", true, envProvider)
//  }
//  enabled := myFlags.FeatureEnabled()
//
//  // Resolution Semantics:
//  // Flags are resolved at invocation.  This is particularly relevant for providers such as
//  // Statsig which have the ability to update values during application execution.
//  // This means that a flag should neither be resolved too early, which may result in stale values,
//  // nor too often which may pollute a flag value within a given call sequence if the value should change.
//  // in the intervening time

type BooleanFlag struct {
	name     string
	fallback bool
}

func (f *BooleanFlag) Get(p providers.BooleanProvider) bool {
	if p == nil {
		return f.fallback
	}
	return p.Bool(f.name, f.fallback)
}

func NewBooleanFlag(name string, fallback bool) *BooleanFlag {
	return &BooleanFlag{name: name, fallback: fallback}
}

type BooleanFlagEvaluator func() bool

func NewBooleanFlagEvaluator(name string, fallback bool, p providers.BooleanProvider) BooleanFlagEvaluator {
	flag := &BooleanFlag{name: name, fallback: fallback}
	return func() bool { return flag.Get(p) }
}

type IntFlag struct {
	name     string
	fallback int
}

func (f *IntFlag) Get(p providers.IntProvider) int {
	if p == nil {
		return f.fallback
	}
	return p.Int(f.name, f.fallback)
}

func NewIntFlag(name string, fallback int) *IntFlag {
	return &IntFlag{name: name, fallback: fallback}
}

type IntFlagEvaluator func() int

func NewIntFlagEvaluator(name string, fallback int, p providers.IntProvider) IntFlagEvaluator {
	flag := &IntFlag{name: name, fallback: fallback}
	return func() int { return flag.Get(p) }
}

type FloatFlag struct {
	name     string
	fallback float64
}

func (f *FloatFlag) Get(p providers.FloatProvider) float64 {
	if p == nil {
		return f.fallback
	}
	return p.Float(f.name, f.fallback)
}

func NewFloatFlag(name string, fallback float64) *FloatFlag {
	return &FloatFlag{name: name, fallback: fallback}
}

type FloatFlagEvaluator func() float64

func NewFloatFlagEvaluator(name string, fallback float64, p providers.FloatProvider) FloatFlagEvaluator {
	flag := &FloatFlag{name: name, fallback: fallback}
	return func() float64 { return flag.Get(p) }
}

type StringFlag struct {
	name     string
	fallback string
}

func (f *StringFlag) Get(p providers.StringProvider) string {
	if p == nil {
		return f.fallback
	}
	return p.String(f.name, f.fallback)
}

func NewStringFlag(name string, fallback string) *StringFlag {
	return &StringFlag{name: name, fallback: fallback}
}

type StringFlagEvaluator func() string

func NewStringFlagEvaluator(name string, fallback string, p providers.StringProvider) StringFlagEvaluator {
	flag := &StringFlag{name: name, fallback: fallback}
	return func() string { return flag.Get(p) }
}

type MapFlag struct {
	name     string
	fallback map[string]any
}

func (f *MapFlag) Get(p providers.MapProvider) map[string]any {
	if p == nil {
		return f.fallback
	}
	return p.Map(f.name, f.fallback)
}

func NewMapFlag(name string, fallback map[string]any) *MapFlag {
	return &MapFlag{name: name, fallback: fallback}
}

type MapFlagEvaluator func() map[string]any

func NewMapFlagEvaluator(name string, fallback map[string]any, p providers.MapProvider) MapFlagEvaluator {
	flag := &MapFlag{name: name, fallback: fallback}
	return func() map[string]any { return flag.Get(p) }
}

type StructFlag struct {
	name     string
	fallback any
}

func (f *StructFlag) Get(p providers.StructProvider, value any) error {
	if p == nil {
		return copyStruct(f.fallback, &value)
	}
	err := p.Struct(f.name, &value)
	if err != nil && f.fallback != nil {
		return copyStruct(f.fallback, &value)
	}
	return err
}

func copyStruct(from any, to any) error {
	buf, err := json.Marshal(from)
	if err != nil {
		return err
	}

	err = json.Unmarshal(buf, &to)
	if err != nil {
		return err
	}

	return nil
}

func NewStructFlag(name string, fallback any) *StructFlag {
	return &StructFlag{name: name, fallback: fallback}
}

type StructFlagEvaluator func(value any) error

func NewStructFlagEvaluator(name string, p providers.StructProvider) StructFlagEvaluator {
	flag := &StructFlag{name: name}
	return func(value any) error { return flag.Get(p, &value) }
}
