package main

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestSegmentClientTrack(t *testing.T) {
	var ctx = getContextWithAuth()
	var randomID = time.Now().UnixNano()
	mockProperties := CreateVisitSegmentEvent{
		EpisodeID:     randomID,
		CareRequestID: randomID + 1,
		MarketID:      randomID + 2,
		ServiceLineID: randomID + 3,
		CarePhaseID:   randomID + 4,
	}

	testCases := []struct {
		name              string
		writeKey          string
		segmentProperties any

		wantRequestBody []uint8
		wantErr         error
	}{
		{
			name:              "works",
			writeKey:          "mockWriteKey",
			segmentProperties: mockProperties,

			wantRequestBody: []uint8(fmt.Sprintf(
				`{"event":"eventName","properties":{"episode_id":%d,"careRequest_id":%d,"market_id":%d,"service_line_id":%d,"care_phase_id":%d},"anonymousId":"m2m"}`,
				mockProperties.EpisodeID,
				mockProperties.CareRequestID,
				mockProperties.MarketID,
				mockProperties.ServiceLineID,
				mockProperties.CarePhaseID,
			)),
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			basicAuth := base64.StdEncoding.EncodeToString(
				[]byte(fmt.Sprintf("%s:", testCase.writeKey)),
			)
			testServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
				testutils.MustMatch(t, "application/json", r.Header.Get("Content-Type"), "Incorrect Content-Type header")
				testutils.MustMatch(t, "*/*", r.Header.Get("Accept-Encoding"), "Incorrect Accept-Encoding header")
				testutils.MustMatch(t, fmt.Sprintf("Basic %s", basicAuth), r.Header.Get("Authorization"), "Incorrect Authorization header")

				body, _ := io.ReadAll(r.Body)
				testutils.MustMatch(t, testCase.wantRequestBody, body, "The request body does not match")

				rw.WriteHeader(http.StatusOK)
				rw.Write([]byte(`{"success": true}`))
			}))
			defer testServer.Close()

			segmentProvider := NewSegmentClient(&NewSegmentClientParameters{
				URL:      testServer.URL,
				WriteKey: testCase.writeKey,
			})

			err := segmentProvider.track(ctx, "eventName", testCase.segmentProperties)
			testutils.MustMatch(t, testCase.wantErr, err, "unexpected problem, expected error and response error don't match")
		})
	}
}
