#!/usr/bin/env python3

from http import HTTPStatus
from datetime import datetime
from web3._utils.encoding import FriendlyJsonSerde
from base64 import b64decode
from web3.types import RPCResponse
from eth_utils import to_bytes
from eth_typing import URI
from typing import Optional

import simple_websocket
import hashlib
import json
import jwt

from .. import (
    flask, sock, database, Response, request
)
from .utils import (
    CustomHTTPProvider, CustomWebsocketProvider, add_statistics, json_normalization
)


@flask.route("/<key>", methods=["POST"], subdomain="testnet")
def testnet_http(key: str) -> Response:
    project: dict = database["project"].find_one(
        filter=dict(key=key)
    )
    if project is None:
        return Response(
            status=HTTPStatus.UNAUTHORIZED,
            headers=flask.config["HEADERS"],
            response=json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="invalid project key"
                ), id=1
            ))
        )
    if project["security"]["allowed_user_agents"]:
        if "User-Agent" not in request.headers:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="User-Agent is required"
                    ), id=1
                ))
            )
        is_allowed_user_agent: bool = False
        for allowed_user_agent in project["security"]["allowed_user_agents"]:
            if allowed_user_agent in request.headers.get("User-Agent"):
                is_allowed_user_agent = True
        if not is_allowed_user_agent:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="disallowed User-Agent value"
                    ), id=1
                ))
            )
    if project["security"]["allowed_origins"]:
        if "Access-Control-Allow-Origin" not in request.headers:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="Access-Control-Allow-Origin is required"
                    ), id=1
                ))
            )
        elif request.headers["Access-Control-Allow-Origin"] not in project["security"]["allowed_origins"]:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="disallowed Access-Control-Allow-Origin value"
                    ), id=1
                ))
            )
    if project["security"]["use_basic_auth"]:
        if "Authorization" not in request.headers:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="basic authentication is required"
                    ), id=1
                ))
            )
        authorization: bytes = request.headers["Authorization"].encode("utf-8")
        try:
            scheme, credential = authorization.split(b" ", 1)
            if scheme.decode("utf-8") != "Basic":
                return Response(
                    status=HTTPStatus.UNAUTHORIZED,
                    headers=flask.config["HEADERS"],
                    response=json.dumps(dict(
                        jsonrpc="2.0",
                        error=dict(
                            code=-32000,
                            message="wrong authentication scheme, it uses only 'Basic' scheme",
                        ), id=1
                    ))
                )
            username, password = b64decode(credential).split(b':', 1)
        except (ValueError, TypeError):
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="wrong basic authentication"
                    ), id=1
                ))
            )
        try:
            username = username.decode("utf-8")
            password = password.decode("utf-8")
        except UnicodeDecodeError:
            username = None
            password = None

        md5_hash = hashlib.md5()
        md5_hash.update(password.encode("utf-8"))
        password_md5_hash = md5_hash.hexdigest()
        basic_auth: Optional[dict] = None
        for temp_basic_auth in project["security"]["basic_auths"]:
            if temp_basic_auth["username"] == username:
                basic_auth = dict(
                    username=temp_basic_auth["username"], password=temp_basic_auth["password"]
                )
        if basic_auth is None:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message=f"can't find basic authentication with that username"
                    ), id=1
                ))
            )
        elif basic_auth["password"] != password_md5_hash:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message=f"wrong basic authentication password"
                    ), id=1
                ))
            )

    if project["security"]["use_jwt_auth"]:
        if "Authorization" not in request.headers:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="jwt authentication is required"
                    ), id=1
                ))
            )
        authorization: bytes = request.headers["Authorization"].encode("utf-8")
        try:
            scheme, credential = authorization.split(b" ", 1)
            if scheme.decode("utf-8") != "Bearer":
                return Response(
                    status=HTTPStatus.UNAUTHORIZED,
                    headers=flask.config["HEADERS"],
                    response=json.dumps(dict(
                        jsonrpc="2.0",
                        error=dict(
                            code=-32000,
                            message="wrong jwt authentication scheme, it uses only 'Bearer' scheme"
                        ), id=1
                    ))
                )
        except (ValueError, TypeError):
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="wrong jwt authentication"
                    ), id=1
                ))
            )

        try:
            unverified_header: dict = jwt.get_unverified_header(credential)
        except jwt.exceptions.DecodeError as exeption:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="invalid jwt authentication credential"
                    ), id=1
                ))
            )
        if (
            "alg" not in unverified_header or "typ" not in unverified_header or "kid" not in unverified_header
        ):
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="invalid jwt authentication credential, "
                                "'alg', 'typ', and 'kid' keys are required on header"
                    ), id=1
                ))
            )
        key: str = unverified_header["kid"]
        if unverified_header["alg"] not in ["RS256", "ES256"]:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="wrong jwt authentication algorithm, "
                                "currently we only accept 'RS256' and 'ES256' algorithms"
                    ), id=1
                ))
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
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="can't find jwt authentication with that credential"
                    ), id=1
                ))
            )
            
        try:
            jwt.decode(
                jwt=credential, key=(
                    f"-----BEGIN PUBLIC KEY-----\n{jwt_auth['public_key']}\n-----END PUBLIC KEY-----"
                ),
                audience=flask.config["SERVER_NAME"], algorithms=unverified_header["alg"]
            )
        except Exception as exception:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message=f"wrong jwt authentication credential, {str(exception).lower()}"
                    ), id=1
                ))
            )

    per_second_requests: int = project["security"]["per_second_requests"]
    if per_second_requests != 0:
        current_timestamp = datetime.utcnow().replace(microsecond=0)
        statistics_data: dict = database["statistics"].find_one(
            filter={
                "metadata.timestamp": current_timestamp,
                "metadata.user_id": project["user_id"],
                "metadata.project_id": project["_id"]
            }
        )
        if statistics_data and statistics_data["metadata"]["volume"] >= per_second_requests:
            return Response(
                status=HTTPStatus.TOO_MANY_REQUESTS,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32600,
                        message=f"too many requests, you can only '{per_second_requests}' requests per second on this project"
                    ), id=1
                ))
            )

    per_day_requests: int = project["security"]["per_day_requests"]
    if per_day_requests != 0:
        current_timestamp = datetime.utcnow().replace(microsecond=0)
        from_timestamp = current_timestamp.replace(hour=0, minute=0, second=0)
        statistics_data: list = list(database["statistics"].aggregate([
            {
                "$match": {
                    "metadata.user_id": {
                        "$eq": project["user_id"]
                    },
                    "metadata.project_id": {
                        "$eq": project["_id"]
                    },
                    "timestamp": {
                        "$gte": from_timestamp, "$lt": current_timestamp
                    }
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "valid": {
                        "$first": "$metadata.valid"
                    },
                    "invalid": {
                        "$first": "$metadata.invalid"
                    },
                    "volume": {
                        "$first": "$metadata.volume"
                    }
                }
            }
        ]))
        if statistics_data:
            total_volume: int = 0
            for statistic_data in statistics_data:
                total_volume += statistic_data["volume"]
            if total_volume >= per_day_requests:
                return Response(
                    status=HTTPStatus.TOO_MANY_REQUESTS,
                    headers=flask.config["HEADERS"],
                    response=json.dumps(dict(
                        jsonrpc="2.0",
                        error=dict(
                            code=-32600,
                            message=f"too many requests, you can only '{per_day_requests}' requests per day on this project"
                        ), id=1
                    ))
                )

    request_json, error_message, is_invalid = json_normalization(data=request.data)
    if is_invalid:
        add_statistics(
            project=project, network="testnet", request_method="invalid", is_valid=False
        )
        return Response(
            status=HTTPStatus.BAD_REQUEST,
            headers=flask.config["HEADERS"],
            response=json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32600,
                    message=error_message
                ), id=1
            ))
        )

    if project["security"]["allowed_methods"]:
        if request_json["method"] not in project["security"]["allowed_methods"]:
            return Response(
                status=HTTPStatus.UNAUTHORIZED,
                headers=flask.config["HEADERS"],
                response=json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message=f"this '{request_json['method']}' method is not allowed in this project key"
                    ), id=1
                ))
            )

    custom_http_provider: CustomHTTPProvider = CustomHTTPProvider(
        endpoint_uri=URI(f"http://{flask.config['HOST_JANUS_TESTNET']}:{flask.config['PORT_JANUS_TESTNET']}"),
        request_kwargs={
            "timeout": flask.config['TIMEOUT_JANUS_TESTNET']
        }
    )
    request_data_json_encoded = FriendlyJsonSerde().json_encode(request_json)
    request_data: bytes = to_bytes(
        text=request_data_json_encoded
    )
    data: RPCResponse = custom_http_provider.make_encode_request(
        request_data=request_data
    )
    add_statistics(
        project=project, network="testnet",
        request_method=(
            request_json["method"] if request_json["method"] in flask.config["AVAILABLE_METHODS"] else "invalid"
        ),
        is_valid=("error" not in data)
    )

    return Response(
        status=HTTPStatus.OK,
        headers=custom_http_provider.get_request_headers(),
        response=json.dumps(data)
    )


@sock.route("/<key>", subdomain="testnet")
def testnet_websocket(websocket: simple_websocket.ws.Server, key: str) -> None:
    project: dict = database["project"].find_one(
        filter=dict(key=key)
    )
    if project is None:
        return websocket.close(1000, json.dumps(dict(
            jsonrpc="2.0",
            error=dict(
                code=-32000,
                message="invalid project key"
            ), id=1
        )))
    if project["security"]["allowed_user_agents"]:
        if "User-Agent" not in request.headers:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="User-Agent is required"
                ), id=1
            )))
        is_allowed_user_agent: bool = False
        for allowed_user_agent in project["security"]["allowed_user_agents"]:
            if allowed_user_agent in request.headers.get("User-Agent"):
                is_allowed_user_agent = True
        if not is_allowed_user_agent:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="disallowed User-Agent value"
                ), id=1
            )))
    if project["security"]["allowed_origins"]:
        if "Access-Control-Allow-Origin" not in request.headers:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="Access-Control-Allow-Origin is required"
                ), id=1
            )))
        elif request.headers["Access-Control-Allow-Origin"] not in project["security"]["allowed_origins"]:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="disallowed Access-Control-Allow-Origin value"
                ), id=1
            )))
    if project["security"]["use_basic_auth"]:
        if "Authorization" not in request.headers:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="basic authentication is required"
                ), id=1
            )))
        authorization: bytes = request.headers["Authorization"].encode("utf-8")
        try:
            scheme, credential = authorization.split(b" ", 1)
            if scheme.decode("utf-8") != "Basic":
                return websocket.close(1000, json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="wrong authentication scheme, it uses only 'Basic' scheme",
                    ), id=1
                )))
            username, password = b64decode(credential).split(b':', 1)
        except (ValueError, TypeError):
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="wrong basic authentication"
                ), id=1
            )))
        try:
            username = username.decode("utf-8")
            password = password.decode("utf-8")
        except UnicodeDecodeError:
            username = None
            password = None

        md5_hash = hashlib.md5()
        md5_hash.update(password.encode("utf-8"))
        password_md5_hash = md5_hash.hexdigest()
        basic_auth: Optional[dict] = None
        for temp_basic_auth in project["security"]["basic_auths"]:
            if temp_basic_auth["username"] == username:
                basic_auth = dict(
                    username=temp_basic_auth["username"], password=temp_basic_auth["password"]
                )
        if basic_auth is None:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message=f"can't find basic authentication with that username"
                ), id=1
            )))
        elif basic_auth["password"] != password_md5_hash:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message=f"wrong basic authentication password"
                ), id=1
            )))

    if project["security"]["use_jwt_auth"]:
        if "Authorization" not in request.headers:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="jwt authentication is required"
                ), id=1
            )))
        authorization: bytes = request.headers["Authorization"].encode("utf-8")
        try:
            scheme, credential = authorization.split(b" ", 1)
            if scheme.decode("utf-8") != "Bearer":
                return websocket.close(1000, json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message="wrong jwt authentication scheme, it uses only 'Bearer' scheme"
                    ), id=1
                )))
        except (ValueError, TypeError):
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="wrong jwt authentication"
                ), id=1
            )))

        try:
            unverified_header: dict = jwt.get_unverified_header(credential)
        except jwt.exceptions.DecodeError as exeption:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="invalid jwt authentication credential"
                ), id=1
            )))
        if (
            "alg" not in unverified_header or "typ" not in unverified_header or "kid" not in unverified_header
        ):
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="invalid jwt authentication credential, 'alg', 'typ', and 'kid' keys are required on header"
                ), id=1
            )))
        key: str = unverified_header["kid"]
        if unverified_header["alg"] not in ["RS256", "ES256"]:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="wrong jwt authentication algorithm, currently we only accept 'RS256' and 'ES256' algorithms"
                ), id=1
            )))

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
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message="can't find jwt authentication with that credential"
                ), id=1
            )))

        try:
            jwt.decode(
                jwt=credential, key=(
                    f"-----BEGIN PUBLIC KEY-----\n{jwt_auth['public_key']}\n-----END PUBLIC KEY-----"
                ),
                audience=flask.config["SERVER_NAME"], algorithms=unverified_header["alg"]
            )
        except Exception as exception:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message=f"wrong jwt authentication credential, {str(exception).lower()}"
                ), id=1
            )))

    per_second_requests: int = project["security"]["per_second_requests"]
    if per_second_requests != 0:
        current_timestamp = datetime.utcnow().replace(microsecond=0)
        statistics_data: dict = database["statistics"].find_one(
            filter={
                "metadata.timestamp": current_timestamp,
                "metadata.user_id": project["user_id"],
                "metadata.project_id": project["_id"]
            }
        )
        if statistics_data and statistics_data["metadata"]["volume"] >= per_second_requests:
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32000,
                    message=f"too many requests, you can only '{per_second_requests}' requests per second on this project"
                ), id=1
            )))

    per_day_requests: int = project["security"]["per_day_requests"]
    if per_day_requests != 0:
        current_timestamp = datetime.utcnow().replace(microsecond=0)
        from_timestamp = current_timestamp.replace(hour=0, minute=0, second=0)
        statistics_data: list = list(database["statistics"].aggregate([
            {
                "$match": {
                    "metadata.user_id": {
                        "$eq": project["user_id"]
                    },
                    "metadata.project_id": {
                        "$eq": project["_id"]
                    },
                    "timestamp": {
                        "$gte": from_timestamp, "$lt": current_timestamp
                    }
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "valid": {
                        "$first": "$metadata.valid"
                    },
                    "invalid": {
                        "$first": "$metadata.invalid"
                    },
                    "volume": {
                        "$first": "$metadata.volume"
                    }
                }
            }
        ]))
        if statistics_data:
            total_volume: int = 0
            for statistic_data in statistics_data:
                total_volume += statistic_data["volume"]
            if total_volume >= per_day_requests:
                return websocket.close(1000, json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message=f"too many requests, you can only '{per_day_requests}' requests per day on this project"
                    ), id=1
                )))

    custom_websocket_provider: CustomWebsocketProvider = CustomWebsocketProvider(
        endpoint_uri=URI(f"ws://{flask.config['HOST_JANUS_TESTNET']}:{flask.config['PORT_JANUS_TESTNET']}")
    )

    while True:
        received_data: str = websocket.receive()
        request_json, error_message, is_invalid = json_normalization(
            data=received_data
        )
        if project["security"]["allowed_methods"]:
            if request_json["method"] not in project["security"]["allowed_methods"]:
                return websocket.close(1000, json.dumps(dict(
                    jsonrpc="2.0",
                    error=dict(
                        code=-32000,
                        message=f"this '{request_json['method']}' method is not allowed in this project key"
                    ), id=1
                )))

        if is_invalid:
            add_statistics(
                project=project, network="testnet", request_method="invalid", is_valid=False
            )
            return websocket.close(1000, json.dumps(dict(
                jsonrpc="2.0",
                error=dict(
                    code=-32600,
                    message=error_message
                ), id=1
            )))

        data: RPCResponse = custom_websocket_provider.make_encode_request(
            request_data=received_data
        )
        add_statistics(
            project=project, network="testnet",
            request_method=(
                request_json["method"] if request_json["method"] in flask.config["AVAILABLE_METHODS"] else "invalid"
            ),
            is_valid=("error" not in data)
        )
        websocket.send(json.dumps(data))
