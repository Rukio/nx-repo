package utils.testing

test_mock_m2m_actor {
	mock_m2m_actor("test_client") == {"actor": {"type": "m2m", "properties": {"client_name": "test_client"}}}
}

test_mock_user_actor {
	mock_user_actor(1, ["caremanager", "provider"]) == {"actor": {"type": "user", "properties": {"user_id": 1, "roles": ["caremanager", "provider"]}}}
}
