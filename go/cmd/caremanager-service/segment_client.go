package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
)

type NewSegmentClientParameters struct {
	WriteKey string
	URL      string
}

func encodeBasicAuthHeader(writeKey string) string {
	return base64.StdEncoding.EncodeToString(
		[]byte(fmt.Sprintf("%s:", writeKey)),
	)
}

func NewSegmentClient(prm *NewSegmentClientParameters) *SegmentClient {
	return &SegmentClient{
		url:      prm.URL,
		writeKey: encodeBasicAuthHeader(prm.WriteKey),
	}
}

type SegmentClient struct {
	url      string
	writeKey string
}

type SegmentEventPayload struct {
	Event       string `json:"event"`
	Properties  any    `json:"properties"`
	AnonymousID string `json:"anonymousId"`
}

func (t *SegmentClient) track(ctx context.Context, eventName string, properties any) error {
	event := SegmentEventPayload{
		Event:       eventName,
		Properties:  properties,
		AnonymousID: "m2m",
	}
	requestBody, err := json.Marshal(event)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		t.url,
		bytes.NewBuffer(requestBody),
	)
	if err != nil {
		return err
	}

	basicAuth := t.writeKey
	basicAuthHeader := fmt.Sprintf("Basic %s", basicAuth)
	req.Header.Set("Authorization", basicAuthHeader)
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Accept-Encoding", "*/*")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()

	return nil
}
