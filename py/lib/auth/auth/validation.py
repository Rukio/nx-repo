# -*- coding: utf-8 -*-
from __future__ import annotations

import jwt

from . import exceptions


JWT_DECODING_ALGORITHMS = ["RS256"]


class AuthTokenValidator:
    def __init__(self, issuer_url: str, audience: str) -> None:
        self._issuer_url = issuer_url
        self._audience = audience
        self._jwks_client = jwt.PyJWKClient(uri=f"{self._issuer_url}.well-known/jwks.json")

    def _parse_token(self, header_token: str) -> str:
        token_parts = header_token.split()

        if len(token_parts) != 2:
            raise exceptions.AuthException(f"Authorization Header parse failure: string splits into incorrect amount, expect 2 parts, have {len(token_parts)}")

        return token_parts[1]

    def _validate_token(self, token: str) -> dict:
        signing_key = self._jwks_client.get_signing_key_from_jwt(token)
        try:
            payload = jwt.decode(
                jwt=token,
                key=signing_key.key,
                algorithms=JWT_DECODING_ALGORITHMS,
                audience=self._audience,
                issuer=self._issuer_url
            )
        except Exception as e:
            raise exceptions.TokenValidationException(f"{e.__class__.__name__}: {str(e)}")

        return payload


    def authorize_token(self, header_token: str, required_permission: str) -> bool:
        """Performs authorization on a JWT.

        Parse, validate, and check for required scope in the JWT.

        Args:
            header_token: The JWT in the request header.
            required_permission: The permission that will be checked against the validated JWT scopes.

        Returns:
            True if JWT passed authorization.

        Raises:
            UnauthorizedException: JWT did not pass authorization check.
        """
        payload = self._validate_token(self._parse_token(header_token))
        if payload.get("scope"):
            token_scopes = payload["scope"].split()
            for token_scope in token_scopes:
                if token_scope == required_permission:
                    return True
        raise exceptions.UnauthorizedException()
