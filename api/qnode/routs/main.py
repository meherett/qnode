#!/usr/bin/env python3

from flask import Response
from http import HTTPStatus

import werkzeug.exceptions

from .. import (
    flask, response
)


@flask.route("/api", methods=["GET"])
@flask.route("/", methods=["GET"], subdomain="api")
def home_resource() -> Response:
    return response(
        status=HTTPStatus.OK,
        data=dict(
            title="Welcome to QNode API :)",
            description="ETH-Qtum (Mainnet and Testnet) node provider.",
            author="Meheret Tesfaye Batu",
            email="meherett@zoho.com",
            version="v1-beta"
        )
    )


@flask.errorhandler(HTTPStatus.NOT_FOUND)
def page_not_found_resource(exception: werkzeug.exceptions.NotFound) -> Response:
    return response(
        status=HTTPStatus.NOT_FOUND,
        error=dict(
            type=type(exception).__name__,
            message=f"Ops! Sorry, nothing here!",
            description=exception.description
        )
    )


@flask.errorhandler(HTTPStatus.INTERNAL_SERVER_ERROR)
def internal_server_error_resource(exception: werkzeug.exceptions.InternalServerError) -> Response:
    return response(
        status=HTTPStatus.INTERNAL_SERVER_ERROR,
        error=dict(
            type=type(exception).__name__,
            message="Ops! Internal server error, Try again later!",
            description=exception.description
        )
    )


@flask.errorhandler(Exception)
def exception_resource(exception: Exception) -> Response:
    return response(
        status=HTTPStatus.INTERNAL_SERVER_ERROR,
        error=dict(
            type=type(exception).__name__,
            message=None,
            description=str(exception)
        )
    )
