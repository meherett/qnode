#!/usr/bin/env python3

from http import HTTPStatus
from collections import OrderedDict
from pymongo.results import (
    InsertOneResult, UpdateResult
)
from pymongo.cursor import Cursor
from pymongo.errors import WriteError
from bson.objectid import ObjectId
from flask_mail import Message
from datetime import (
    datetime, timedelta
)
# from flask import url_for

import itsdangerous
import pymongo
import pyotp
import json

from ..utils import get_current_timestamp
from ..common import body_required
from ..security import (
    encrypt_object, generate_hash_by_pbkdf2, verify_hash_by_pbkdf2, decrypt, decrypt_object
)
from .. import (
    flask, database, response, Response, request, mail, url_safe_timed_serializer
)


@flask.route("/api/auth/2fa", methods=["POST"])
@flask.route("/auth/2fa", methods=["POST"], subdomain="api")
@body_required({"access_token", "otp"})
def two_factor_authentication_resource() -> Response:
    request_json: dict = request.get_json()
    try:
        access_token: dict = decrypt_object(encrypted=request_json["access_token"])
    except json.decoder.JSONDecodeError:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message="Wrong access token.",
                description=None
            )
        )
    user: dict = database["user"].find_one(
        filter=dict(_id=ObjectId(access_token["user_id"]))
    )
    if not user:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type="user-id-not-found",
                message=f"We couldn't find an account with that user id.",
                description=None
            )
        )
    elif user["2fa"]["otp"] is None:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type="otp-not-found",
                message=f"We couldn't check the otp b/c there is no otp generated.",
                description=None
            )
        )

    if pyotp.TOTP(decrypt(encrypted=user["2fa"]["otp"])).verify(request_json["otp"]):
        token: dict = database["token"].find_one(
            filter=dict(access_token=request_json["access_token"])
        )
        if not token:
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=None,
                    message="Unknown access token.",
                    description=None
                )
            )
        elif token["revoked"]:
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=None,
                    message="This access token is revoked.",
                    description=None
                )
            )
        elif datetime.fromtimestamp(access_token["expiry_date"]) < datetime.now():
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=None,
                    message="Access token is expired.",
                    description=None
                )
            )
        elif access_token["token_type"] != "invalid":
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=None,
                    message="Already this access token is not needed 2FA token.",
                    description=None
                )
            )

        expiry_date: int = get_current_timestamp(plus=flask.config["TOKEN_EXPIRY_TIMESTAMP"])
        access_token: str = encrypt_object(data=dict(
            user_id=str(user["_id"]),
            role=dict(
                type=user["role"], passphrase=(
                    request_json["passphrase"] if "passphrase" in request_json else None
                )
            ),
            expiry_date=expiry_date,
            token_type="valid",
            is_enabled=True
        ))
        refresh_token: str = encrypt_object(data=dict(
            user_id=str(user["_id"]),
            role=dict(
                type=user["role"], passphrase=(
                    request_json["passphrase"] if "passphrase" in request_json else None
                )
            ),
            expiry_date=expiry_date,
            token_type="valid",
            is_enabled=True
        ))

        database["token"].update_one(
            filter=dict(_id=ObjectId(token["_id"])),
            update={
                "$set": dict(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    revoked=False,
                    expiry_date=datetime.fromtimestamp(expiry_date),
                    last_modified=datetime.now()
                )
            }
        )

        projects: Cursor = database["project"].find({
            "user_id": ObjectId(user["_id"])
        })
        current_datetime: datetime = datetime.utcnow()
        current_datetime = current_datetime.replace(
            second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(days=30))
        for project in projects:
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
            if statistics and project["status"] == "inactive":
                database["project"].update_one(
                    filter=dict(_id=ObjectId(project["_id"])), update={
                        "$set": {
                            "status": "active"
                        }
                    }
                )
            elif not statistics and project["status"] == "active":
                database["project"].update_one(
                    filter=dict(_id=ObjectId(project["_id"])), update={
                        "$set": {
                            "status": "inactive"
                        }
                    }
                )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                token=dict(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expiry_date=datetime.fromtimestamp(expiry_date),
                    token_type="valid"
                ),
                user={
                    "_id": user["_id"],
                    "email": user["email"],
                    "is_confirmed": user["is_confirmed"],
                    "2fa": dict(
                        is_enabled=True
                    )
                }
            )
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


@flask.route("/api/auth/login", methods=["POST"])
@flask.route("/auth/login", methods=["POST"], subdomain="api")
@body_required({"email", "password"})
def login_resource() -> Response:
    request_json: dict = request.get_json()
    user: dict = database["user"].find_one(
        filter=dict(email=request_json["email"])
    )
    if not user:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type="email-not-found",
                message=f"We couldn't find an account with that email.",
                description=None
            )
        )
    if not verify_hash_by_pbkdf2(
        data=request_json["password"], hashed=user["password"],
        salt_size=flask.config["SALT_SIZE"], rounds=flask.config["ROUNDS"]
    ):
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type="wrong-password",
                message=f"That password isn't right.",
                description=None
            )
        )
    token: dict = database["token"].find_one(
        filter=dict(user_id=ObjectId(user["_id"]))
    )
    if user["2fa"]["is_enabled"]:
        expiry_date: int = get_current_timestamp(plus=flask.config["TOKEN_2FA_EXPIRY_TIMESTAMP"])
        access_token: str = encrypt_object(data=dict(
            user_id=str(user["_id"]),
            role=dict(
                type=user["role"], passphrase=(
                    request_json["passphrase"] if "passphrase" in request_json else None
                )
            ),
            expiry_date=expiry_date,
            token_type="invalid",
            is_enabled=True
        ))
        refresh_token: str = encrypt_object(data=dict(
            user_id=str(user["_id"]),
            role=dict(
                type=user["role"], passphrase=(
                    request_json["passphrase"] if "passphrase" in request_json else None
                )
            ),
            expiry_date=expiry_date,
            token_type="invalid",
            is_enabled=True
        ))

        database["token"].update_one(
            filter=dict(_id=ObjectId(token["_id"])),
            update={
                "$set": dict(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    revoked=False,
                    expiry_date=datetime.fromtimestamp(expiry_date),
                    last_modified=datetime.now()
                )
            }
        )

        return response(
            status=HTTPStatus.OK,
            data=dict(
                token=dict(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expiry_date=datetime.fromtimestamp(expiry_date),
                    token_type="invalid"
                ),
                user={
                    "_id": user["_id"],
                    "email": user["email"],
                    "is_confirmed": user["is_confirmed"],
                    "2fa": dict(
                        is_enabled=True
                    )
                }
            )
        )
    else:
        expiry_date: int = get_current_timestamp(plus=flask.config["TOKEN_EXPIRY_TIMESTAMP"])
        access_token: str = encrypt_object(data=dict(
            user_id=str(user["_id"]),
            role=dict(
                type=user["role"], passphrase=(
                    request_json["passphrase"] if "passphrase" in request_json else None
                )
            ),
            expiry_date=expiry_date,
            token_type="valid",
            is_enabled=False
        ))
        refresh_token: str = encrypt_object(data=dict(
            user_id=str(user["_id"]),
            role=dict(
                type=user["role"], passphrase=(
                    request_json["passphrase"] if "passphrase" in request_json else None
                )
            ),
            expiry_date=expiry_date,
            token_type="valid",
            is_enabled=False
        ))
        if token:
            database["token"].update_one(
                filter=dict(_id=ObjectId(token["_id"])),
                update={
                    "$set": dict(
                        access_token=access_token,
                        refresh_token=refresh_token,
                        revoked=False,
                        expiry_date=datetime.fromtimestamp(expiry_date),
                        last_modified=datetime.now()
                    )
                }
            )
        else:
            database["token"].insert_one(
                bypass_document_validation=False, document=dict(
                    _id=ObjectId(),
                    access_token=access_token,
                    refresh_token=refresh_token,
                    revoked=False,
                    user_id=ObjectId(user["_id"]),
                    expiry_date=datetime.fromtimestamp(expiry_date),
                    date_created=datetime.now(),
                    last_modified=datetime.now()
                )
            )
        projects: Cursor = database["project"].find({
            "user_id": ObjectId(user["_id"])
        })
        current_datetime: datetime = datetime.utcnow()
        current_datetime = current_datetime.replace(
            second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(days=30))
        for project in projects:
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
            if statistics and project["status"] == "inactive":
                database["project"].update_one(
                    filter=dict(_id=ObjectId(project["_id"])), update={
                        "$set": {
                            "status": "active"
                        }
                    }
                )
            elif not statistics and project["status"] == "active":
                database["project"].update_one(
                    filter=dict(_id=ObjectId(project["_id"])), update={
                        "$set": {
                            "status": "inactive"
                        }
                    }
                )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                token=dict(
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expiry_date=datetime.fromtimestamp(expiry_date),
                    token_type="valid"
                ),
                user={
                    "_id": user["_id"],
                    "email": user["email"],
                    "is_confirmed": user["is_confirmed"],
                    "2fa": dict(
                        is_enabled=False
                    )
                }
            )
        )


@flask.route("/api/auth/confirm-email/<token>", methods=["GET"])
@flask.route("/auth/confirm-email/<token>", methods=["GET"], subdomain="api")
def confirm_email_resource(token: str) -> Response:
    try:
        email: str = url_safe_timed_serializer.loads(
            token, salt=flask.config["SALT_EMAIL"], max_age=flask.config["TOKEN_EXPIRY_TIMESTAMP"]
        )
        user: dict = database["user"].find_one(
            filter=dict(email=email)
        )
        if user["is_confirmed"]:
            return response(
                status=HTTPStatus.NOT_ACCEPTABLE,
                error=dict(
                    type=None,
                    email=email,
                    message=f"This {email} email address is already confirmed.",
                    description=None
                )
            )
        data: UpdateResult = database["user"].update_one(
            filter=dict(email=email),
            update={
                "$set": dict(
                    is_confirmed=True,
                    last_modified=datetime.now()
                )
            }
        )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                is_confirmed=True,
                email=email,
                message="Thank you for registering, access your account.",
                acknowledged=data.acknowledged,
                matched_count=data.matched_count,
                modified_count=data.modified_count
            )
        )
    except itsdangerous.SignatureExpired as exception:
        return response(
            status=HTTPStatus.TOO_EARLY,
            error=dict(
                type=type(exception).__name__,
                message=f"That confirmation token is expired.",
                description=None
            )
        )
    except itsdangerous.BadSignature as exception:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=type(exception).__name__,
                message=f"Bad confirmation token.",
                description=None
            )
        )


@flask.route("/api/auth/token-is-expired/<token>", methods=["GET"])
@flask.route("/auth/token-is-expired/<token>", methods=["GET"], subdomain="api")
def token_is_expired_resource(token: str) -> Response:
    try:
        email: str = url_safe_timed_serializer.loads(
            token, salt=flask.config["SALT_EMAIL"], max_age=flask.config["TOKEN_EXPIRY_TIMESTAMP"]
        )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                is_expired=False,
                email=email
            )
        )
    except itsdangerous.SignatureExpired as exception:
        return response(
            status=HTTPStatus.OK,
            data=dict(
                is_expired=True,
                email=None
            )
        )
    except itsdangerous.BadSignature as exception:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=type(exception).__name__,
                message=f"Bad confirmation token.",
                description=None
            )
        )


@flask.route("/api/auth/send-email-confirmation/<_id>", methods=["GET"])
@flask.route("/auth/send-email-confirmation/<_id>", methods=["GET"], subdomain="api")
def send_email_confirmation_resource(_id: str) -> Response:
    data: dict = database["user"].find_one(
        filter=dict(_id=ObjectId(_id))
    )
    if not data:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message=f"We couldn't find an account with that user id.",
                description=None
            )
        )
    elif data["is_confirmed"]:
        return response(
            status=HTTPStatus.OK,
            data=dict(
                email=data["email"],
                is_confirmed=data["is_confirmed"],
                message=f"That account email address is already confirmed."
            )
        )
    else:
        token: str = url_safe_timed_serializer.dumps(
            data["email"], salt=flask.config["SALT_EMAIL"]
        )
        message: Message = Message(
            subject="QNode - Account confirmation email",
            sender=flask.config["SENDER_EMAIL_ADDRESS"],
            recipients=[data["email"]]
        )
        # link: str = url_for('confirm_email_resource', token=token, _external=True)
        message.html = f"""<div>     <span class="highlight" style="background-color:rgb(255, 255, 255)">         <span class="colour" style="color:rgb(34, 34, 34)">             <span class="font" style="font-family:Arial, Helvetica, sans-serif">                 <span class="size" style="font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; float: none;">                     Dear Sir/Madam,                 </span>             </span>         </span>     </span>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div>     Thank you for completing your registration.     <br> </div> <div>     <br> </div> <div>     This email serves as a confirmation that your account is activated and that you are officially a part of the QNode family. Click the link below to confirm your email.     <br> </div> <div>     <br> </div> <div>     <b>         Confirmation link     </b>     :     <a href="{flask.config['QNODE_WEB_ENDPOINT']}/confirm-email/{token}" target="_blank">         {flask.config['QNODE_WEB_ENDPOINT']}/confirm-email/{token}     </a>     <br> </div> <div>     <br> </div> <div> </div> <div>   </div> <div>     Enjoy!     <br> </div> <div>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     Yours,&nbsp;     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     The QNode team     <br> </div>"""
        mail.send(message=message)

        return response(
            status=HTTPStatus.OK,
            data=dict(
                email=data["email"],
                is_confirmed=data["is_confirmed"],
                message="New confirmation token is sent, check your email."
            )
        )


@flask.route("/api/auth/email-is-registered", methods=["POST"])
@flask.route("/auth/email-is-registered", methods=["POST"], subdomain="api")
@body_required({"email"})
def email_is_registered() -> Response:
    request_json: dict = request.get_json()
    data: dict = database["user"].find_one(
        filter=dict(email=request_json["email"])
    )
    return response(
        status=HTTPStatus.OK, data={
            "is_registered": data is not None,
            "valid": data is None
        }
    )


@flask.route("/api/auth/register", methods=["POST"])
@flask.route("/auth/register", methods=["POST"], subdomain="api")
@body_required({"email", "password"})
def register_resource() -> Response:
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

        token: str = url_safe_timed_serializer.dumps(
            request_json["email"], salt=flask.config["SALT_EMAIL"]
        )
        message: Message = Message(
            subject="QNode - Account confirmation email",
            sender=flask.config["SENDER_EMAIL_ADDRESS"],
            recipients=[request_json["email"]]
        )
        # link: str = url_for('confirm_email_resource', token=token, _external=True)
        message.html = f"""<div>     <span class="highlight" style="background-color:rgb(255, 255, 255)">         <span class="colour" style="color:rgb(34, 34, 34)">             <span class="font" style="font-family:Arial, Helvetica, sans-serif">                 <span class="size" style="font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; float: none;">                     Dear Sir/Madam,                 </span>             </span>         </span>     </span>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div>     Thank you for completing your registration.     <br> </div> <div>     <br> </div> <div>     This email serves as a confirmation that your account is activated and that you are officially a part of the QNode family. Click the link below to confirm your email.     <br> </div> <div>     <br> </div> <div>     <b>         Confirmation link     </b>     :     <a href="{flask.config['QNODE_WEB_ENDPOINT']}/confirm-email/{token}" target="_blank">         {flask.config['QNODE_WEB_ENDPOINT']}/confirm-email/{token}     </a>     <br> </div> <div>     <br> </div> <div> </div> <div>   </div> <div>     Enjoy!     <br> </div> <div>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     Yours,&nbsp;     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     The QNode team     <br> </div>"""
        mail.send(message=message)

        return response(
            status=HTTPStatus.CREATED,
            data=dict(
                _id=data.inserted_id,
                email=request_json["email"],
                message="Your registration is complete, just confirm your email address.",
                acknowledged=data.acknowledged
            )
        )
    except pymongo.errors.DuplicateKeyError as exception:
        return response(
            status=HTTPStatus.CONFLICT,
            error=dict(
                type=type(exception).__name__,
                message=f"That email is already exist.",
                description=None
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


@flask.route("/api/auth/forgot", methods=["POST"])
@flask.route("/auth/forgot", methods=["POST"], subdomain="api")
@body_required({"email"})
def forgot_resource() -> Response:
    request_json: dict = request.get_json()
    try:
        data: dict = database["user"].find_one(
            filter=dict(email=request_json["email"])
        )
        if data is None:
            return response(
                status=HTTPStatus.BAD_REQUEST,
                error=dict(
                    type=None,
                    message=f"We couldn't find an account with that email.",
                    description=None
                )
            )
        token: str = url_safe_timed_serializer.dumps(
            request_json["email"], salt=flask.config["SALT_EMAIL"]
        )
        message: Message = Message(
            subject="QNode - Your new password is just a few clicks away",
            sender=flask.config["SENDER_EMAIL_ADDRESS"],
            recipients=[request_json["email"]]
        )
        message.html = f"""<div>     <span style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;">         Dear Sir/Madam,     </span>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     It seems like you forgot your password. If this is true, click the link below to reset your password.     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <b>         Reset my password     </b>     :     <a href="{flask.config['QNODE_WEB_ENDPOINT']}/reset?token={token}" target="_blank">         {flask.config["QNODE_WEB_ENDPOINT"]}/reset?token={token}     </a>     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <b>         Reset token key     </b>     : {token}     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     If you did not request a password reset, please ignore this email or reply to let us know. This password reset link is only valid for the next 60 minutes.     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     Yours,&nbsp;     <br> </div> <div style="color: rgb(34, 34, 34); font-family: Arial, Helvetica, sans-serif; font-size: small; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;">     The QNode team     <br> </div>"""
        mail.send(message=message)

        return response(
            status=HTTPStatus.OK,
            data=dict(
                email=data["email"],
                message="Password reset token is sent, check your email."
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


@flask.route("/api/auth/reset", methods=["POST"])
@flask.route("/auth/reset", methods=["POST"], subdomain="api")
@body_required({"token", "new_password"})
def reset_resource() -> Response:
    request_json: dict = request.get_json()
    try:
        email: str = url_safe_timed_serializer.loads(
            request_json["token"],
            salt=flask.config["SALT_EMAIL"],
            max_age=flask.config["TOKEN_EXPIRY_TIMESTAMP"]
        )
        data: UpdateResult = database["user"].update_one(
            filter=dict(email=email),
            update={
                "$set": dict(
                    password=generate_hash_by_pbkdf2(
                        data=request_json["new_password"],
                        salt_size=flask.config["SALT_SIZE"],
                        rounds=flask.config["ROUNDS"]
                    ),
                    last_modified=datetime.now()
                )
            }
        )
        return response(
            status=HTTPStatus.OK,
            data=dict(
                email=email,
                message="Your password is successfully rested.",
                acknowledged=data.acknowledged,
                matched_count=data.matched_count,
                modified_count=data.modified_count
            )
        )
    except itsdangerous.SignatureExpired as exception:
        return response(
            status=HTTPStatus.TOO_EARLY,
            error=dict(
                type=type(exception).__name__,
                message=f"This reset token is expired.",
                description=None
            )
        )
    except itsdangerous.BadSignature as exception:
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=type(exception).__name__,
                message=f"Bad reset token.",
                description=None
            )
        )


@flask.route("/api/auth/reset/<_id>", methods=["POST"])
@flask.route("/auth/reset/<_id>", methods=["POST"], subdomain="api")
@body_required({"old_password", "new_password"})
def reset_old_resource(_id: str) -> Response:
    request_json: dict = request.get_json()

    user: dict = database["user"].find_one(
        filter=dict(_id=ObjectId(_id))
    )

    if not verify_hash_by_pbkdf2(
        data=request_json["old_password"], hashed=user["password"],
        salt_size=flask.config["SALT_SIZE"], rounds=flask.config["ROUNDS"]
    ):
        return response(
            status=HTTPStatus.BAD_REQUEST,
            error=dict(
                type=None,
                message="Wrong old password.",
                description=None
            )
        )

    data: UpdateResult = database["user"].update_one(
        filter=dict(_id=ObjectId(_id)),
        update={
            "$set": dict(
                password=generate_hash_by_pbkdf2(
                    data=request_json["new_password"],
                    salt_size=flask.config["SALT_SIZE"],
                    rounds=flask.config["ROUNDS"]
                ),
                last_modified=datetime.now()
            )
        }
    )
    return response(
        status=HTTPStatus.OK,
        data=dict(
            email=user["email"],
            message="Your password is successfully rested.",
            acknowledged=data.acknowledged,
            matched_count=data.matched_count,
            modified_count=data.modified_count
        )
    )
