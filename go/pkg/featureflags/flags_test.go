package featureflags

import (
	"encoding/json"
	"errors"
	"reflect"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
)

type TestStruct struct {
	Enabled bool
	Count   int
	Name    string
}

type MockProvider struct {
}

func (p *MockProvider) Shutdown() {}
func (p *MockProvider) Bool(name string, fallback bool) bool {
	if name == "TEST_BOOL_VALUE" {
		return true
	}
	return fallback
}
func (p *MockProvider) Int(name string, fallback int) int {
	if name == "TEST_INT_VALUE" {
		return 123
	}
	return fallback
}
func (p *MockProvider) String(name string, fallback string) string {
	if name == "TEST_STRING_VALUE" {
		return "test-queue"
	}
	return fallback
}
func (p *MockProvider) Float(name string, fallback float64) float64 {
	if name == "TEST_FLOAT_VALUE" {
		return 123.123
	}
	return fallback
}
func (p *MockProvider) Map(name string, fallback map[string]any) map[string]any {
	if name == "TEST_MAP_VALUE" {
		return map[string]any{"key1": "value1", "key2": "value2"}
	}
	return fallback
}

func (p *MockProvider) Struct(name string, value any) error {
	if name == "TEST_STRUCT_VALUE" {
		rawValue := []byte(`{"Enabled": true, "Count": 123, "Name": "Ralph"}`)
		return json.Unmarshal(rawValue, &value)
	}
	return errors.New("Not Found")
}

var mockProvider = &MockProvider{}
var envProvider = &providers.EnvProvider{}

type FlagValues struct {
	TestBooleanFlag bool           `json:"test-boolean-flag"`
	TestStringFlag  string         `json:"test-string-flag"`
	TestIntFlag     int            `json:"test-int-flag"`
	TestFloatFlag   float64        `json:"test-float-flag"`
	TestMapFlag     map[string]any `json:"test-map-flag"`
	TestStructFlag  TestStruct     `json:"test-struct-flag"`
}

type TestFlagValues struct {
	FlagValues FlagValues `json:"flagValues"`
}

var statsigProvider, _ = providers.NewStatsigProvider(providers.StatsigProviderConfig{SDKKey: "secret-dummy", LocalMode: true, DefaultUserKey: "UserID"})

func setup() {
	statsigProvider.Start()
}

func TestBooleanFlag(t *testing.T) {
	setup()
	var nilInterfaceProvider providers.BooleanProvider
	var nilProviderReference *providers.StatsigProvider

	tcs := []struct {
		Description   string
		Flag          *BooleanFlag
		Provider      providers.BooleanProvider
		ExpectedValue bool
		Setup         func(t *testing.T)
		HasError      bool
	}{
		{
			Description:   "Test Boolean Flag with Mock Provider",
			Flag:          NewBooleanFlag("TEST_BOOL_VALUE", false),
			Provider:      mockProvider,
			ExpectedValue: true,
			HasError:      false,
		},
		{
			Description:   "Test Boolean Flag Fallback with Mock Provider",
			Flag:          NewBooleanFlag("TEST_NON_VALUE", true),
			Provider:      mockProvider,
			ExpectedValue: true,
			HasError:      false,
		},
		{
			Description:   "Test Boolean Flag with Environment Provider",
			Flag:          NewBooleanFlag("TEST_BOOL_VALUE", true),
			Provider:      envProvider,
			ExpectedValue: false,
			Setup: func(t *testing.T) {
				t.Setenv("TEST_BOOL_VALUE", "false")
			},
			HasError: false,
		},
		{
			Description:   "Test Boolean Flag Fallback with Environment Provider",
			Flag:          NewBooleanFlag("TEST_BOOL_VALUE", true),
			Provider:      envProvider,
			ExpectedValue: true,
			HasError:      false,
		},
		{
			Description:   "Test Boolean Flag with Statsig Provider",
			Flag:          NewBooleanFlag("test-statsig-bool", false),
			Provider:      statsigProvider,
			ExpectedValue: true,
			Setup: func(t *testing.T) {
				statsigProvider.OverrideGate("test-statsig-bool", true)
			},
			HasError: false,
		},
		{
			Description:   "Test Boolean Flag Fallback with Statsig Provider",
			Flag:          NewBooleanFlag("test-no-bool", false),
			Provider:      statsigProvider,
			ExpectedValue: false,
			Setup: func(t *testing.T) {
				statsigProvider.OverrideGate("test-statsig-bool", true)
			},
			HasError: false,
		},
		{
			Description:   "Test Boolean Flag Fallback with Nil Provider Value",
			Flag:          NewBooleanFlag("TEST_BOOL_VALUE", true),
			Provider:      nil,
			ExpectedValue: true,
			HasError:      false,
		},
		{
			Description:   "Test Boolean Flag Fallback with Nil Interface Provider",
			Flag:          NewBooleanFlag("TEST_BOOL_VALUE", true),
			Provider:      nilInterfaceProvider,
			ExpectedValue: true,
			HasError:      false,
		},
		{
			Description:   "Test Boolean Flag Fallback with Nil Provider Reference",
			Flag:          NewBooleanFlag("TEST_BOOL_VALUE", true),
			Provider:      nilProviderReference,
			ExpectedValue: true,
			HasError:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			if tc.Setup != nil {
				tc.Setup(t)
			}

			value := tc.Flag.Get(tc.Provider)
			if value != tc.ExpectedValue {
				t.Fatalf("Expected the Value to be '%v' received '%v' instead", tc.ExpectedValue, value)
			}
		})
	}
}

func TestStringFlag(t *testing.T) {
	setup()

	tcs := []struct {
		Description   string
		Flag          *StringFlag
		Provider      providers.StringProvider
		ExpectedValue string
		Setup         func(t *testing.T)
		HasError      bool
	}{
		{
			Description:   "Test String Flag with Mock Provider",
			Flag:          NewStringFlag("TEST_STRING_VALUE", "default-value"),
			Provider:      mockProvider,
			ExpectedValue: "test-queue",
			HasError:      false,
		},
		{
			Description:   "Test String Flag Fallback with Mock Provider",
			Flag:          NewStringFlag("TEST_NON_VALUE", "default-value"),
			Provider:      mockProvider,
			ExpectedValue: "default-value",
			HasError:      false,
		},
		{
			Description:   "Test String Flag with Environment Provider",
			Flag:          NewStringFlag("TEST_STRING_VALUE", "default-value"),
			Provider:      envProvider,
			ExpectedValue: "test-queue",
			Setup: func(t *testing.T) {
				t.Setenv("TEST_STRING_VALUE", "test-queue")
			},
			HasError: false,
		},
		{
			Description:   "Test String Flag Fallback with Environment Provider",
			Flag:          NewStringFlag("TEST_STRING_VALUE", "default-value"),
			Provider:      envProvider,
			ExpectedValue: "default-value",
			HasError:      false,
		},
		{
			Description:   "Test String Flag with Statsig Provider",
			Flag:          NewStringFlag("test-string-flag", "default-value"),
			Provider:      statsigProvider,
			ExpectedValue: "found-it",
			Setup: func(t *testing.T) {
				statsigProvider.OverrideConfig("test-string-flag", map[string]any{"test-string-flag": "found-it"})
			},
			HasError: false,
		},
		{
			Description:   "Test String Flag Fallback with Statsig Provider",
			Flag:          NewStringFlag("test-string-flag", "default-value"),
			Provider:      statsigProvider,
			ExpectedValue: "default-value",
			Setup: func(t *testing.T) {
				statsigProvider.OverrideConfig("test-string-flag", map[string]any{"test-no-flag": "found-it"})
			},
			HasError: false,
		},
		{
			Description:   "Test String Flag Fallback with Nil Provider",
			Flag:          NewStringFlag("test-string-flag", "default-value"),
			Provider:      nil,
			ExpectedValue: "default-value",
			HasError:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			if tc.Setup != nil {
				tc.Setup(t)
			}

			value := tc.Flag.Get(tc.Provider)
			if value != tc.ExpectedValue {
				t.Fatalf("Expected the Value to be '%s' received '%s' instead", tc.ExpectedValue, value)
			}
		})
	}
}

func TestIntFlag(t *testing.T) {
	setup()

	tcs := []struct {
		Description   string
		Flag          *IntFlag
		Provider      providers.IntProvider
		ExpectedValue int
		Setup         func(t *testing.T)
		HasError      bool
	}{
		{
			Description:   "Test Int Flag with Mock Provider",
			Flag:          NewIntFlag("TEST_INT_VALUE", 100),
			Provider:      mockProvider,
			ExpectedValue: 123,
			HasError:      false,
		},
		{
			Description:   "Test Int Flag Fallback with Mock Provider",
			Flag:          NewIntFlag("TEST_NON_VALUE", 100),
			Provider:      mockProvider,
			ExpectedValue: 100,
			HasError:      false,
		},
		{
			Description:   "Test Int Flag with Environment Provider",
			Flag:          NewIntFlag("TEST_INT_VALUE", 100),
			Provider:      envProvider,
			ExpectedValue: 123,
			Setup: func(t *testing.T) {
				t.Setenv("TEST_INT_VALUE", "123")
			},
			HasError: false,
		},
		{
			Description:   "Test Int Flag Fallback with Environment Provider",
			Flag:          NewIntFlag("TEST_INT_VALUE", 100),
			Provider:      envProvider,
			ExpectedValue: 100,
			HasError:      false,
		},
		{
			Description:   "Test Int Flag Fallback with Nil Provider",
			Flag:          NewIntFlag("TEST_INT_VALUE", 100),
			Provider:      nil,
			ExpectedValue: 100,
			HasError:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			if tc.Setup != nil {
				tc.Setup(t)
			}

			value := tc.Flag.Get(tc.Provider)
			if value != tc.ExpectedValue {
				t.Fatalf("Expected the Value to be '%d' received '%d' instead", tc.ExpectedValue, value)
			}
		})
	}
}

func TestFloatFlag(t *testing.T) {
	setup()

	tcs := []struct {
		Description   string
		Flag          *FloatFlag
		Provider      providers.FloatProvider
		ExpectedValue float64
		Setup         func(t *testing.T)
		HasError      bool
	}{
		{
			Description:   "Test Flag Flag with Mock Provider",
			Flag:          NewFloatFlag("TEST_FLOAT_VALUE", 100.1),
			Provider:      mockProvider,
			ExpectedValue: 123.123,
			HasError:      false,
		},
		{
			Description:   "Test Float Flag Fallback with Mock Provider",
			Flag:          NewFloatFlag("TEST_NON_VALUE", 100.1),
			Provider:      mockProvider,
			ExpectedValue: 100.1,
			HasError:      false,
		},
		{
			Description:   "Test Float Flag with Environment Provider",
			Flag:          NewFloatFlag("TEST_FLOAT_VALUE", 100.1),
			Provider:      envProvider,
			ExpectedValue: 123.123,
			Setup: func(t *testing.T) {
				t.Setenv("TEST_FLOAT_VALUE", "123.123")
			},
			HasError: false,
		},
		{
			Description:   "Test Float Flag Fallback with Environment Provider",
			Flag:          NewFloatFlag("TEST_FLOAT_VALUE", 100.1),
			Provider:      envProvider,
			ExpectedValue: 100.1,
			HasError:      false,
		},
		{
			Description:   "Test Float Flag with Statsig Provider",
			Flag:          NewFloatFlag("test-float-flag", 100.1),
			Provider:      statsigProvider,
			ExpectedValue: 123.123,
			Setup: func(t *testing.T) {
				statsigProvider.OverrideConfig("test-float-flag", map[string]any{"test-float-flag": 123.123})
			},
			HasError: false,
		},
		{
			Description:   "Test Float Flag Fallback with Statsig Provider",
			Flag:          NewFloatFlag("test-float-flag", 100.1),
			Provider:      statsigProvider,
			ExpectedValue: 100.1,
			Setup: func(t *testing.T) {
				statsigProvider.OverrideConfig("test-float-flag", map[string]any{"test-no-flag": 123.123})
			},
			HasError: false,
		},
		{
			Description:   "Test FLoat Flag Fallback with Nil Provider",
			Flag:          NewFloatFlag("test-float-flag", 100.1),
			Provider:      nil,
			ExpectedValue: 100.1,
			HasError:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			if tc.Setup != nil {
				tc.Setup(t)
			}

			value := tc.Flag.Get(tc.Provider)
			if value != tc.ExpectedValue {
				t.Fatalf("Expected the Value to be '%f' received '%f' instead", tc.ExpectedValue, value)
			}
		})
	}
}

func TestMapFlag(t *testing.T) {
	setup()

	tcs := []struct {
		Description   string
		Flag          *MapFlag
		Provider      providers.MapProvider
		ExpectedValue map[string]any
		Setup         func(t *testing.T)
		HasError      bool
	}{
		{
			Description:   "Test Map Flag with Mock Provider",
			Flag:          NewMapFlag("TEST_MAP_VALUE", map[string]any{"key1": "default"}),
			Provider:      mockProvider,
			ExpectedValue: map[string]any{"key1": "value1", "key2": "value2"},
			HasError:      false,
		},
		{
			Description:   "Test Map Flag Fallback with Mock Provider",
			Flag:          NewMapFlag("TEST_NON_VALUE", map[string]any{"key1": "default"}),
			Provider:      mockProvider,
			ExpectedValue: map[string]any{"key1": "default"},
			HasError:      false,
		},
		{
			Description: "Test Map Flag with Statsig Provider",
			Flag:        NewMapFlag("test-map-flag", map[string]any{}),
			Provider:    statsigProvider,
			ExpectedValue: map[string]any{
				"test_key1": "abc",
				"test_key2": "efg",
			},
			Setup: func(t *testing.T) {
				statsigProvider.OverrideConfig("test-map-flag", map[string]any{
					"test_key1": "abc",
					"test_key2": "efg",
				})
			},
			HasError: false,
		},
		{
			Description:   "Test Map Flag Fallback with Statsig Provider",
			Flag:          NewMapFlag("test-no-flag", map[string]any{}),
			Provider:      statsigProvider,
			ExpectedValue: map[string]any{},
			HasError:      false,
		},
		{
			Description:   "Test Map Flag Fallback with Nil Provider",
			Flag:          NewMapFlag("test-map-flag", map[string]any{}),
			Provider:      nil,
			ExpectedValue: map[string]any{},
			HasError:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			if tc.Setup != nil {
				tc.Setup(t)
			}

			value := tc.Flag.Get(tc.Provider)
			if !reflect.DeepEqual(value, tc.ExpectedValue) {
				t.Fatalf("Expected the Value to be '%v' received '%v' instead", tc.ExpectedValue, value)
			}
		})
	}
}

func TestStructFlag(t *testing.T) {
	setup()

	defaultStruct := TestStruct{}

	tcs := []struct {
		Description   string
		Flag          *StructFlag
		Provider      providers.StructProvider
		ExpectedValue TestStruct
		HasError      bool
	}{
		{
			Description:   "Test Struct Flag with Mock Provider",
			Flag:          NewStructFlag("TEST_STRUCT_VALUE", defaultStruct),
			Provider:      mockProvider,
			ExpectedValue: TestStruct{true, 123, "Ralph"},
			HasError:      false,
		},
		{
			Description:   "Test Struct Flag Fallback with Mock Provider",
			Flag:          NewStructFlag("TEST_NO_VALUE", defaultStruct),
			Provider:      mockProvider,
			ExpectedValue: defaultStruct,
			HasError:      true,
		},
		{
			Description:   "Test Struct Flag Fallback with Nil Provider",
			Flag:          NewStructFlag("TEST_STRUCT_VALUE", TestStruct{true, 500, "Max"}),
			Provider:      nil,
			ExpectedValue: TestStruct{true, 500, "Max"},
			HasError:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value := TestStruct{}
			err := tc.Flag.Get(tc.Provider, &value)
			if err != nil && !tc.HasError {
				t.Fatalf("Expected no error but received error")
			}

			if err == nil {
				if !reflect.DeepEqual(value, tc.ExpectedValue) {
					t.Fatalf("Expected the Value to be '%v' received '%v' instead", tc.ExpectedValue, value)
				}
			}
		})
	}
}

type MyConfig struct {
	BoolValue   BooleanFlagEvaluator
	IntValue    IntFlagEvaluator
	FloatValue  FloatFlagEvaluator
	StringValue StringFlagEvaluator
	MapValue    MapFlagEvaluator
	StructValue StructFlagEvaluator
}

func TestEvaluators(t *testing.T) {
	mockProvider := &MockProvider{}
	myConfig := MyConfig{
		BoolValue:   NewBooleanFlagEvaluator("TEST_BOOL_VALUE", false, mockProvider),
		IntValue:    NewIntFlagEvaluator("TEST_INT_VALUE", 100, mockProvider),
		FloatValue:  NewFloatFlagEvaluator("TEST_FLOAT_VALUE", 100.1, mockProvider),
		StringValue: NewStringFlagEvaluator("TEST_STRING_VALUE", "default-value", mockProvider),
		MapValue:    NewMapFlagEvaluator("TEST_MAP_VALUE", map[string]any{"key1": "default"}, mockProvider),
		StructValue: NewStructFlagEvaluator("TEST_STRUCT_VALUE", mockProvider),
	}

	if !myConfig.BoolValue() {
		t.Fatalf("Expected the Value to be '%v' received '%v' instead", true, false)
	}

	if myConfig.IntValue() != 123 {
		t.Fatalf("Expected the Value to be '%d' received '%d' instead", 123, 100)
	}

	if myConfig.FloatValue() != 123.123 {
		t.Fatalf("Expected the Value to be '%f' received '%f' instead", 123.123, 100.1)
	}

	if myConfig.StringValue() != "test-queue" {
		t.Fatalf("Expected the Value to be '%s' received '%s' instead", "test-queue", "default-value")
	}

	if !reflect.DeepEqual(myConfig.MapValue(), map[string]any{"key1": "value1", "key2": "value2"}) {
		t.Fatalf("Expected the Value to be '%v' received '%v' instead", map[string]any{"key1": "value1", "key2": "value2"}, map[string]any{"key1": "default"})
	}

	value := TestStruct{}
	expectedValue := TestStruct{true, 123, "Ralph"}
	err := myConfig.StructValue(&value)
	if err != nil && !reflect.DeepEqual(value, expectedValue) {
		t.Fatalf("Expected the Value to be '%v' received '%v' instead", expectedValue, value)
	}
}
