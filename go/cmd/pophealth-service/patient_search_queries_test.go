package main

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestFirstAndLastNameSearchQuery(t *testing.T) {
	tests := []struct {
		name   string
		params PatientSearchParams

		expectedResult string
	}{
		{
			name: "params with only first name",
			params: PatientSearchParams{
				PatientFirstName: "Luis Pablo",
			},
			expectedResult: `"bool": {"must": [{"wildcard": {"first_name": "luis*"}},{"wildcard": {"first_name": "pablo*"}}]}`,
		},
		{
			name: "params with only last name",
			params: PatientSearchParams{
				PatientLastName: "Perez Lopez",
			},
			expectedResult: `"bool": {"must": [{"wildcard": {"last_name": "perez*"}},{"wildcard": {"last_name": "lopez*"}}]}`,
		},
		{
			name: "params with dash and blank space in name",
			params: PatientSearchParams{
				PatientFirstName: "Pedro Perez-Lopez",
			},
			expectedResult: `"bool": {"must": [{"wildcard": {"first_name": "pedro*"}},{"wildcard": {"first_name": "perez*"}},{"wildcard": {"first_name": "lopez*"}}]}`,
		},
		{
			name: "params with only market ids",
			params: PatientSearchParams{
				MarketIDs: []int64{1, 2},
			},
			expectedResult: `"bool": {"must": [{"terms": {"market_id": [1,2]}}]}`,
		},
		{
			name: "params with only channel item ids",
			params: PatientSearchParams{
				ChannelItemIDs: []int64{3, 4},
			},
			expectedResult: `"bool": {"must": [{"bool": {"should": [{"term": {"channel_item_id": 3}},{"term": {"channel_item_id": 4}}]}}]}`,
		},
		{
			name: "params with all filters",
			params: PatientSearchParams{
				PatientFirstName: "Luis",
				PatientLastName:  "Lopez",
				ChannelItemIDs:   []int64{1},
				MarketIDs:        []int64{3},
			},
			expectedResult: `"bool": {"must": [{"wildcard": {"first_name": "luis*"}},{"wildcard": {"last_name": "lopez*"}},{"terms": {"market_id": [3]}},{"bool": {"should": [{"term": {"channel_item_id": 1}}]}}]}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := FirstAndLastNameSearchQuery(test.params)
			testutils.MustMatch(t, test.expectedResult, result, "expected result don't match")
		})
	}
}

func TestNameSearchQuery(t *testing.T) {
	tests := []struct {
		name   string
		params PatientSearchParams

		expectedResult string
	}{
		{
			name: "params with only name",
			params: PatientSearchParams{
				PatientName: "Luis Pablo",
			},
			expectedResult: `"bool": {"must": [{"query_string": {"query": "first_name:(luis* OR pablo*) OR last_name:(luis* OR pablo*)"}}]}`,
		},
		{
			name: "params with market ids",
			params: PatientSearchParams{
				PatientName: "Luis",
				MarketIDs:   []int64{1, 2},
			},
			expectedResult: `"bool": {"must": [{"query_string": {"query": "first_name:(luis*) OR last_name:(luis*)"}},{"terms": {"market_id": [1,2]}}]}`,
		},
		{
			name: "params with channel item ids",
			params: PatientSearchParams{
				PatientName:    "Luis",
				ChannelItemIDs: []int64{3, 4},
			},
			expectedResult: `"bool": {"must": [{"query_string": {"query": "first_name:(luis*) OR last_name:(luis*)"}},{"bool": {"should": [{"term": {"channel_item_id": 3}},{"term": {"channel_item_id": 4}}]}}]}`,
		},
		{
			name: "params with all filters",
			params: PatientSearchParams{
				PatientName:    "Luis",
				ChannelItemIDs: []int64{1},
				MarketIDs:      []int64{3},
			},
			expectedResult: `"bool": {"must": [{"query_string": {"query": "first_name:(luis*) OR last_name:(luis*)"}},{"terms": {"market_id": [3]}},{"bool": {"should": [{"term": {"channel_item_id": 1}}]}}]}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := NameSearchQuery(test.params)
			testutils.MustMatch(t, test.expectedResult, result, "expected result don't match")
		})
	}
}

func TestEligibilitySearchQuery(t *testing.T) {
	tests := []struct {
		name   string
		params PatientSearchParams

		expectedResult string
	}{
		{
			name: "params without SSN",
			params: PatientSearchParams{
				PatientFirstName: "Luis",
				PatientLastName:  "Lopez",
				DOB:              "1989-04-21",
			},
			expectedResult: `"bool": {"must": [{"term": {"first_name": "luis"}}, {"term": {"last_name": "lopez"}}, {"match": {"dob": "1989-04-21"}}]}`,
		},
		{
			name: "params with ssn",
			params: PatientSearchParams{
				PatientFirstName: "Andrea",
				PatientLastName:  "Perez",
				DOB:              "1993-10-16",
				SSN:              "178237465",
			},
			expectedResult: `"bool": {"must": [{"term": {"first_name": "andrea"}}, {"term": {"last_name": "perez"}}, {"bool": {"should": [{"match": {"dob": "1993-10-16"}},{"term": {"ssn": "178237465"}}]}}]}`,
		},
		{
			name: "params with channel item ids",
			params: PatientSearchParams{
				PatientFirstName: "Jorge",
				PatientLastName:  "Gonzalez",
				DOB:              "1993-10-16",
				SSN:              "178237465",
				ChannelItemIDs:   []int64{1132, 2343},
			},
			expectedResult: `"bool": {"must": [{"term": {"first_name": "jorge"}}, {"term": {"last_name": "gonzalez"}}, {"bool": {"should": [{"match": {"dob": "1993-10-16"}},{"term": {"ssn": "178237465"}}]}}, {"bool": {"should": [{"term": {"channel_item_id": 1132}},{"term": {"channel_item_id": 2343}}]}}]}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := EligibilitySearchQuery(test.params)
			testutils.MustMatch(t, test.expectedResult, result, "expected result don't match")
		})
	}
}
