package providers

// Feature Flag Providers
//
// Feature flag providers can implement individual provider interfaces for data types relevant to that specific provider.
// A feature flag provider implementation is responsible for resolving flag values on behalf of a feature flag. A feature
// flag will make use of a provider to resolve the flag value at invocation time.
//
// Example Usage:
// A concrete provider should simply define implementations for the types it can provide. Internally it should
// implement functionality related to how it derives values.
//
// type MockProvider struct {}
// func (p *MockProvider) Shutdown() {}
// func (p *MockProvider) Bool(name string, _ bool) bool { return true }
// func (p *MockProvider) Int(name string, _ int) int { return 123 }
//

type FlagProvider interface {
	Shutdown()
}

type BooleanProvider interface {
	Bool(name string, fallback bool) bool
}

type IntProvider interface {
	Int(name string, fallback int) int
}

type FloatProvider interface {
	Float(name string, fallback float64) float64
}

type StringProvider interface {
	String(name string, fallback string) string
}

type MapProvider interface {
	Map(name string, fallback map[string]any) map[string]any
}

type StructProvider interface {
	Struct(name string, value any) error
}
