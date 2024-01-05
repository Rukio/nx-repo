package testutils

import (
	"net/http"
	"net/http/httptest"
	"strings"
)

func MockInfluxServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
		switch {
		case strings.HasPrefix(req.RequestURI, "/ping"):
			rw.WriteHeader(http.StatusNoContent)
		case strings.HasPrefix(req.RequestURI, "/query") && strings.Contains(req.RequestURI, "CREATE+DATABASE"):
			rw.Header().Add("Content-Type", "application/json")
			rw.Write([]byte("{}"))
		default:
			rw.WriteHeader(http.StatusOK)
		}
	}))
}
