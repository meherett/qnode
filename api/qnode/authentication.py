#!/usr/bin/env python3

from flask import (
    Response, request
)
from datetime import datetime
from bson.objectid import ObjectId
from http import HTTPStatus
from typing import (
    Any, Union, List
)

import functools
import json

from .security import (
    decrypt, decrypt_object
)
from . import (
    flask, response, database
)


def is_authorized(roles: List[str]) -> Union[Response, Any]:
    def middleware(method):
        @functools.wraps(method)
        def wrapper(*args, **kwargs):
            if not request.headers.get("Authorization"):
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Authentication is required.",
                        description=None
                    )
                )
            authorization: str = request.headers.get("Authorization")
            scheme, credentials = authorization.split(" ")
            if scheme != "Bearer":
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Wrong authentication token scheme, it uses only 'Bearer' token scheme.",
                        description=None
                    )
                )
            try:
                access_token: dict = decrypt_object(encrypted=credentials)
            except json.decoder.JSONDecodeError:
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Wrong access token.",
                        description=None
                    )
                )
            token: dict = database["token"].find_one(
                filter=dict(access_token=credentials)
            )
            if not token:
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Unknown access token.",
                        description=None
                    )
                )
            elif token["revoked"]:
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="This access token is revoked.",
                        description=None
                    )
                )
            elif datetime.fromtimestamp(access_token["expiry_date"]) < datetime.now():
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Access token is expired.",
                        description=None
                    )
                )
            elif access_token["token_type"] != "valid":
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Access token is not valid token.",
                        description=None
                    )
                )
            if access_token["role"]["type"] not in roles:
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Action denied, you don't have permission to access.",
                        description=None
                    )
                )
            user: dict = database["user"].find_one(
                filter=dict(_id=ObjectId(token["user_id"]))
            )
            if (access_token["role"]["type"] == "admin" == user["role"]) \
                    and decrypt(flask.config["PASSPHRASE_KEY"]) != access_token["role"]["passphrase"]:
                return response(
                    status=HTTPStatus.UNAUTHORIZED,
                    error=dict(
                        type=None,
                        message="Action denied, if you are admin please check the passphrase.",
                        description=None
                    )
                )
            kwargs['user'] = user
            return method(*args, **kwargs)
        return wrapper
    return middleware
