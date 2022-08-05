#!/usr/bin/env python3

from http import HTTPStatus
from bson.json_util import dumps
from typing import (
    Optional, Any, Union, List
)
from itsdangerous import URLSafeTimedSerializer
from pymongo.database import Database
from pymongo.cursor import Cursor
from pymongo import (
    MongoClient, ReadPreference
)
from flask import (
    Flask, Response, request
)
from flask_restful import Api
from flask_mail import Mail
from flask_sock import Sock
from flask_cors import CORS

# Initialize Flask
flask: Flask = Flask(__name__)
# Add CORS
CORS(flask, origins="*")
# Set Configuration
flask.config.from_object("qnode.config.Config")
# Add Mail
mail: Mail = Mail(flask)
# Initialize Flask RESTful API
api: Api = Api(flask)
# Initialize Websocket
sock: Sock = Sock(flask)
# URL Safe Timed Serializer
url_safe_timed_serializer: URLSafeTimedSerializer = URLSafeTimedSerializer(
    secret_key=flask.config["SECRET_KEY"]
)

# Initialize MongoDB Client
mongo_client: MongoClient = MongoClient(
    host=flask.config["DATABASE_URL"], read_preference=ReadPreference.PRIMARY
)
# Get BySwap API Database
database: Database = mongo_client[
    flask.config["DATABASE_NAME"]
]

if "statistics" not in database.list_collection_names():
    database.create_collection(
        name="statistics",
        timeseries=dict(
            timeField="timestamp", metaField="metadata", granularity="minutes"
        ),
        expireAfterSeconds=2592000
    )
    database["statistics"].create_index([
        ("timestamp", 1), ("metadata.network", 1), ("metadata.method", 1), ("metadata.user_id", 1), ("metadata.project_id", 1)
    ])


def response(
    status: Union[HTTPStatus, Any], error: Optional[dict] = None,
    data: Optional[Union[dict, Cursor, list]] = None, headers: dict = flask.config["HEADERS"]
) -> Response:
    return Response(
        status=status,
        headers=headers,
        response=dumps(dict(
            status=dict(
                name=status.name, code=status.value
            ),
            error=error,
            data=data
        ), indent=4)
    )


packages: List[str] = [
    "qnode.common",
    "qnode.endpoints",
    "qnode.authentication",
    "qnode.resources",
    "qnode.routs",
    "qnode.statistics"
]

__all__: list = [
    request, mail, sock, url_safe_timed_serializer
]

for package in packages:
    __import__(package)
