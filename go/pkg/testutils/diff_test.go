package testutils

import (
	"log"
	"testing"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"google.golang.org/protobuf/reflect/protoreflect"
)

type S struct {
	i   int
	str string
}

type mockTester struct {
	Mismatch bool
}

func (t *mockTester) Helper() {
}

func (t *mockTester) Fatalf(format string, args ...any) {
	t.Mismatch = true

	log.Printf(format, args...)
}

func TestMustMatch(t *testing.T) {
	tcs := []struct {
		Desc string

		a S
		b S

		match bool
	}{
		{
			Desc: "base match",
			a: S{
				i:   1,
				str: "stuff",
			},
			b: S{
				i:   1,
				str: "stuff",
			},

			match: true,
		},
		{
			Desc: "base mismatch",
			a: S{
				i:   1,
				str: "stuff",
			},
			b: S{
				i:   2,
				str: "what",
			},

			match: false,
		},
	}

	for _, tc := range tcs {
		var tr mockTester

		MustMatch(&tr, tc.a, tc.b)
		if tc.match == tr.Mismatch {
			t.Fatalf("bad matching: %+v", tc)
		}
	}
}

func TestMustMatchFn(t *testing.T) {
	tcs := []struct {
		Desc string

		a             S
		b             S
		ignoredFields []string

		match bool
	}{
		{
			Desc: "base match",
			a: S{
				i:   1,
				str: "stuff",
			},
			b: S{
				i:   1,
				str: "stuff",
			},
			ignoredFields: []string{".a", ".b"},

			match: true,
		},
		{
			Desc: "all mismatched fields ignored should match",
			a: S{
				i:   1,
				str: "stuff",
			},
			b: S{
				i:   2,
				str: "what",
			},
			ignoredFields: []string{".i", ".str"},

			match: true,
		},
		{
			Desc: "some mismatched fields ignored should not match",
			a: S{
				i:   1,
				str: "stuff",
			},
			b: S{
				i:   2,
				str: "what",
			},
			ignoredFields: []string{".i"},

			match: false,
		},
	}

	for _, tc := range tcs {
		var tr mockTester

		mustMatch := MustMatchFn(tc.ignoredFields...)
		mustMatch(&tr, tc.a, tc.b)
		if tc.match == tr.Mismatch {
			t.Fatalf("bad matching: %+v", tc)
		}
	}
}

func TestMustMatchProtoFn(t *testing.T) {
	tcs := []struct {
		Desc string

		a             protoreflect.ProtoMessage
		b             protoreflect.ProtoMessage
		ignoredFields []protoreflect.Name

		match bool
	}{
		{
			Desc: "base match without ignored fields",
			a: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			b: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},

			match: true,
		},
		{
			Desc: "base mismatch without ignored fields",
			a: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			b: &commonpb.Date{
				Year:  2020,
				Month: 4,
			},

			match: false,
		},
		{
			Desc: "base match with ignored fields",
			a: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			b: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			ignoredFields: []protoreflect.Name{"day"},

			match: true,
		},
		{
			Desc: "all mismatched fields ignored should match",
			a: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			b: &commonpb.Date{
				Year:  2022,
				Month: 4,
			},
			ignoredFields: []protoreflect.Name{"year", "month"},

			match: true,
		},
		{
			Desc: "a with ignored field should match",
			a: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			b: &commonpb.Date{
				Month: 3,
			},
			ignoredFields: []protoreflect.Name{"year"},

			match: true,
		},
		{
			Desc: "b with ignored field should match",
			a: &commonpb.Date{
				Month: 3,
			},
			b: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			ignoredFields: []protoreflect.Name{"year"},

			match: true,
		},
		{
			Desc: "two different types of protos should not match",
			a: &commonpb.Date{
				Month: 3,
			},
			b: &commonpb.DateTime{
				Month: 3,
			},

			match: false,
		},
		{
			Desc: "some mismatched fields ignored should not match",
			a: &commonpb.Date{
				Year:  2020,
				Month: 3,
			},
			b: &commonpb.Date{
				Year:  2022,
				Month: 4,
			},
			ignoredFields: []protoreflect.Name{"year"},

			match: false,
		},
	}

	for _, tc := range tcs {
		var tr mockTester

		mustMatch := MustMatchProtoFn(tc.ignoredFields...)
		mustMatch(&tr, tc.a, tc.b)
		if tc.match == tr.Mismatch {
			t.Fatalf("bad matching: %+v", tc)
		}
	}
}
