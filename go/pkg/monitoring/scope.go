package monitoring

type Scope interface {
	With(string, Tags, Fields) Scope
	WritePoint(string, Tags, Fields)
}

// NoopScope does nothing.
type NoopScope struct{}

func (*NoopScope) WritePoint(name string, t Tags, f Fields) {
	// Noop WritePoint intentionally does nothing
}

func (n *NoopScope) With(name string, t Tags, f Fields) Scope {
	return n
}
