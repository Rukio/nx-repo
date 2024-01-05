package policies.clinicalkpi

import data.static.m2m_clients
import data.utils.testing

test_view_leads_metrics_allowed {
	view_leads_metrics with input as {"actor": {"type": "user", "properties": {"market_role": "Lead APP"}}}
	view_leads_metrics with input as {"actor": {"type": "user", "properties": {"market_role": "Lead DHMT"}}}
	view_leads_metrics with input as {"actor": {"type": "user", "properties": {"market_role": "Market Manager"}}}
	view_leads_metrics with input as {"actor": {"type": "user", "properties": {"market_role": "RDO"}}}
}

test_view_leads_metrics_not_allowed {
	not view_leads_metrics with input as {"actor": {"type": "user", "properties": {"market_role": "APP"}}}
	not view_leads_metrics with input as {"actor": {"type": "user", "properties": {"market_role": "DHMT"}}}
	not view_leads_metrics with input as {"actor": {"type": "user", "properties": {"market_role": "Advanced Care Nurse Nav"}}}
}

test_view_market_metrics_allowed {
	# The test user has access to the market and the role also has access.
	view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "markets": [1, 2, 3, 4], "roles": ["user"], "market_role": "Lead APP"}}, "resource": {"MarketId": 1}}

	# The test user has access to the market from the array and the role also has access.
	view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "markets": [1, 2, 3, 4], "roles": ["user"], "market_role": "Lead APP"}}, "resource": {"MarketId": [1, 5, 6]}}
}

test_view_market_metrics_not_allowed {
	# The test user has access to the market, but the role does not have access.
	not view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "markets": [1, 2, 3, 4], "roles": ["user"], "market_role": "APP"}}, "resource": {"MarketId": 1}}

	# The test user has access to the market from the array, but the role does not have access.
	not view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "markets": [1, 2, 3, 4], "roles": ["user"], "market_role": "APP"}}, "resource": {"MarketId": [1, 5, 6]}}

	# The test user does not have access to the market, but the role has access.
	not view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "markets": [1, 2, 3, 4], "roles": ["user"], "market_role": "Lead APP"}}, "resource": {"MarketId": 5}}

	# The test user does not have access to the market array, but the role has access.
	not view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "markets": [1, 2, 3, 4], "roles": ["user"], "market_role": "Lead APP"}}, "resource": {"MarketId": [5, 6, 7]}}

	# The test user's role has access, but the input market is empty.
	not view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "markets": [1, 2, 3, 4], "roles": ["user"], "market_role": "Lead APP"}}, "resource": {}}

	# The test user's role has access, but the markets are empty.
	not view_market_metrics with input as {"actor": {"type": "user", "properties": {"id": "1", "roles": ["user"], "market_role": "Lead APP"}}, "resource": {"MarketId": 1}}
}

test_view_personal_metrics_allowed {
	# The test user id matches with input.
	view_personal_metrics with input as {"actor": {"type": "user", "properties": {"id": 1, "roles": ["user"], "market_role": "APP"}}, "resource": {"ProviderId": 1}}

	# Test m2m access
	view_personal_metrics with input as testing.mock_m2m_actor(m2m_clients.ClinicalKPI)
}

test_view_personal_metrics_not_allowed {
	# The test user id not matches with input.
	not view_personal_metrics with input as {"actor": {"type": "user", "properties": {"id": 1, "roles": ["user"], "market_role": "DHMT"}}, "resource": {"ProviderId": 2}}
	not view_personal_metrics with input as {"actor": {"type": "user", "properties": {"roles": ["user"], "market_role": "APP"}}, "resource": {}}
	not view_personal_metrics with input as {"actor": {"type": "user", "properties": {"id": 2, "roles": ["user"], "market_role": "Lead APP"}}, "resource": {"ProviderId": 1}}
	not view_personal_metrics with input as testing.mock_m2m_actor("Some Other Service M2M")
}
