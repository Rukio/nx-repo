package main

import (
	"testing"
)

func TestStringIsNilOrEmpty(t *testing.T) {
	var (
		emptyString = ""
		fullString  = "Some text"
		tcs         = []struct {
			Desc  string
			Value *string
			Want  bool
		}{
			{
				Desc:  "Empty string should return true",
				Value: &emptyString,
				Want:  true,
			},
			{
				Desc:  "Nil string should return true",
				Value: nil,
				Want:  true,
			},
			{
				Desc:  "String with content should return false",
				Value: &fullString,
				Want:  false,
			},
		}
	)

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			result := StringIsNilOrEmpty(tc.Value)
			if tc.Want != result {
				t.Fatalf("\nactual result: %v\nexpected result: %v", result, tc.Want)
			}
		})
	}
}
