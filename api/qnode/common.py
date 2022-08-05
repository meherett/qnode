#!/usr/bin/env python3

from flask import (
    Response, request
)
from http import HTTPStatus
from typing import (
    Any, Union
)

import json
import functools

from . import response


def has_body(method) -> Union[Response, Any]:
    @functools.wraps(method)
    def wrapper(*args, **kwargs):
        try:
            if not request.json:
                return response(
                    status=HTTPStatus.BAD_REQUEST,
                    error=dict(
                        type=None,
                        message="Body is required (and must be JSON).",
                        description=None
                    )
                )
        except json.decoder.JSONDecodeError as exception:
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=type(exception).__name__,
                    message=None,
                    description=str(exception)
                )
            )
        return method(*args, **kwargs)
    return wrapper


def body_required(required: set) -> Union[Response, Any]:
    def middleware(method):
        @functools.wraps(method)
        def wrapper(*args, **kwargs):
            intersection = required.intersection(set(request.json.keys()))
            if intersection != required:
                return response(
                    status=HTTPStatus.NOT_FOUND,
                    error=dict(
                        type=None,
                        message="{} are required.".format(
                            ", ".join("{!r}".format(key) for key in required - intersection)
                        ),
                        description=None
                    )
                )
            return method(*args, **kwargs)
        return wrapper
    return middleware


def except_required(requires: set) -> Union[Response, Any]:
    def middleware(method):
        @functools.wraps(method)
        def wrapper(*args, **kwargs):
            unknown_keys = list()
            for key in request.json.keys():
                key_request = key.split(".")[0]
                if key_request not in list(requires):
                    unknown_keys.append(key_request)
            if len(unknown_keys) != 0:
                required_keys = "Only use this keys {} to update.".format(
                    " or ".join("{!r}".format(required) for required in requires)
                )
                unknown_keys = "Please remove unknown this keys {}".format(
                    ", ".join("{!r}".format(unknown_key) for unknown_key in unknown_keys)
                )
                return response(
                    status=HTTPStatus.BAD_REQUEST,
                    error=dict(
                        type=None,
                        message=f"{unknown_keys}, {required_keys}",
                        description=None
                    )
                )
            return method(*args, **kwargs)
        return wrapper
    return middleware
