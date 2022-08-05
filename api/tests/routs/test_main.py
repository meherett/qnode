#!/usr/bin/env python3

from flask.testing import FlaskClient
from typing import Any

import json

from qnode import flask


def test_index() -> None:
    flask_client: FlaskClient = flask.test_client()
    response: Any = flask_client.get("/")
    status_code = response.status_code
    assert status_code == 200


def test_index_content() -> None:
    flask_client: FlaskClient = flask.test_client()
    response: Any = flask_client.get("/")
    assert response.content_type == "application/json"


def test_index_data() -> None:
    flask_client: FlaskClient = flask.test_client()
    response: Any = flask_client.get("/")
    response_dict: dict = json.loads(response.data)

    assert "status" in response_dict.keys()
    assert "error" in response_dict.keys()
    assert "data" in response_dict.keys()
