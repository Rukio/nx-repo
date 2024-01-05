package testutils

import (
	"regexp"
)

// MustFn fatals the running test if the second return error value is non nil.
//
// For example, whereas usually one would have to do something like this to properly handle errors:
//
//	_, err := myLogicWithAnErrorReturn(...)
//	if err != nil {
//	    t.Fatal(err)
//	}
//
// Now one can simply do this:
//
//	testutils.MustFn(t)(myLogicWithAnErrorReturn(...))
func MustFn(t Tester) func(any, error) {
	t.Helper()
	return func(_ any, err error) {
		if err != nil {
			t.Fatalf("", err)
		}
	}
}

func MustMatchRegex(t Tester, value string, pattern string) {
	t.Helper()
	re := regexp.MustCompile(pattern)
	if !re.MatchString(value) {
		t.Fatalf("%s does not match %s", value, pattern)
	}
}
