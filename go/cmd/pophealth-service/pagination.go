package main

import (
	"encoding/base64"
	"encoding/json"

	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
)

const (
	paginationDefaultLimit = int32(10)
	startPage              = int32(1)
)

type Pagination struct {
	LastID       int64 `json:"last_id"`
	LastPage     int32 `json:"last_page"`
	LastPageSize int32 `json:"last_page_size"`
}

type PaginationResult struct {
	Start         int32
	End           int32
	PageRequested int32
	Size          int32
}

type PaginationRequest struct {
	PageNumber      *uint32
	PageSize        *uint32
	LastPageVisited int32
	TotalOfElements int32
	LastPageSize    int32
}

func GetPagination(request PaginationRequest) PaginationResult {
	size := paginationDefaultLimit
	isPageSizeChanged := false
	if request.PageSize != nil {
		size = int32(*request.PageSize)

		if request.LastPageSize != 0 {
			isPageSizeChanged = size != request.LastPageSize
		}
	}

	page := startPage
	if !isPageSizeChanged && request.PageNumber != nil {
		page = int32(*request.PageNumber)
	}
	pageRequested := page

	if request.LastPageVisited < page {
		page -= request.LastPageVisited
	}

	start := (page - 1) * size

	if start > request.TotalOfElements {
		start = request.TotalOfElements
	}

	end := start + size
	if end > request.TotalOfElements {
		end = request.TotalOfElements
	}

	return PaginationResult{
		Start:         start,
		End:           end,
		PageRequested: pageRequested,
		Size:          size,
	}
}

func DecodePageToken(token string) (Pagination, error) {
	if token == "" {
		return Pagination{}, nil
	}

	pageJSON, err := base64.URLEncoding.DecodeString(token)
	if err != nil {
		return Pagination{}, err
	}
	var pagination Pagination
	err = json.Unmarshal(pageJSON, &pagination)
	return pagination, err
}

func EncodePageToken(in any) (string, error) {
	pageJSON, err := json.Marshal(in)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(pageJSON), nil
}

func GetPaginationData(filesCount int64, pageSize, currentPage int32) *pophealthpb.PaginationData {
	size := int64(pageSize)
	totalPages := filesCount / size
	if filesCount%size > 0 {
		totalPages++
	}

	return &pophealthpb.PaginationData{
		TotalItems:  filesCount,
		TotalPages:  totalPages,
		CurrentPage: currentPage,
	}
}
