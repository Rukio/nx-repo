package monitoring

import "sync"

type capturedArgs struct {
	name   string
	tags   Tags
	fields Fields
}

// MockScope is to be used for testing only.
type MockScope struct {
	sync.RWMutex
	// TODO: If needed, expose these maps via a public getter that
	// copies their captured values.
	capturedPoints map[string][]capturedArgs
	capturedWith   map[string][]capturedArgs
}

// NewMockScope returns a mock scope for testing purposes only.
func NewMockScope() *MockScope {
	return &MockScope{
		capturedPoints: make(map[string][]capturedArgs),
		capturedWith:   make(map[string][]capturedArgs),
	}
}

func (ms *MockScope) WritePoint(name string, t Tags, f Fields) {
	newEntry := capturedArgs{name: name, tags: t, fields: f}
	ms.Lock()
	previous, ok := ms.capturedPoints[name]
	if !ok {
		ms.capturedPoints[name] = []capturedArgs{newEntry}
	} else {
		ms.capturedPoints[name] = append(previous, newEntry)
	}
	ms.Unlock()
}

func (ms *MockScope) With(name string, t Tags, f Fields) Scope {
	newEntry := capturedArgs{name: name, tags: t, fields: f}
	ms.Lock()
	previous, ok := ms.capturedWith[name]
	if !ok {
		ms.capturedWith[name] = []capturedArgs{newEntry}
	} else {
		ms.capturedWith[name] = append(previous, newEntry)
	}
	ms.Unlock()
	return ms
}
