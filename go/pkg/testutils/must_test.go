package testutils

import "testing"

func TestMustMatchRegex(t *testing.T) {
	const pattern = "The .?ox eats .+ox"

	tcs := []struct {
		Description string
		Pattern     string
		Value       string
		Match       bool
	}{
		{
			Description: "Value Matches the Pattern",
			Pattern:     pattern,
			Value:       "The fox eats lox",
			Match:       true,
		},
		{
			Description: "Another Value Matches the Pattern",
			Pattern:     pattern,
			Value:       "The ox eats fox",
			Match:       true,
		},
		{
			Description: "Value Does Not Match the Pattern",
			Pattern:     pattern,
			Value:       "The fox eats ox",
			Match:       false,
		},
	}

	for _, tc := range tcs {
		var tr mockTester

		t.Run(tc.Description, func(t *testing.T) {
			MustMatchRegex(&tr, tc.Value, tc.Pattern)
			if tc.Match == tr.Mismatch {
				t.Fatalf("bad matching: %+v", tc)
			}
		})
	}
}
