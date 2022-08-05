#!/usr/bin/env python3

from flask_restful import Resource
from http import HTTPStatus
from collections import OrderedDict
from pymongo.results import (
    InsertOneResult, UpdateResult, DeleteResult
)
from pymongo.cursor import Cursor
from pymongo.errors import WriteError
from bson.objectid import ObjectId
from typing import Optional

import datetime
import pymongo

from ..utils import get_current_timestamp
from ..authentication import is_authorized
from ..common import body_required
from .. import (
    flask, database, response, Response, request
)


class TokenResource(Resource):

    @is_authorized(["admin"])
    def get(self, _id: Optional[str] = None, **kwargs) -> Response:
        if _id is None:
            page: int = int(request.args.get("page")) if request.args.get("page") else 1
            limit: int = int(request.args.get("limit")) if request.args.get("limit") else 10
            skip: int = (page - 1) * limit
            _data: Cursor = database["token"].find(
            ).limit(limit=limit).skip(skip=skip)
            data: dict = {
                "limit": limit,
                "page": page,
                "total": database["token"].count_documents({}),
                "data": _data
            }
        else:
            data: dict = database["token"].find_one(
                filter=dict(_id=ObjectId(_id))
            )
        return response(
            status=HTTPStatus.OK, data=data
        )

    @is_authorized(["admin"])
    @body_required({"access_token", "refresh_token", "user_id"})
    def post(self, **kwargs) -> Response:
        request_json: dict = request.get_json()
        try:

            if "token" not in database.list_collection_names():
                database.create_collection("token")
            database.command(command=OrderedDict(flask.config["DATABASE_SCHEMAS"]["token"]))
            database["token"].create_index("wallet", unique=True)

            data: InsertOneResult = database["token"].insert_one(
                bypass_document_validation=False, document=dict(
                    _id=ObjectId(),
                    access_token=request_json["access_token"],
                    refresh_token=request_json["refresh_token"],
                    revoked=False,
                    user_id=ObjectId(request_json["user_id"]),
                    expiry_date=datetime.datetime.fromtimestamp(get_current_timestamp(plus=3600)),
                    date_created=datetime.datetime.now(),
                    last_modified=datetime.datetime.now()
                )
            )
            return response(
                status=HTTPStatus.CREATED,
                data=dict(
                    _id=data.inserted_id,
                    acknowledged=data.acknowledged,
                )
            )
        except pymongo.errors.DuplicateKeyError as exception:
            return response(
                status=HTTPStatus.CONFLICT,
                error=dict(
                    type=type(exception).__name__,
                    message=None,
                    description=str(exception)
                )
            )
        except (pymongo.errors.WriteError, ValueError) as exception:
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=type(exception).__name__,
                    message=None,
                    description=str(exception)
                )
            )

    @is_authorized(["admin"])
    def put(self, _id: Optional[str] = None, **kwargs) -> Response:
        request_json: dict = request.get_json()
        data: UpdateResult = database["token"].update_one(
            filter=dict(_id=ObjectId(_id)),
            update={
                "$set": {
                    **request_json,
                    "last_modified": datetime.datetime.now()
                }
            }
        )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                _id=ObjectId(_id),
                acknowledged=data.acknowledged,
                matched_count=data.matched_count,
                modified_count=data.modified_count
            )
        )

    @is_authorized(["admin"])
    def delete(self, _id: Optional[str] = None, **kwargs) -> Response:
        data: DeleteResult = database["token"].delete_one(
            filter=dict(_id=ObjectId(_id))
        )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                _id=ObjectId(_id),
                acknowledged=data.acknowledged,
                deleted_count=data.deleted_count
            )
        )
