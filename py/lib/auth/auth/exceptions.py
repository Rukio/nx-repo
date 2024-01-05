# -*- coding: utf-8 -*-
from __future__ import annotations


class AuthException(Exception):
    pass


class TokenValidationException(AuthException):
    pass


class UnauthorizedException(AuthException):
    def __str__(self):
        return "Signed token does not have required scopes"
