#!/usr/bin/env python3

from flask_restful import Resource
from http import HTTPStatus
from collections import OrderedDict
from pymongo.results import (
    InsertOneResult, UpdateResult, DeleteResult
)
from datetime import datetime
from pymongo.cursor import Cursor
from pymongo.errors import WriteError
from bson.objectid import ObjectId
from flask_mail import Message
from typing import Optional
from flask import url_for

import pymongo
import pyotp

from ..authentication import is_authorized
from ..common import (
    body_required, except_required
)
from ..security import (
    generate_hash_by_pbkdf2, verify_hash_by_pbkdf2, encrypt, decrypt
)
from .. import (
    flask, database, response, Response, request, mail, url_safe_timed_serializer
)


class UserResource(Resource):

    @is_authorized(["admin", "user"])
    def get(self, user: dict, _id: Optional[str] = None, **kwargs) -> Response:
        if _id is None and user["role"] == "admin":
            page: int = request.args.get("page", default=1, type=int)
            limit: int = request.args.get("limit", default=10, type=int)
            skip: int = (page - 1) * limit
            _data: Cursor = database["user"].find(
            ).limit(limit=limit).skip(skip=skip)
            data: dict = {
                "limit": limit,
                "page": page,
                "total": database["user"].count_documents({}),
                "data": _data
            }
        elif _id is None and user["role"] == "user":
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="Action denied, you don't have the permission to access another user's data's. Only for admin user.",
                    description=None
                )
            )
        else:
            if ObjectId(_id) != user["_id"] and user["role"] == "user":
                return response(
                    status=HTTPStatus.FORBIDDEN,
                    error=dict(
                        type=None,
                        message="Action denied, you don't have the permission to access another user's data detail.",
                        description=None
                    )
                )
            else:
                data: dict = database["user"].find_one(
                    filter=dict(_id=ObjectId(_id))
                )
        return response(
            status=HTTPStatus.OK, data=data
        )

    @is_authorized(["admin", "user"])
    @body_required({"email", "password"})
    def post(self, **kwargs) -> Response:
        request_json: dict = request.get_json()
        try:
            if "user" not in database.list_collection_names():
                database.create_collection("user")
            database.command(command=OrderedDict(flask.config["DATABASE_SCHEMAS"]["user"]))
            database["user"].create_index("email", unique=True)

            data: InsertOneResult = database["user"].insert_one(
                bypass_document_validation=False, document={
                    "_id": ObjectId(),
                    "email": request_json["email"],
                    "password": generate_hash_by_pbkdf2(
                        data=request_json["password"],
                        salt_size=flask.config["SALT_SIZE"],
                        rounds=flask.config["ROUNDS"]
                    ),
                    "is_confirmed": False,
                    "role": "user",
                    "organization": dict(
                        name=None, url=None, role=None, size=None, category=None
                    ),
                    "email_notification": False,
                    "theme": "light",
                    "2fa": dict(
                        is_enabled=False, otp=None
                    ),
                    "date_created": datetime.now(),
                    "last_modified": datetime.now()
                }
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

    @is_authorized(["admin", "user"])
    @except_required({"email", "password", "organization", "email_notification", "theme"})
    def put(self, user: dict, _id: Optional[str] = None, **kwargs) -> Response:
        request_json: dict = request.get_json()
        if user["role"] == "admin":
            data: UpdateResult = database["user"].update_one(
                filter=dict(_id=ObjectId(_id)),
                update={
                    "$set": {
                        **request_json,
                        "last_modified": datetime.now()
                    }
                }
            )
        elif ObjectId(_id) != user["_id"]:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="Action denied, you don't have the permission to update another user's data.",
                    description=None
                )
            )
        else:
            if "email" in request_json:
                if "password" not in request_json:
                    return response(
                        status=HTTPStatus.BAD_REQUEST,
                        error=dict(
                            type=None,
                            message="To change email address, password is required.",
                            description=None
                        )
                    )
                elif not verify_hash_by_pbkdf2(
                        data=request_json["password"], hashed=user["password"],
                        salt_size=flask.config["SALT_SIZE"], rounds=flask.config["ROUNDS"]
                ):
                    return response(
                        status=HTTPStatus.BAD_REQUEST,
                        error=dict(
                            type=None,
                            message="Wrong password, try again.",
                            description=None
                        )
                    )
                data: dict = database["user"].find_one_and_update(
                    filter=dict(_id=ObjectId(_id)),
                    update={
                        "$set": {
                            "email": request_json["email"],
                            "is_confirmed": False if request_json["email"] != user["email"] else True,
                            "last_modified": datetime.now()
                        }
                    },
                    return_document=pymongo.ReturnDocument.AFTER
                )
                token: str = url_safe_timed_serializer.dumps(
                    request_json["email"], salt=flask.config["SALT_EMAIL"]
                )
                message: Message = Message(
                    subject="QNode - Account confirmation for changed email",
                    sender=flask.config["SENDER_EMAIL_ADDRESS"],
                    recipients=[request_json["email"]]
                )
                link: str = url_for('confirm_email_resource', token=token, _external=True)
                message.html = f"""<div>     <span class="highlight" style="background-color:rgb(255, 255, 255)">         <span class="colour" style="color:rgb(34, 34, 34)">             <span class="font" style="font-family:Arial, Helvetica, sans-serif">                 <span class="size" style="font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; float: none;">                     Dear Sir/Madam,                 </span>             </span>         </span>     </span>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div>     Thank you for completing your registration.     <br> </div> <div>     <br> </div> <div>     This email serves as a confirmation that your account is activated and that you are officially a part of the QNode family. Click the link below to confirm your email.     <br> </div> <div>     <br> </div> <div>     <b>         Confirmation link     </b>     :     <a href="{flask.config['QNODE_WEB_ENDPOINT']}/confirm-email/{token}" target="_blank">         {flask.config['QNODE_WEB_ENDPOINT']}/confirm-email/{token}     </a>     <br> </div> <div>     <br> </div> <div> </div> <div>   </div> <div>     Enjoy!     <br> </div> <div>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     Yours,&nbsp;     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     The QNode team     <br> </div>"""
                mail.send(message=message)
            else:
                if "password" in request_json:
                    return response(
                        status=HTTPStatus.BAD_REQUEST,
                        error=dict(
                            type=None,
                            message="You can't update your password here!",
                            description=None
                        )
                    )
                data: dict = database["user"].find_one_and_update(
                    filter=dict(_id=ObjectId(_id)),
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
    def delete(self, user: dict, _id: Optional[str] = None, **kwargs) -> Response:
        if user["role"] == "admin":
            data: DeleteResult = database["user"].delete_one(
                filter=dict(_id=ObjectId(_id))
            )
            database["project"].delete_many(
                filter=dict(user_id=ObjectId(_id))
            )
            database["token"].delete_one(
                filter=dict(user_id=ObjectId(_id))
            )
        elif ObjectId(_id) != user["_id"]:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="Action denied, you don't have the permission to delete another user's data.",
                    description=None
                )
            )
        else:
            data: DeleteResult = database["user"].delete_one(
                filter=dict(_id=ObjectId(_id))
            )
            database["project"].delete_many(
                filter=dict(user_id=ObjectId(_id))
            )
            database["statistics"].delete_many(
                filter={
                    "metadata.user_id": ObjectId(_id)
                }
            )
            database["token"].delete_one(
                filter=dict(user_id=ObjectId(_id))
            )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                _id=ObjectId(_id),
                acknowledged=data.acknowledged,
                deleted_count=data.deleted_count
            )
        )


@flask.route("/api/users/<_id>/generate-2fa", methods=["GET"])
@flask.route("/users/<_id>/generate-2fa", methods=["GET"], subdomain="api")
@is_authorized(["admin", "user"])
def generate_2fa(user: dict, _id: Optional[str] = None, **kwargs) -> Response:
    _user: dict = database["user"].find_one(
        filter=ObjectId(_id)
    )
    otp: str = pyotp.random_base32()
    otp_uri: str = pyotp.totp.TOTP(otp).provisioning_uri(
        name=_user["email"], issuer_name=flask.config["ISSUER_NAME"]
    )

    if user["role"] == "admin":
        data: dict = database["user"].find_one_and_update(
            filter=dict(_id=_user["_id"]),
            update={
                "$set": {
                    "2fa.otp": encrypt(data=otp),
                    "2fa.is_enabled": False,
                    "last_modified": datetime.now()
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    elif _user["_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's account.",
                description=None
            )
        )
    else:
        data: dict = database["user"].find_one_and_update(
            filter=dict(_id=_user["_id"]),
            update={
                "$set": {
                    "2fa.otp": encrypt(data=otp),
                    "2fa.is_enabled": False,
                    "last_modified": datetime.now()
                }
            },
            return_document=pymongo.ReturnDocument.AFTER
        )
    data.setdefault("qr_2fa", dict(
        otp=otp, otp_uri=otp_uri
    ))
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/users/<_id>/enable-2fa", methods=["POST"])
@flask.route("/users/<_id>/enable-2fa", methods=["POST"], subdomain="api")
@is_authorized(["admin", "user"])
@body_required({"otp"})
def enable_2fa(user: dict, _id: Optional[str] = None, **kwargs) -> Response:
    request_json: dict = request.get_json()
    _user: dict = database["user"].find_one(
        filter=ObjectId(_id)
    )
    if _user["2fa"]["otp"] is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message="One-Time Password (OTP) is required.",
                description=None
            )
        )

    if user["role"] == "admin":
        if pyotp.TOTP(decrypt(encrypted=_user["2fa"]["otp"])).verify(request_json["otp"]):
            data: dict = database["user"].find_one_and_update(
                filter=dict(_id=_user["_id"]),
                update={
                    "$set": {
                        "2fa.is_enabled": True,
                        "last_modified": datetime.now()
                    }
                },
                return_document=pymongo.ReturnDocument.AFTER
            )
        else:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="You have supplied an invalid 2FA token.",
                    description=None
                )
            )
    elif _user["_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's account.",
                description=None
            )
        )
    else:
        if pyotp.TOTP(decrypt(encrypted=_user["2fa"]["otp"])).verify(request_json["otp"]):
            data: dict = database["user"].find_one_and_update(
                filter=dict(_id=_user["_id"]),
                update={
                    "$set": {
                        "2fa.is_enabled": True,
                        "last_modified": datetime.now()
                    }
                },
                return_document=pymongo.ReturnDocument.AFTER
            )
        else:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="You have supplied an invalid 2FA token.",
                    description=None
                )
            )
    return response(
        status=HTTPStatus.OK,
        data=data
    )


@flask.route("/api/users/<_id>/disable-2fa", methods=["POST"])
@flask.route("/users/<_id>/disable-2fa", methods=["POST"], subdomain="api")
@is_authorized(["admin", "user"])
@body_required({"otp"})
def disable_2fa(user: dict, _id: Optional[str] = None, **kwargs) -> Response:
    request_json: dict = request.get_json()
    _user: dict = database["user"].find_one(
        filter=ObjectId(_id)
    )
    if _user["2fa"]["otp"] is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message="One-Time Password (OTP) is required.",
                description=None
            )
        )

    if user["role"] == "admin":
        if pyotp.TOTP(decrypt(encrypted=_user["2fa"]["otp"])).verify(request_json["otp"]):
            data: dict = database["user"].find_one_and_update(
                filter=dict(_id=_user["_id"]),
                update={
                    "$set": {
                        "2fa.otp": None,
                        "2fa.is_enabled": False,
                        "last_modified": datetime.now()
                    }
                },
                return_document=pymongo.ReturnDocument.AFTER
            )
        else:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="You have supplied an invalid 2FA token.",
                    description=None
                )
            )
    elif _user["_id"] != user["_id"]:
        return response(
            status=HTTPStatus.FORBIDDEN,
            error=dict(
                type=None,
                message="Action denied, you don't have the permission to update another user's account.",
                description=None
            )
        )
    else:
        if pyotp.TOTP(decrypt(encrypted=_user["2fa"]["otp"])).verify(request_json["otp"]):
            data: dict = database["user"].find_one_and_update(
                filter=dict(_id=_user["_id"]),
                update={
                    "$set": {
                        "2fa.otp": None,
                        "2fa.is_enabled": False,
                        "last_modified": datetime.now()
                    }
                },
                return_document=pymongo.ReturnDocument.AFTER
            )
        else:
            return response(
                status=HTTPStatus.FORBIDDEN,
                error=dict(
                    type=None,
                    message="You have supplied an invalid 2FA token.",
                    description=None
                )
            )
    return response(
        status=HTTPStatus.OK,
        data=data
    )
