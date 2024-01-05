package grpcgateway

import (
	"context"
	"net/http"
	"strconv"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/protobuf/proto"
)

func HTTPResponseModifier(ctx context.Context, w http.ResponseWriter, p proto.Message) error {
	md, ok := runtime.ServerMetadataFromContext(ctx)
	if !ok {
		return nil
	}

	values := md.HeaderMD.Get("x-http-code")

	if len(values) > 0 {
		code, err := strconv.Atoi(values[0])
		if err != nil {
			return err
		}

		// Delete the headers to not expose any grpc-metadata in http response.
		delete(md.HeaderMD, "x-http-code")
		delete(w.Header(), "Grpc-Metadata-X-Http-Code")
		w.WriteHeader(code)
	}

	return nil
}
