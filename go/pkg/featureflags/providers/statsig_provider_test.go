package providers

import (
	"reflect"
	"testing"
)

type TestStruct struct {
	Enabled bool
	Count   int
	Name    string
}

var config = StatsigProviderConfig{SDKKey: "secret-dummy", LocalMode: true, DefaultUserKey: "UserID"}

func TestShutdown(t *testing.T) {
	instance := StartMockStatsigProvider(t)
	instance.Shutdown()
}

func TestStatsigValues(t *testing.T) {
	instance := StartMockStatsigProvider(t)
	var nilInstance *StatsigProvider

	tcs := []struct {
		Description   string
		ValueFunc     func() any
		ExpectedValue any

		HasError     bool
		ErrorMessage string
	}{
		{
			Description: "Test Boolean Value",
			ValueFunc: func() any {
				instance.OverrideGate("test-boolean-value", false)
				return instance.Bool("test-boolean-value", false)
			},
			ExpectedValue: false,
			HasError:      false,
		},
		{
			Description: "Test Nil Instance Boolean Value",
			ValueFunc: func() any {
				return nilInstance.Bool("test-boolean-value", true)
			},
			ExpectedValue: true,
			HasError:      false,
		},
		{
			Description: "Test String Value",
			ValueFunc: func() any {
				instance.OverrideConfig("test-string-value", map[string]any{"test-string-value": "found-it"})
				return instance.String("test-string-value", "default-value")
			},
			ExpectedValue: "found-it",
			HasError:      false,
		},
		{
			Description: "Test String Fallback Value",
			ValueFunc: func() any {
				instance.OverrideConfig("test-string-value", map[string]any{"test-no-value": "found-it"})
				return instance.String("test-string-value", "default-value")
			},
			ExpectedValue: "default-value",
			HasError:      false,
		},
		{
			Description: "Test Nil Instance String Value",
			ValueFunc: func() any {
				return nilInstance.String("test-string-value", "abc")
			},
			ExpectedValue: "abc",
			HasError:      false,
		},
		{
			Description: "Test Float Value",
			ValueFunc: func() any {
				instance.OverrideConfig("test-float-value", map[string]any{"test-float-value": 123.123})
				return instance.Float("test-float-value", 100.1)
			},
			ExpectedValue: 123.123,
			HasError:      false,
		},
		{
			Description: "Test Float Fallback Value",
			ValueFunc: func() any {
				instance.OverrideConfig("test-float-value", map[string]any{"test-no-value": 123.123})
				return instance.Float("test-float-value", 100.1)
			},
			ExpectedValue: 100.1,
			HasError:      false,
		},
		{
			Description: "Test Nil Instance Float Value",
			ValueFunc: func() any {
				return nilInstance.Float("test-float-value", 100.1)
			},
			ExpectedValue: 100.1,
			HasError:      false,
		},
		{
			Description: "Test Map Value",
			ValueFunc: func() any {
				value := map[string]any{
					"test_key1": "abc",
					"test_key2": "efg",
				}
				instance.OverrideConfig("test-map-value", value)
				return instance.Map("test-map-value", map[string]any{})
			},
			ExpectedValue: map[string]any{
				"test_key1": "abc",
				"test_key2": "efg",
			},
			HasError: false,
		},
		{
			Description: "Test Map Fallback Value",
			ValueFunc: func() any {
				value := map[string]any{
					"test_key1": "fallback",
					"test_key2": "fallback2",
				}
				return instance.Map("test-fallback-value", value)
			},
			ExpectedValue: map[string]any{
				"test_key1": "fallback",
				"test_key2": "fallback2",
			},
			HasError: false,
		},
		{
			Description: "Test Nil Instance Map Value",
			ValueFunc: func() any {
				value := map[string]any{
					"test_key1": "abcdefg",
					"test_key2": "wxy&z",
				}
				return nilInstance.Map("test-map-value", value)
			},
			ExpectedValue: map[string]any{
				"test_key1": "abcdefg",
				"test_key2": "wxy&z",
			},
			HasError: false,
		},
		{
			Description: "Test Struct Value",
			ValueFunc: func() any {
				value := TestStruct{
					Enabled: true,
					Count:   123,
					Name:    "Ralph",
				}
				err := instance.OverrideStruct("test-struct-value", value)
				if err != nil {
					t.Fatal(err)
				}
				flagValue := TestStruct{}
				err = instance.Struct("test-struct-value", &flagValue)
				if err != nil {
					t.Fatal(err)
				}
				return flagValue
			},
			ExpectedValue: TestStruct{
				Enabled: true,
				Count:   123,
				Name:    "Ralph",
			},
			HasError: false,
		},
		{
			Description: "Test Nil Instance Struct Value",
			ValueFunc: func() any {
				flagValue := TestStruct{}
				err := nilInstance.Struct("test-struct-value", &flagValue)
				if err != nil {
					return err
				}
				return flagValue
			},
			HasError:     true,
			ErrorMessage: "StatsigProvider is uninitialized",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value := tc.ValueFunc()

			if tc.HasError {
				if tc.ErrorMessage != value.(error).Error() {
					t.Fatalf("Unexpected error")
				}
			} else {
				if !reflect.DeepEqual(value, tc.ExpectedValue) {
					t.Fatalf("Expected the Value to be '%v' received '%v' instead", tc.ExpectedValue, value)
				}
			}
		})
	}
}

func TestNewStatsigProvider(t *testing.T) {
	badConfig := StatsigProviderConfig{SDKKey: "", LocalMode: true, DefaultUserKey: "UserID"}
	provider, err := NewStatsigProvider(badConfig)
	if provider != nil {
		t.Fatalf("Expected the provider to be nil")
	}

	if err == nil {
		t.Fatalf("Expected a configuration error")
	}

	provider, err = NewStatsigProvider(config)
	if provider == nil {
		t.Fatalf("Expected the provider to be instantiated")
	}

	if err != nil {
		t.Fatalf("Expected the error to be nil error")
	}
}
