package secrets

import "testing"

func TestSecret(t *testing.T) {
	tcs := []struct {
		Desc  string
		Value string
	}{
		{
			Desc:  "Should get values",
			Value: "custom_value",
		},
		{
			Desc:  "Should get values",
			Value: "",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := NewSecret(tc.Value)

			if s.Value() != tc.Value {
				t.Errorf("Incorrect Value: %s\nexpected: %s\ngot: %s", tc.Desc, tc.Value, s.Value())
			}

			if s.String() != "Secret: <value not displayed>" {
				t.Errorf("Secret is not hidden")
			}
		})
	}
}
