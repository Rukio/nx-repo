package utils.testing

# Test functions for generating actors with properties for input

mock_m2m_actor(client_name) = ret {
	ret = {"actor": {"type": "m2m", "properties": {"client_name": client_name}}}
}

mock_user_actor(user_id, roles) = ret {
	ret = {"actor": {"type": "user", "properties": {"user_id": user_id, "roles": roles}}}
}
