package system.authz

test_allow {
	allow with input as {"path": [""]}
	allow with input as {"path": ["v1", "query"]}
	not allow with input as {"path": ["v1", "data"]}
}
