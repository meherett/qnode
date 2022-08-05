#!/usr/bin/env python3

from flask_restful import Resource
from http import HTTPStatus
from collections import OrderedDict
from pymongo.results import (
    InsertOneResult, DeleteResult
)
from pymongo.cursor import Cursor
from pymongo.errors import WriteError
from bson.objectid import ObjectId
from typing import Optional
from datetime import (
    datetime, timedelta
)

import hashlib
import bson.errors
import binascii
import pymongo
import base64
import json

from ..utils import generate_key
from ..authentication import is_authorized
from ..common import (
    body_required, except_required
)
from .. import (
    flask, database, response, Response, request
)


class ProjectResource(Resource):

    @is_authorized(["admin", "user"])
    def get(self, user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
        if _id_or_key is None:

            user_id: Optional[str] = request.args.get("user_id", default=None, type=str)
            page: int = request.args.get("page", default=1, type=int)
            limit: int = request.args.get("limit", default=10, type=int)
            sort: str = request.args.get("sort", default="descending", type=str)
            find_all: bool = json.loads(request.args.get("find-all", default="false", type=str).lower())
            default_filter: str = "_id,name,description,key,status,user_id,date_created,last_modified,today_statistics"
            _filter: str = request.args.get("filter", default=default_filter, type=str)
            filter_list: list = _filter.split(",")
            skip: int = (page - 1) * limit

            if user["role"] == "admin":
                if user_id:
                    data: Cursor = database["project"].find({
                        "user_id": ObjectId(user_id)
                    }).limit(limit=limit).skip(skip=skip).sort(
                      'date_created', pymongo.ASCENDING if sort == "ascending" else pymongo.DESCENDING
                    )
                else:
                    data: Cursor = database["project"].find(
                    ).limit(limit=limit).skip(skip=skip).sort(
                      'date_created', pymongo.ASCENDING if sort == "ascending" else pymongo.DESCENDING
                    )
            elif user_id and ObjectId(user_id) != user["_id"]:
                return response(
                    status=HTTPStatus.FORBIDDEN,
                    error=dict(
                        type=None,
                        message="Action denied, you don't have the permission to access another user's projects.",
                        description=None
                    )
                )
            else:
                data: list = []
                if find_all:
                    projects: Cursor = database["project"].find({
                        "user_id": user["_id"]
                    }).sort(
                        "date_created", pymongo.ASCENDING if sort == "ascending" else pymongo.DESCENDING
                    )
                else:
                    projects: Cursor = database["project"].find({
                        "user_id": user["_id"]
                    }).limit(limit=limit).skip(skip=skip).sort(
                        "date_created", pymongo.ASCENDING if sort == "ascending" else pymongo.DESCENDING
                    )
                current_datetime: datetime = datetime.utcnow()
                current_datetime = current_datetime.replace(
                    second=0, microsecond=0
                )
                from_datetime: datetime = (current_datetime - timedelta(hours=24))
                for project in projects:
                    if "today_statistics" in filter_list:
                        statistics: list = list(database["statistics"].aggregate([
                            {
                                "$match": {
                                    "metadata.user_id": {
                                        "$eq": user["_id"]
                                    },
                                    "metadata.project_id": {
                                        "$eq": project["_id"]
                                    },
                                    "timestamp": {
                                        "$gte": from_datetime, "$lt": current_datetime
                                    }
                                }
                            },
                            {
                                "$group": {
                                    "_id": "$metadata.project_id",
                                    "total_valid": {
                                        "$sum": "$metadata.valid"
                                    },
                                    "total_invalid": {
                                        "$sum": "$metadata.invalid"
                                    },
                                    "total_volume": {
                                        "$sum": "$metadata.volume"
                                    }
                                }
                            }
                        ]))
                        today_statistics: dict = statistics[0] if statistics else {
                            "_id": project["_id"], "total_valid": 0, "total_invalid": 0, "total_volume": 0
                        }
                        today_statistics.pop("_id")
                        project.setdefault(
                            "today_statistics", today_statistics
                        )

                    temp_project: dict = {}
                    for key in filter_list:
                        temp_project.setdefault(key, project[key])
                    data.append(temp_project)

            return response(
                status=HTTPStatus.OK,
                data=data if find_all else {
                    "limit": limit,
                    "page": page,
                    "total": database["project"].count_documents({
                        "user_id": user["_id"]
                    }),
                    "data": data
                }
            )
        else:
            try:
                filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
            except bson.errors.InvalidId:
                filter_by_id_or_key: dict = dict(key=_id_or_key)
            data: dict = database["project"].find_one(
                filter=filter_by_id_or_key
            )
            if data is None:
                return response(
                    status=HTTPStatus.OK, data=data
                )
            elif data["user_id"] != user["_id"] and user["role"] == "user":
                return response(
                    status=HTTPStatus.FORBIDDEN,
                    error=dict(
                        type=None,
                        message="Action denied, you don't have the permission to access another user's project detail.",
                        description=None
                    )
                )
            return response(
                status=HTTPStatus.OK, data=data
            )

    @is_authorized(["admin", "user"])
    @body_required({"name", "description"})
    def post(self, user: dict, **kwargs) -> Response:
        request_json: dict = request.get_json()
        try:
            if "project" not in database.list_collection_names():
                database.create_collection("project")
            database.command(command=OrderedDict(flask.config["DATABASE_SCHEMAS"]["project"]))
            database["project"].create_index("key", unique=True)

            while True:
                try:
                    data: InsertOneResult = database["project"].insert_one(
                        bypass_document_validation=False, document=dict(
                            _id=ObjectId(),
                            name=request_json["name"],
                            description=request_json["description"],
                            key=generate_key(length=flask.config["KEY_LENGTH"]),
                            status="active",  # Choose active or inactive
                            user_id=user["_id"],
                            security=dict(
                                use_basic_auth=False,
                                basic_auths=[],
                                use_jwt_auth=False,
                                jwt_auths=[],
                                per_second_requests=0,
                                per_day_requests=0,
                                allowed_user_agents=[],
                                allowed_origins=[],
                                allowed_methods=[]
                            ),
                            date_created=datetime.now(),
                            last_modified=datetime.now()
                        )
                    )
                    break
                except pymongo.errors.DuplicateKeyError:
                    pass

            return response(
                status=HTTPStatus.CREATED,
                data=dict(
                    _id=data.inserted_id,
                    acknowledged=data.acknowledged,
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

    @is_authorized(["admin", "user"])
    @except_required({"name", "description", "key", "status", "security"})
    def put(self, user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
        request_json: dict = request.get_json()
        try:
            filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
        except bson.errors.InvalidId:
            filter_by_id_or_key: dict = dict(key=_id_or_key)
        project: dict = database["project"].find_one(
            filter=filter_by_id_or_key
        )
        if user["role"] == "admin":
            data: dict = database["project"].find_one_and_update(
                filter=dict(_id=project["_id"]),
                update={
                    "$set": {
                        **request_json,
                        "last_modified": datetime.now()
                    }
                },
                return_document=pymongo.ReturnDocument.AFTER
            )
        elif project["user_id"] != user["_id"]:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="Action denied, you don't have the permission to update another user's project.",
                    description=None
                )
            )
        else:
            data: dict = database["project"].find_one_and_update(
                filter=dict(_id=project["_id"]),
                update={
                    "$set": {
                        **request_json,
                        "last_modified": datetime.now()
                    }
                },
                return_document=pymongo.ReturnDocument.AFTER
            )
        return response(
            status=HTTPStatus.OK,
            data=data
        )

    @is_authorized(["admin", "user"])
    def delete(self, user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
        try:
            filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
        except bson.errors.InvalidId:
            filter_by_id_or_key: dict = dict(key=_id_or_key)
        project: dict = database["project"].find_one(
            filter=filter_by_id_or_key
        )
        if user["role"] == "admin":
            data: DeleteResult = database["project"].delete_one(
                filter=dict(_id=project["_id"])
            )
        elif project["user_id"] != user["_id"]:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="Action denied, you don't have the permission to delete another user's project.",
                    description=None
                )
            )
        else:
            data: DeleteResult = database["project"].delete_one(
                filter=dict(_id=project["_id"])
            )
            database["statistics"].delete_many(
                filter={
                    "metadata.project_id": project["_id"]
                }
            )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                _id=project["_id"],
                acknowledged=data.acknowledged,
                deleted_count=data.deleted_count
            )
        )


@flask.route("/api/projects/<_id_or_key>/add-basic-auth", methods=["POST"])
@flask.route("/projects/<_id_or_key>/add-basic-auth", methods=["POST"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"username", "password"})
def add_basic_auth(user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    if not request_json["username"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Username is empty.",
                description=None
            )
        )
    elif str(" ") in request_json["username"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Space is not allowed in that username.",
                description=None
            )
        )
    for basic_auth in project["security"]["basic_auths"]:
        if basic_auth["username"] == request_json["username"]:
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=None,
                    message=f"That username is already exist.",
                    description=None
                )
            )
    md5_hash = hashlib.md5()
    md5_hash.update(request_json["password"].encode("utf-8"))
    password_md5_hash = md5_hash.hexdigest()
    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.basic_auths": {
                        "username": request_json["username"],
                        "password": password_md5_hash
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.basic_auths": {
                        "username": request_json["username"],
                        "password": password_md5_hash
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/remove-basic-auth/<username>", methods=["DELETE"])
@flask.route("/projects/<_id_or_key>/remove-basic-auth/<username>", methods=["DELETE"], subdomain="api")
@is_authorized(["admin", "user"])
def remove_basic_auth(user: dict, _id_or_key: str, username: str, **kwargs) -> Response:
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    basic_auth: Optional[dict] = None
    for temp_basic_auth in project["security"]["basic_auths"]:
        if temp_basic_auth["username"] == username:
            basic_auth = dict(
                username=temp_basic_auth["username"], password=temp_basic_auth["password"]
            )
    if basic_auth is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Can't find that basic authentication to remove.",
                description=None
            )
        )
    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.basic_auths": {
                        "username": username
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.basic_auths": {
                        "username": username
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/add-jwt-auth", methods=["POST"])
@flask.route("/projects/<_id_or_key>/add-jwt-auth", methods=["POST"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"name", "public_key"})
def add_jwt_auth(user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )

    public_key: str = request_json['public_key']
    begin_public_key: str = public_key.replace('-----BEGIN PUBLIC KEY-----\n', '')
    end_public_key: str = begin_public_key.replace('\n-----END PUBLIC KEY-----', '')
    break_public_key: str = end_public_key.replace('\n', '')
    for jwt_auth in project["security"]["jwt_auths"]:
        if jwt_auth["public_key"] == break_public_key:
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=None,
                    message="That public key is already exist.",
                    description=None
                )
            )

    try:
        sha256 = hashlib.sha256()
        sha256.update(base64.b64decode(break_public_key))
        fingerprint = base64.b64encode(sha256.digest())
    except binascii.Error:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message="Invalid data.",
                description=None
            )
        )

    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.jwt_auths": {
                        "name": request_json["name"],
                        "key": generate_key(length=flask.config["JWT_KEY_LENGTH"]),
                        "public_key": break_public_key,
                        "fingerprint": fingerprint.decode()
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.jwt_auths": {
                        "name": request_json["name"],
                        "key": generate_key(length=flask.config["JWT_KEY_LENGTH"]),
                        "public_key": break_public_key,
                        "fingerprint": fingerprint.decode()
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/remove-jwt-auth/<key>", methods=["DELETE"])
@flask.route("/projects/<_id_or_key>/remove-jwt-auth/<key>", methods=["DELETE"], subdomain="api")
@is_authorized(["admin", "user"])
def remove_jwt_auth(user: dict, _id_or_key: str, key: str, **kwargs) -> Response:
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    jwt_auth: Optional[dict] = None
    for temp_jwt_auth in project["security"]["jwt_auths"]:
        if temp_jwt_auth["key"] == key:
            jwt_auth = dict(
                name=temp_jwt_auth["name"],
                key=temp_jwt_auth["key"],
                public_key=temp_jwt_auth["public_key"],
                fingerprint=temp_jwt_auth["fingerprint"]
            )
    if jwt_auth is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Can't find that JWT authentication to remove.",
                description=None
            )
        )
    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.jwt_auths": {
                        "key": key
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.jwt_auths": {
                        "key": key
                    }
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/add-allowed-user-agent", methods=["POST"])
@flask.route("/projects/<_id_or_key>/add-allowed-user-agent", methods=["POST"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"user_agent"})
def add_allowed_user_agent(user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    if not request_json["user_agent"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"User-Agent is empty.",
                description=None
            )
        )
    elif request_json["user_agent"] in project["security"]["allowed_user_agents"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"That user-agent is already allowed.",
                description=None
            )
        )

    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.allowed_user_agents": request_json["user_agent"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.allowed_user_agents": request_json["user_agent"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/remove-allowed-user-agent", methods=["DELETE"])
@flask.route("/projects/<_id_or_key>/remove-allowed-user-agent", methods=["DELETE"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"user_agent"})
def remove_allowed_user_agent(user: dict, _id_or_key: str, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    allowed_user_agent: Optional[dict] = None
    if request_json["user_agent"] in project["security"]["allowed_user_agents"]:
        allowed_user_agent = request_json["user_agent"]
    if allowed_user_agent is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Can't find that user-agent to remove.",
                description=None
            )
        )
    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.allowed_user_agents": request_json["user_agent"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.allowed_user_agents": request_json["user_agent"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/add-allowed-origin", methods=["POST"])
@flask.route("/projects/<_id_or_key>/add-allowed-origin", methods=["POST"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"origin"})
def add_allowed_origin(user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    if not request_json["origin"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Origin is empty.",
                description=None
            )
        )
    elif request_json["origin"] in project["security"]["allowed_origins"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"That origin is already allowed.",
                description=None
            )
        )

    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.allowed_origins": request_json["origin"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.allowed_origins": request_json["origin"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/remove-allowed-origin", methods=["DELETE"])
@flask.route("/projects/<_id_or_key>/remove-allowed-origin", methods=["DELETE"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"origin"})
def remove_allowed_origin(user: dict, _id_or_key: str, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    allowed_origin: Optional[dict] = None
    if request_json["origin"] in project["security"]["allowed_origins"]:
        allowed_origin = request_json["origin"]
    if allowed_origin is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Can't find that origin to remove.",
                description=None
            )
        )
    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.allowed_origins": request_json["origin"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.allowed_origins": request_json["origin"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/add-allowed-method", methods=["POST"])
@flask.route("/projects/<_id_or_key>/add-allowed-method", methods=["POST"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"method"})
def add_allowed_method(user: dict, _id_or_key: Optional[str] = None, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    if not request_json["method"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Method is empty.",
                description=None
            )
        )
    elif request_json["method"] in project["security"]["allowed_methods"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"That method is already allowed.",
                description=None
            )
        )
    elif request_json["method"] not in flask.config["AVAILABLE_METHODS"]:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"That method is unknown.",
                description=None
            )
        )

    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.allowed_methods": request_json["method"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$push": {
                    "security.allowed_methods": request_json["method"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/projects/<_id_or_key>/remove-allowed-method", methods=["DELETE"])
@flask.route("/projects/<_id_or_key>/remove-allowed-method", methods=["DELETE"], subdomain="api")
@is_authorized(["admin", "user"])
@except_required({"method"})
def remove_allowed_method(user: dict, _id_or_key: str, **kwargs) -> Response:
    request_json: dict = request.get_json()
    try:
        filter_by_id_or_key: dict = dict(_id=ObjectId(_id_or_key))
    except bson.errors.InvalidId:
        filter_by_id_or_key: dict = dict(key=_id_or_key)
    project: dict = database["project"].find_one(
        filter=filter_by_id_or_key
    )
    allowed_method: Optional[dict] = None
    if request_json["method"] in project["security"]["allowed_methods"]:
        allowed_method = request_json["method"]
    if allowed_method is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"Can't find that method to remove.",
                description=None
            )
        )
    if user["role"] == "admin":
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.allowed_methods": request_json["method"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif project["user_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's project.",
                description=None
            )
        )
    else:
        data: dict = database["project"].find_one_and_update(
            filter=dict(_id=project["_id"]),
            update={
                "$set": {
                    "last_modified": datetime.now()
                },
                "$pull": {
                    "security.allowed_methods": request_json["method"]
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    return response(
        status=HTTPStatus.OK,
        data=data
    )
