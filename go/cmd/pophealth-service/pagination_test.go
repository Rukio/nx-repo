package main

import (
	"testing"

	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestGetPaginationElements(t *testing.T) {
	pageNumber1Mock := uint32(1)
	pageNumber3Mock := uint32(3)

	defaultPageSize := int32(2)
	maxPageSize := int32(10)
	pageSizeMock := uint32(defaultPageSize)
	pageSizeNew := uint32(4)
	pageSizeBigger := uint32(maxPageSize)

	lastPageVisitedMock := int32(5)

	tests := []struct {
		name            string
		lastPageVisited int32
		pageRequest     PaginationRequest

		expectedResult PaginationResult
	}{
		{
			name: "happy path getting page 1 elements",
			pageRequest: PaginationRequest{
				PageNumber:      &pageNumber1Mock,
				PageSize:        &pageSizeMock,
				TotalOfElements: int32(6),
				LastPageSize:    defaultPageSize,
			},
			expectedResult: PaginationResult{
				Start:         0,
				End:           2,
				PageRequested: 1,
				Size:          2,
			},
		},
		{
			name: "success getting page elements requesting last page",
			pageRequest: PaginationRequest{
				PageNumber:      &pageNumber3Mock,
				PageSize:        &pageSizeMock,
				TotalOfElements: int32(6),
				LastPageSize:    defaultPageSize,
			},
			expectedResult: PaginationResult{
				Start:         4,
				End:           6,
				PageRequested: 3,
				Size:          2,
			},
		},
		{
			name: "success getting page elements changing page size in request",
			pageRequest: PaginationRequest{
				PageNumber:      &pageNumber3Mock,
				PageSize:        &pageSizeNew,
				TotalOfElements: int32(6),
				LastPageSize:    defaultPageSize,
			},
			expectedResult: PaginationResult{
				Start:         0,
				End:           4,
				PageRequested: 1,
				Size:          4,
			},
		},
		{
			name: "success getting page elements if page size is bigger than total",
			pageRequest: PaginationRequest{
				PageNumber:      &pageNumber1Mock,
				PageSize:        &pageSizeBigger,
				TotalOfElements: int32(5),
				LastPageSize:    maxPageSize,
			},
			expectedResult: PaginationResult{
				Start:         0,
				End:           5,
				PageRequested: 1,
				Size:          10,
			},
		},
		{
			name: "success getting page elements with the last page visited ahead the page requested",
			pageRequest: PaginationRequest{
				PageNumber:      &pageNumber1Mock,
				PageSize:        &pageSizeMock,
				TotalOfElements: int32(5),
				LastPageSize:    maxPageSize,
				LastPageVisited: lastPageVisitedMock,
			},
			expectedResult: PaginationResult{
				Start:         0,
				End:           2,
				PageRequested: 1,
				Size:          2,
			},
		},
		{
			name: "edge case returning adjusted elements with page outside availability",
			pageRequest: PaginationRequest{
				PageNumber:      &pageNumber3Mock,
				PageSize:        &pageSizeMock,
				TotalOfElements: int32(2),
				LastPageSize:    defaultPageSize,
			},
			expectedResult: PaginationResult{
				Start:         2,
				End:           2,
				PageRequested: 3,
				Size:          2,
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := GetPagination(test.pageRequest)
			testutils.MustMatch(t, test.expectedResult, result, "pagination don't match")
		})
	}
}

func TestDecodePageToken(t *testing.T) {
	tests := []struct {
		name  string
		token string

		hasError     bool
		expectedResp Pagination
	}{
		{
			name:     "happy path decoding token",
			token:    "eyJsYXN0X2lkIjoyNSwibGFzdF9wYWdlIjozLCJsYXN0X3BhZ2Vfc2l6ZSI6OH0=",
			hasError: false,
			expectedResp: Pagination{
				LastID:       25,
				LastPage:     3,
				LastPageSize: 8,
			},
		},
		{
			name:         "returning empty pagination token, fist time call",
			token:        "",
			hasError:     false,
			expectedResp: Pagination{},
		},
		{
			name:     "error decoding corrupt token",
			token:    "4654654564654",
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resp, err := DecodePageToken(test.token)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "pagination don't match")
		})
	}
}

func TestEncodePageToken(t *testing.T) {
	tests := []struct {
		name          string
		valueToEncode any

		hasError     bool
		expectedResp string
	}{
		{
			name: "happy path encoding token",
			valueToEncode: Pagination{
				LastID:       25,
				LastPage:     3,
				LastPageSize: 10,
			},
			hasError:     false,
			expectedResp: "eyJsYXN0X2lkIjoyNSwibGFzdF9wYWdlIjozLCJsYXN0X3BhZ2Vfc2l6ZSI6MTB9",
		},
		{
			name: "encoding token without last page value",
			valueToEncode: Pagination{
				LastID:       25,
				LastPageSize: 10,
			},
			hasError:     false,
			expectedResp: "eyJsYXN0X2lkIjoyNSwibGFzdF9wYWdlIjowLCJsYXN0X3BhZ2Vfc2l6ZSI6MTB9",
		},
		{
			name: "encoding token without last page size value",
			valueToEncode: Pagination{
				LastID:   25,
				LastPage: 3,
			},
			hasError:     false,
			expectedResp: "eyJsYXN0X2lkIjoyNSwibGFzdF9wYWdlIjozLCJsYXN0X3BhZ2Vfc2l6ZSI6MH0=",
		},
		{
			name: "encoding token without last id value",
			valueToEncode: Pagination{
				LastPage: 3,
			},
			hasError:     false,
			expectedResp: "eyJsYXN0X2lkIjowLCJsYXN0X3BhZ2UiOjMsImxhc3RfcGFnZV9zaXplIjowfQ==",
		},
		{
			name: "marshal error encoding interface with a channel",
			valueToEncode: map[string]any{
				"unsupported": make(chan int),
			},
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resp, err := EncodePageToken(test.valueToEncode)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "pagination don't match")
		})
	}
}

func TestGetPaginationData(t *testing.T) {
	tests := []struct {
		name        string
		filesCount  int64
		pageSize    int32
		currentPage int32

		expectedResp *pophealthpb.PaginationData
	}{
		{
			name:        "happy path getting pagination data",
			filesCount:  50,
			pageSize:    10,
			currentPage: 2,
			expectedResp: &pophealthpb.PaginationData{
				TotalItems:  int64(50),
				TotalPages:  int64(5),
				CurrentPage: 2,
			},
		},
		{
			name:        "getting pagination data with total remainder in extra page",
			filesCount:  53,
			pageSize:    10,
			currentPage: 3,
			expectedResp: &pophealthpb.PaginationData{
				TotalItems:  int64(53),
				TotalPages:  int64(6),
				CurrentPage: 3,
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resp := GetPaginationData(test.filesCount, test.pageSize, test.currentPage)
			testutils.MustMatch(t, test.expectedResp, resp, "pagination data don't match")
		})
	}
}
