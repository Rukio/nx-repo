package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/open-policy-agent/opa/sdk"
	sdktest "github.com/open-policy-agent/opa/sdk/test"
)

func newQueryResults(result any) *QueryResults {
	return &QueryResults{
		Results: []queryResult{
			{Result: result},
		},
	}
}

func TestPolicyClient_Query(t *testing.T) {
	input := map[string]any{
		"age":       17,
		"location":  "California",
		"diagnosis": "Acne",
		"dob":       "2010-12-03T15:00:00.000Z",
	}

	tsc := []struct {
		Description  string
		URL          string
		Query        string
		Context      context.Context
		Input        any
		Response     *QueryResults
		HasError     bool
		ErrorMessage string
		Tester       func(t testutils.Tester, v1 any, v2 any)
	}{
		{
			Description: "Valid Query With Valid Input Returns Allowed",
			Query:       "result = data.example.dh.authz.parentaccess",
			Input:       input,
			Response:    newQueryResults(map[string]any{"allow": true}),
		},
		{
			Description:  "Empty Query Returns Error",
			Query:        "",
			Input:        input,
			HasError:     true,
			ErrorMessage: "invalid policy query: no policy query specified",
		},
		{
			Description:  "Invalid Input Type Returns Error",
			Query:        "result = data.example.dh.authz.parentaccess",
			Input:        math.Inf(1),
			HasError:     true,
			ErrorMessage: "invalid policy request: json: unsupported value: +Inf",
		},
		{
			Description: "Valid Query With Invalid Data Types Returns Empty Result",
			Query:       "result = data.example.dh.authz.parentaccess",
			Input: map[string]any{
				"age":       "17",
				"location":  "California",
				"diagnosis": "Acne",
				"dob":       "2010-12-03T15:00:00.000Z",
			},
			Response: newQueryResults(map[string]any{}),
		},
		{
			Description:  "Invalid Query Returns Empty Response",
			Query:        "result = data.example.dh.authz.doesnotexist",
			Input:        input,
			Response:     &QueryResults{},
			HasError:     true,
			ErrorMessage: "opa_undefined_error: /example/dh/authz/doesnotexist decision was undefined",
		},
		{
			Description:  "Invalid Query Origin Generates Error",
			Query:        "result = example.dh.authz.parentaccess",
			Input:        input,
			Response:     &QueryResults{},
			HasError:     true,
			ErrorMessage: "opa_undefined_error: result = example/dh/authz/parentaccess decision was undefined",
		},
		{
			Description:  "Invalid Query Origin Generates Error",
			Query:        "result = example.dh.authz.doesnotexist",
			Input:        input,
			Response:     &QueryResults{},
			HasError:     true,
			ErrorMessage: "opa_undefined_error: result = example/dh/authz/doesnotexist decision was undefined",
		},
		{
			Description:  "Invalid Endpoint",
			URL:          "http://localhost:8182",
			Query:        "result = data.example.dh.authz.parentaccess",
			Input:        input,
			Response:     &QueryResults{},
			HasError:     true,
			ErrorMessage: "policy server error: Post \"http://localhost:8182/v1/query\": dial tcp (127.0.0.1|\\[::1\\]):8182: connect: connection refused",
			Tester: func(t testutils.Tester, v1 any, v2 any) {
				testutils.MustMatchRegex(t, v1.(string), v2.(string))
			},
		},
	}

	for _, tc := range tsc {
		t.Run(tc.Description, func(t *testing.T) {
			httpServer := MockHTTPServer(context.Background(), t)
			defer httpServer.Close()

			host := httpServer.URL
			if len(tc.URL) > 0 {
				host = tc.URL
			}

			config := PolicyClientConfig{
				Client: httpServer.Client(),
				Host:   host,
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}
			policyClient := NewPolicyClient(&config)

			results, err := policyClient.Query(context.Background(), tc.Query, tc.Input)

			if err != nil {
				if !tc.HasError {
					t.Fatalf("Unexpected Error, %v", err)
				}

				if tc.Tester != nil {
					tc.Tester(t, err.Error(), tc.ErrorMessage)
				} else {
					testutils.MustMatch(t, tc.ErrorMessage, err.Error(), "Unexpected Error")
				}
				return
			}

			testutils.MustMatch(t, tc.Response, results, "Unexpected Result")
		})
	}
}

func TestPolicyClient_CheckPolicy(t *testing.T) {
	tcs := []struct {
		Description  string
		Policy       string
		Context      context.Context
		Resource     map[string]any
		Result       map[string]any
		HasError     bool
		ErrorMessage string
	}{
		{
			Description: "Query Policy With Caregiver True",
			Policy:      "example.dh.authz.caregiver",
			Context: addCustomClaims(context.Background(), &CustomClaims{
				Email: "test@email.com",
				Scope: "TestScope",
				Type:  "user",
				Properties: map[string]any{
					"user_id": 13,
				},
			}),
			Resource: map[string]any{
				"care_giver_ids": []any{
					1, 2, 3, 4, 5, 10, 13, 14, 15, 18, 20,
				},
			},
			Result: map[string]any{
				"read": true,
			},
		},
		{
			Description: "Query Policy With Caregiver False",
			Policy:      "example.dh.authz.caregiver",
			Context: addCustomClaims(context.Background(), &CustomClaims{
				Email: "test@email.com",
				Scope: "TestScope",
				Type:  "user",
				Properties: map[string]any{
					"user_id": 30,
				},
			}),
			Resource: map[string]any{
				"care_giver_ids": []any{
					1, 2, 3, 4, 5, 10, 13, 14, 15, 18, 20,
				},
			},
			Result: map[string]any{},
		},
	}

	for _, tc := range tcs {
		httpServer := MockHTTPServer(context.Background(), t)
		defer httpServer.Close()

		t.Run(tc.Description, func(t *testing.T) {
			config := PolicyClientConfig{
				Client: httpServer.Client(),
				Host:   httpServer.URL,
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}
			policyClient := NewPolicyClient(&config)

			result, err := policyClient.CheckPolicy(tc.Context, tc.Policy, tc.Resource)

			if err != nil && tc.HasError {
				testutils.MustMatch(t, tc.ErrorMessage, err.Error(), "Unexpected Error")
				return
			}

			if err != nil && !tc.HasError {
				t.Fatalf("Unexpected Error, %v", err)
			} else {
				testutils.MustMatch(t, tc.Result, result, "Unexpected Result")
			}
		})
	}
}

func TestPolicyClient_Allowed(t *testing.T) {
	tcs := []struct {
		Description  string
		Policy       string
		Context      context.Context
		Resource     map[string]any
		Result       bool
		HasError     bool
		ErrorMessage string
	}{
		{
			Description: "Query Policy With Caregiver True",
			Policy:      "example.dh.authz.caregiver.read",
			Context: addCustomClaims(context.Background(), &CustomClaims{
				Email: "test@email.com",
				Scope: "TestScope",
				Type:  "user",
				Properties: map[string]any{
					"user_id": 13,
				},
			}),
			Resource: map[string]any{
				"care_giver_ids": []any{
					1, 2, 3, 4, 5, 10, 13, 14, 15, 18, 20,
				},
			},
			Result: true,
		},
		{
			Description: "Query Policy With Caregiver False",
			Policy:      "example.dh.authz.caregiver.read",
			Context: addCustomClaims(context.Background(), &CustomClaims{
				Email: "test@email.com",
				Scope: "TestScope",
				Type:  "user",
				Properties: map[string]any{
					"user_id": 30,
				},
			}),
			Resource: map[string]any{
				"care_giver_ids": []any{
					1, 2, 3, 4, 5, 10, 13, 14, 15, 18, 20,
				},
			},
			Result: false,
		},
		{
			Description: "Query Invalid Policy",
			Policy:      "example.dh.authz.caregiver.invalid_policy",
			Context: addCustomClaims(context.Background(), &CustomClaims{
				Email: "test@email.com",
				Scope: "TestScope",
				Type:  "user",
				Properties: map[string]any{
					"user_id": 13,
				},
			}),
			Resource: map[string]any{},
			Result:   false,
		},
		{
			Description: "No Actor Input",
			Policy:      "example.dh.authz.caregiver.caregiver.read",
			Context:     context.Background(),
			Resource: map[string]any{
				"care_giver_ids": []any{
					1, 2, 3, 4, 5, 10, 13, 14, 15, 18, 20,
				},
			},
			Result: false,
		},
		{
			Description: "No Resource Input",
			Policy:      "example.dh.authz.caregiver.caregiver.read",
			Context: addCustomClaims(context.Background(), &CustomClaims{
				Email: "test@email.com",
				Scope: "TestScope",
				Type:  "user",
				Properties: map[string]any{
					"user_id": 13,
				},
			}),
			Result: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			httpServer := MockHTTPServer(context.Background(), t)
			defer httpServer.Close()

			config := PolicyClientConfig{
				Client: httpServer.Client(),
				Host:   httpServer.URL,
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}
			policyClient := NewPolicyClient(&config)

			result, err := policyClient.Allowed(tc.Context, tc.Policy, tc.Resource)

			if err != nil {
				errMsg := err.Error()
				if strings.HasPrefix(errMsg, "opa_undefined_error") {
					testutils.MustMatch(t, tc.Result, result, "Unexpected Result")
				}
			} else {
				testutils.MustMatch(t, tc.Result, result, "Unexpected Result")
			}
		})
	}
}

func TestPolicyClient_extractPolicyResult(t *testing.T) {
	tcs := []struct {
		Description   string
		Value         *QueryResults
		ExpectedValue any
	}{
		{
			Description:   "Assert nil is nil",
			Value:         nil,
			ExpectedValue: nil,
		},
		{
			Description:   "Assert Empty is nil",
			Value:         &QueryResults{},
			ExpectedValue: nil,
		},
		{
			Description: "Assert Allow value is true",
			Value:       newQueryResults(map[string]any{"allow": true}),
			ExpectedValue: map[string]any{
				"allow": true,
			},
		},
	}

	for _, tc := range tcs {
		result := extractPolicyResult(tc.Value, 0)
		testutils.MustMatch(t, tc.ExpectedValue, result, "Unexpected Result")
	}
}

func TestPolicyClient_asBool(t *testing.T) {
	tcs := []struct {
		Description   string
		Value         any
		ExpectedValue bool
	}{
		{
			Description:   "Assert true is true",
			Value:         true,
			ExpectedValue: true,
		},
		{
			Description:   "Assert false is false",
			Value:         false,
			ExpectedValue: false,
		},
		{
			Description:   "Assert nil is false",
			Value:         nil,
			ExpectedValue: false,
		},
		{
			Description:   "Assert non boolean value is false",
			Value:         "string",
			ExpectedValue: false,
		},
	}

	for _, tc := range tcs {
		result := asBool(tc.Value)
		testutils.MustMatch(t, tc.ExpectedValue, result, "Unexpected Result")
	}
}

func TestNewPolicyClient(t *testing.T) {
	httpServer := MockHTTPServer(context.Background(), t)
	defer httpServer.Close()
	mockClient := httpServer.Client()

	tcs := []struct {
		Description   string
		Client        *http.Client
		ExpectedValue *http.Client
	}{
		{
			Description:   "Default Client",
			Client:        nil,
			ExpectedValue: http.DefaultClient,
		},
		{
			Description:   "Custom Client",
			Client:        mockClient,
			ExpectedValue: mockClient,
		},
	}

	for _, tc := range tcs {
		policyClient := NewPolicyClient(&PolicyClientConfig{Client: tc.Client})
		testutils.MustMatch(t, tc.ExpectedValue, policyClient.client, "Unexpected Result")
	}
}

func MockHTTPServer(ctx context.Context, t *testing.T) *httptest.Server {
	httpServer := httptest.NewServer(http.HandlerFunc(
		func(rw http.ResponseWriter, req *http.Request) {
			if req.URL.Path != "/v1/query" {
				t.Errorf("Expected to request '/fixedvalue', got: %s", req.URL.Path)
			}
			if req.Header.Get("Accept") != "application/json" {
				t.Errorf("Expected Accept: application/json header, got: %s", req.Header.Get("Accept"))
			}

			body, err := io.ReadAll(req.Body)
			if err != nil {
				rw.WriteHeader(http.StatusBadRequest)
				rw.Write([]byte(err.Error()))
				return
			}
			req.Body.Close()

			var query map[string]any
			err = json.Unmarshal(body, &query)
			if err != nil {
				var syntaxError *json.SyntaxError
				if ok := errors.As(err, &syntaxError); ok {
					log.Printf("syntax error at byte offset %d", syntaxError.Offset)
				}
				rw.WriteHeader(http.StatusBadRequest)
				rw.Write([]byte(err.Error()))
				return
			}

			input := query["input"].(map[string]any)
			path := query["query"].(string)
			newpath := strings.TrimPrefix(path, "result = data")
			newpath = strings.TrimPrefix(newpath, "allow = data")
			newpath = strings.ReplaceAll(newpath, ".", "/")

			opaResult, err := MockOPAServerResponse(ctx, newpath, input)
			if err != nil {
				rw.WriteHeader(http.StatusInternalServerError)
				rw.Write([]byte(err.Error()))
				return
			}

			responseResult := newQueryResults(opaResult)

			responseBody, err := json.Marshal(responseResult)
			if err != nil {
				rw.WriteHeader(http.StatusInternalServerError)
				rw.Write([]byte(err.Error()))
				return
			}

			rw.WriteHeader(http.StatusOK)
			rw.Write(responseBody)
		},
	))

	return httpServer
}

func MockOPAServerResponse(ctx context.Context, path string, input map[string]any) (any, error) {
	// create a mock HTTP bundle server
	server, err := sdktest.NewServer(sdktest.MockBundle("/bundles/bundle.tar.gz", map[string]string{
		"example/dh/authz/caregiver.rego": `
				package example.dh.authz.caregiver

				import future.keywords.if
				import future.keywords.in

				read if {
					input.actor.type == "user"
 					input.actor.properties.user_id in input.resource.care_giver_ids
				}
		`,
		"example/dh/authz/age.rego": `
				package example.dh.authz.age

				# Converts a date of birth to an age in years
				dob_to_age(dob) = z {
					now_ns := time.now_ns()
					dob_ns := time.parse_rfc3339_ns(dob)
					age_ns := time.diff(now_ns, dob_ns)
					z := age_ns[0]
				}

				# Determines whether a given date of birth is older than a certain age
				older_than(dob, age) {
					dob_to_age(dob) > age
				}

				# Determines whether a given date of birth is younger than a certain age
				younger_than(dob, age) {
					dob_to_age(dob) < age
				}

				adult {
					older_than(input.dob, 17)
				}

				minor {
					younger_than(input.dob, 18)
				}

			`,
		"example/dh/authz/parentaccess.rego": `
				package example.dh.authz.parentaccess

				import future.keywords.in

				# Determines whether a parent can access a minor's care request in a givne location
				# for a given diagnosis
				parent_can_access_care_request(age, location, diagnosis) {
					age < agelimit(location)
					not location in data.restricted_states
					not diagnosis in data.sensitive
				}

				# Given a location what is the access age limit
				agelimit(location) = limit {
				    limit := data.agelimits[location]
				}

				allow {
					parent_can_access_care_request(input.age, input.location, input.diagnosis)
				}
			`,
		"agelimits.json": `
				{
					"agelimits": {
				  		"Arizona": 15,
				  		"California": 18,
				  		"Colorado": 18,
				  		"Wyoming": 17
					}
				}
			`,
		"diagnoses.json": `
				{
				  "sensitive": ["Cancer", "Stroke", "Heart Attack"],
				  "restricted_states": ["Colorado", "Nevada"]
				}
			`,
	}))

	if err != nil {
		return nil, fmt.Errorf("SDK SERVER ERROR: %w", err)
	}
	defer server.Stop()

	// OPA configuration
	config := []byte(fmt.Sprintf(`{
		"services": {
			"test": {
				"url": %q
			}
		},
		"bundles": {
			"test": {
				"resource": "/bundles/bundle.tar.gz"
			}
		},
		"decision_logs": {
			"console": true
		}
	}`, server.URL()))

	// create an instance of the OPA object
	opa, err := sdk.New(ctx, sdk.Options{
		Config: bytes.NewReader(config),
	})
	if err != nil {
		return nil, fmt.Errorf("OPA ERROR: %w", err)
	}
	defer opa.Stop(ctx)

	result, err := opa.Decision(ctx, sdk.DecisionOptions{Path: path, Input: input})
	if err != nil {
		return nil, err
	}

	return result.Result, nil
}
