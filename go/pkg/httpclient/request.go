package httpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/*company-data-covered*/services/go/pkg/apistatus"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type ContentType string

const (
	ContentTypeNotSpecified   ContentType = ""
	ContentTypeJSON           ContentType = "application/json"
	ContentTypeFormURLEncoded ContentType = "application/x-www-form-urlencoded"
)

type Headers map[string]string

type Request struct {
	Method          string
	URL             string
	QueryParams     url.Values
	ContentType     ContentType // value of the content-type header to use if the body is not nil.
	Request         any         // any serializable object if ContentType=ContentTypeJSON or an instance of url.Values if ContentType=ContentTypeFormURLEncoded
	Response        any
	ResponseHeaders *Headers
	Headers         Headers
	Client          *http.Client
}

func Do(ctx context.Context, request *Request) error {
	req, err := buildHTTPRequest(ctx, request)
	if err != nil {
		return err
	}
	client := buildClient(request)
	resp, err := client.Do(req)
	if err != nil {
		return status.Errorf(codes.Unavailable, "Failed to execute HTTP request: %s", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		return buildGRPCError(resp)
	}

	if request.Response != nil {
		err = json.NewDecoder(resp.Body).Decode(request.Response)
		if err != nil {
			return status.Errorf(codes.Internal, "Failed to unmarshal json into given struct: %s", err)
		}
	}

	if request.ResponseHeaders != nil {
		responseHeaders := Headers{}
		for k, v := range resp.Header {
			responseHeaders[k] = v[0]
		}
		*request.ResponseHeaders = responseHeaders
	}

	return nil
}

func buildClient(request *Request) http.Client {
	var client http.Client
	if request.Client == nil {
		client = http.Client{}
	} else {
		client = *request.Client
	}
	return client
}

func buildGRPCError(resp *http.Response) error {
	message := fmt.Sprintf("HTTP request had error response %d", resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	if err == nil {
		message = fmt.Sprintf("HTTP request had error response %d: %s", resp.StatusCode, body)
	}
	grpcStatus, _ := apistatus.HTTPStatusToGRPC(resp.StatusCode)
	return status.Errorf(grpcStatus, message)
}

func buildHTTPRequest(ctx context.Context, request *Request) (*http.Request, error) {
	var body io.Reader
	if request.Request != nil && request.ContentType == ContentTypeNotSpecified {
		return nil, status.Errorf(codes.InvalidArgument, "request content-type not specified")
	}

	if request.Request != nil {
		if request.ContentType == ContentTypeJSON {
			buf, err := json.Marshal(request.Request)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to marshal request body into JSON: %s", err)
			}
			body = bytes.NewBuffer(buf)
		}
		if request.ContentType == ContentTypeFormURLEncoded {
			form := request.Request.(url.Values)
			body = strings.NewReader(form.Encode())
		}
	}

	req, err := http.NewRequestWithContext(ctx, request.Method, request.URL, body)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create HTTP request: %s", err)
	}
	if request.Request != nil {
		if request.ContentType != ContentTypeJSON && request.ContentType != ContentTypeFormURLEncoded {
			return nil, status.Errorf(codes.InvalidArgument, "provided content-type not supported")
		}
		req.Header.Add("Content-Type", string(request.ContentType))
	}

	for key, value := range request.Headers {
		req.Header.Add(key, value)
	}

	req.URL.RawQuery = request.QueryParams.Encode()

	return req, err
}
