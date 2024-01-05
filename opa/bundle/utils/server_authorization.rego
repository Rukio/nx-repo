package system.authz

# We disable all paths except for the Query API and the OPA server page which helps test it.
# This allows us to have un-authenticated OPA querying within our services network, without
# services having the access to modify or create policies outside of CI/CD.

# See https://www.openpolicyagent.org/docs/latest/security/#authentication-and-authorization

default allow := false

allow {
	input.path == ["v1", "query"] # Query API
}

allow {
	input.path == [""] # Base query-testing page
}
