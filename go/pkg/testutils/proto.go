package testutils

import (
	"strings"
	"testing"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
)

// AssertExhaustiveOneOfMapping helps enforce that switch statements
// that attempt to exhaustively match on proto oneof messages don't
// silently break when a new option is cut for that proto field.
//
// When these tests fail, a dev should either immediately implement the logic that the test attempts to guard (if it's trivial),
// or associate a JIRA ticket comment to the place where the more complicated handling logic needs to be implemented;
// then add the new proto one-of option to the "handledChildren" map here.
//
// Example Usage:
//
//	testutils.AssertExhaustiveOneOfMapping(t, &pb.MessageWithOneOfNamedFoo{},
//	    "foo", []string{"foo_option_a", "foo_option_b"},
//	    "when this test fails, please update funcThatSwitchesOnFooType to handle the new foo_option defined in proto",
//	).
func AssertExhaustiveOneOfMapping(t *testing.T, m proto.Message, oneOfName string, handledOptions []string, failureMsg string) {
	t.Helper()

	handledOptionsMap := make(map[string]bool, len(handledOptions))
	for _, o := range handledOptions {
		handledOptionsMap[o] = true
	}

	descriptor := m.ProtoReflect().Descriptor()
	oneOfDescriptor := descriptor.Oneofs().ByName(protoreflect.Name(oneOfName))
	if oneOfDescriptor == nil {
		t.Errorf("%s is not a known one-of in the supplied message %s", oneOfName, string(descriptor.Name()))
	}
	var protoOptions []string
	fields := oneOfDescriptor.Fields()
	for i := 0; i < fields.Len(); i++ {
		name := string(fields.Get(i).Name())
		if _, ok := handledOptionsMap[name]; !ok {
			t.Log(failureMsg)
			t.Fatalf("unhandled oneof option (%s) encountered", name)
		}
		protoOptions = append(protoOptions, name)
	}
	if fields.Len() != len(handledOptions) {
		t.Fatalf("too many handled options declared, pare down to those in the proto: %s", strings.Join(protoOptions, ", "))
	}
}
