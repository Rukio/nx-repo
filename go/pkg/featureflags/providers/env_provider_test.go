package providers

import (
	"testing"
)

func TestEnvValues(t *testing.T) {
	var envTestInstance *EnvProvider

	tcs := []struct {
		Description   string
		HasError      bool
		ValueFunc     func() any
		Name          string
		Value         string
		DefaultValue  any
		ExpectedValue any
	}{
		{
			Description:   "Test Environment Variable Boolean Value",
			HasError:      false,
			ValueFunc:     func() any { return envTestInstance.Bool("TEST_BOOL_VALUE", true) },
			Name:          "TEST_BOOL_VALUE",
			Value:         "false",
			DefaultValue:  true,
			ExpectedValue: false,
		},
		{
			Description:   "Test Environment Variable String Value",
			HasError:      false,
			ValueFunc:     func() any { return envTestInstance.String("TEST_STRING_VALUE", "default") },
			Name:          "TEST_STRING_VALUE",
			Value:         "test_value",
			DefaultValue:  "default",
			ExpectedValue: "test_value",
		},
		{
			Description:   "Test Environment Variable Int Value",
			HasError:      false,
			ValueFunc:     func() any { return envTestInstance.Int("TEST_INT_VALUE", 100) },
			Name:          "TEST_INT_VALUE",
			Value:         "123",
			DefaultValue:  100,
			ExpectedValue: 123,
		},
		{
			Description:   "Test Environment Variable Float Value",
			HasError:      false,
			ValueFunc:     func() any { return envTestInstance.Float("TEST_INT_VALUE", 100.1) },
			Name:          "TEST_INT_VALUE",
			Value:         "123.123",
			DefaultValue:  100.1,
			ExpectedValue: 123.123,
		},
	}

	envTestInstance = NewEnvProvider()
	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value := tc.ValueFunc()
			if value != tc.DefaultValue {
				t.Fatalf("Expected the Value to be '%s' received '%s' instead", tc.DefaultValue, value)
			}

			t.Setenv(tc.Name, tc.Value)

			value = tc.ValueFunc()

			if value != tc.ExpectedValue {
				t.Fatalf("Expected the Value to be '%s' received '%s' instead", tc.ExpectedValue, value)
			}
		})
	}
}
