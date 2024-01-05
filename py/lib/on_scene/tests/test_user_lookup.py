# -*- coding: utf-8 -*-
from __future__ import annotations

from unittest.mock import patch

import pytest
from on_scene.user_lookup import User


class TestUserLookup:
    def test__convert_record_to_user(self, valid_record_app, user_lookup):
        expected_user = User(user_id=19, position="Advanced Practice Provider", prov_score=-1.6424e-01)
        returned_user = user_lookup._convert_record_to_user(valid_record_app["Record"])
        assert returned_user.user_id == expected_user.user_id
        assert returned_user.position == expected_user.position
        assert pytest.approx(returned_user.prov_score) == expected_user.prov_score

    def test_get_user(self, user_lookup):
        valid_id = 19
        valid_user = user_lookup.get_user(valid_id)
        assert valid_user.user_id == 19
        assert valid_user.position == "Advanced Practice Provider"
        assert pytest.approx(valid_user.prov_score) == -1.6424e-01

    def test_get_users(self, user_lookup, valid_app_user_id, valid_dhmt_user_id):
        users = user_lookup.get_users([valid_app_user_id, valid_dhmt_user_id])
        assert len(users) == 2
        assert users[valid_app_user_id].user_id == valid_app_user_id
        assert users[valid_dhmt_user_id].user_id == valid_dhmt_user_id

    def test_get_users_bad_ids(self, user_lookup):
        """Test if user_ids don't return any record from feature store."""
        bad_ids = [10001, 10002]
        users = user_lookup.get_users(bad_ids)
        assert len(users) == 2
        assert users[bad_ids[0]] is None
        assert users[bad_ids[1]] is None

    def test_get_users_empty(self, user_lookup):
        """Test if user_ids is empty"""
        with patch.object(user_lookup.logger, "warn"):
            users = user_lookup.get_users([])
            assert len(users) == 0
            user_lookup.logger.warn.assert_called_once()

    def test_bad_user(self, user_lookup):
        # test when user record is not found
        bad_id = 199
        assert user_lookup.get_user(bad_id) is None

        # test when bad user is included in get_users
        users = user_lookup.get_users([bad_id])
        assert users[bad_id] is None
