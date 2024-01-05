package main

import "net/http"

// Middleware to handle only a certain HTTP method.
// TODO: Remove when we choose a particular framework (Gin, Gorilla, etc), as this will be built in.
func handleMethod(method string, handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != method {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		handler.ServeHTTP(w, r)
	}
}
