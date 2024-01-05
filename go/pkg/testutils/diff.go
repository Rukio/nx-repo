package testutils

import (
	"reflect"

	"github.com/google/go-cmp/cmp"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/testing/protocmp"
)

type Tester interface {
	Helper()
	Fatalf(format string, args ...any)
}

// MustMatchFn is used to create a common diff function for a test file.
// Usage in *_test.go file:
//
// Top declaration:
//
// var mustMatch = testutils.MustMatchFn(
//
//	".id",        // id numbers are unstable
//	".createdAt",  // created dates might not be interesting to compare
//
// )
//
// In Test*() function:
//
// mustMatch(t, want, got, "something doesn't match").
func MustMatchFn(ignoredFields ...string) func(t Tester, want, got any, errMsg ...string) {
	diffOpts := []cmp.Option{
		cmp.Exporter(func(reflect.Type) bool {
			return true
		}),
		cmpIgnoreFields(ignoredFields...),
	}
	// Diffs want/got and fails with errMsg on any failure.
	return func(t Tester, want, got any, errMsg ...string) {
		t.Helper()
		diff := cmp.Diff(want, got, diffOpts...)
		if diff != "" {
			t.Fatalf("%v: (-want +got)\n%v", errMsg, diff)
		}
	}
}

// MustMatchProtoFn is used to create a proto diff function for a test file.
// It will not compare unexported proto fields.
// Usage in *_test.go file:
//
// Top declaration:
//
// var mustMatch = testutils.MustMatchProtoFn(
//
//	"consistency_token",        // ignore consistency_tokens, as they are unstable
//	"created_at",               // created dates might not be interesting to compare
//
// )
//
// In Test*() function:
//
// mustMatchProto(t, want, got, "something doesn't match").
func MustMatchProtoFn(ignoredFields ...protoreflect.Name) func(t Tester, want, got protoreflect.ProtoMessage, errMsg ...string) {
	// Diffs want/got and fails with errMsg on any failure.
	return func(t Tester, want, got protoreflect.ProtoMessage, errMsg ...string) {
		t.Helper()
		diffOpts := []cmp.Option{
			protocmp.Transform(),
			protocmp.IgnoreFields(want, ignoredFields...),
		}
		diff := cmp.Diff(want, got, diffOpts...)
		if diff != "" {
			t.Fatalf("%v: (-want +got)\n%v", errMsg, diff)
		}
	}
}

// MustMatch is a convenience version of MustMatchFn with no overrides.
// Usage in Test*() function:
//
// testutils.MustMatch(t, want, got, "something doesn't match").
var MustMatch = MustMatchFn()
var MustMatchProto = MustMatchProtoFn()

// Skips fields of pathNames for cmp.Diff.
// Similar to standard cmpopts.IgnoreFields, but allows unexported fields.
func cmpIgnoreFields(pathNames ...string) cmp.Option {
	skipFields := make(map[string]bool, len(pathNames))
	for _, name := range pathNames {
		skipFields[name] = true
	}

	return cmp.FilterPath(func(path cmp.Path) bool {
		for _, ps := range path {
			if skipFields[ps.String()] {
				return true
			}
		}
		return false
	}, cmp.Ignore())
}
