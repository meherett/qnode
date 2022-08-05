#!/usr/bin/env python3

from web3.providers import (
    HTTPProvider, WebsocketProvider
)
from web3._utils.request import make_post_request
from web3.types import RPCResponse
from typing import (
    Any, Iterable, Optional, Union, Tuple
)
from bson.objectid import ObjectId
from eth_utils import to_dict
from eth_typing import URI
from datetime import datetime

import asyncio
import json

from .. import database

DEFAULT_WEBSOCKET_TIMEOUT: int = 10


class CustomHTTPProvider(HTTPProvider):

    def __init__(
            self, endpoint_uri: Optional[Union[URI, str]] = None,
            request_kwargs: Optional[Any] = None,
            session: Optional[Any] = None
    ) -> None:
        super().__init__(
            endpoint_uri=endpoint_uri,
            request_kwargs=request_kwargs,
            session=session
        )

    @to_dict
    def get_request_kwargs(self) -> Iterable[Tuple[str, Any]]:
        if 'headers' not in self._request_kwargs:
            yield 'headers', self.get_request_headers()
        for key, value in self._request_kwargs.items():
            yield key, value

    def make_encode_request(self, request_data: bytes) -> RPCResponse:
        raw_response = make_post_request(
            self.endpoint_uri,
            request_data,
            **self.get_request_kwargs()
        )
        decoded_response = self.decode_rpc_response(raw_response)
        return decoded_response


class CustomWebsocketProvider(WebsocketProvider):

    def __init__(
            self, endpoint_uri: Optional[Union[URI, str]] = None,
            websocket_kwargs: Optional[Any] = None,
            websocket_timeout: int = DEFAULT_WEBSOCKET_TIMEOUT
    ) -> None:
        super().__init__(
            endpoint_uri=endpoint_uri,
            websocket_kwargs=websocket_kwargs,
            websocket_timeout=websocket_timeout
        )

    async def coro_make_request(self, request_data: str) -> RPCResponse:
        async with self.conn as conn:
            await asyncio.wait_for(
                conn.send(request_data),
                timeout=self.websocket_timeout
            )
            return json.loads(
                await asyncio.wait_for(
                    conn.recv(),
                    timeout=self.websocket_timeout
                )
            )

    def make_encode_request(self, request_data: str) -> RPCResponse:
        future = asyncio.run_coroutine_threadsafe(
            self.coro_make_request(request_data),
            WebsocketProvider._loop
        )
        return future.result()


def json_normalization(data: Union[str, bytes]) -> Tuple[dict, str, bool]:
    if isinstance(data, bytes):
        data: str = data.decode("utf-8")
    try:
        request_json: dict = json.loads(data)
        for key in ["method", "id"]:
            if key not in request_json.keys():
                return {}, "invalid json request", True
        return request_json, "", False
    except json.decoder.JSONDecodeError:
        return {}, "invalid json request", True

    
def add_statistics(project: dict, network: str, request_method: str, is_valid: bool):
    current_timestamp = datetime.utcnow().replace(second=0, microsecond=0)
    statistics_data: dict = database["statistics"].find_one(
        filter={
            "metadata.network": network,
            "metadata.timestamp": current_timestamp,
            "metadata.user_id": project["user_id"],
            "metadata.project_id": project["_id"],
        }
    )
    if statistics_data and (request_method in statistics_data["metadata"]["method"].keys()):
        database["statistics"].update_many(
            filter={
                "metadata.network": network,
                "metadata.timestamp": current_timestamp,
                "metadata.user_id": project["user_id"],
                "metadata.project_id": project["_id"]
            },
            update={
                "$inc": {
                    f"metadata.method.{request_method}.valid": (1 if is_valid else 0),
                    f"metadata.method.{request_method}.invalid": (0 if is_valid else 1),
                    f"metadata.method.{request_method}.volume": 1,
                    "metadata.valid": (1 if is_valid else 0),
                    "metadata.invalid": (0 if is_valid else 1),
                    "metadata.volume": 1
                }
            }
        )
    elif statistics_data and (request_method not in statistics_data["metadata"]["method"].keys()):
        database["statistics"].update_many(
            filter={
                "metadata.network": network,
                "metadata.timestamp": current_timestamp,
                "metadata.user_id": project["user_id"],
                "metadata.project_id": project["_id"]
            },
            update={
                "$set": {
                    f"metadata.method.{request_method}.valid": (1 if is_valid else 0),
                    f"metadata.method.{request_method}.invalid": (0 if is_valid else 1),
                    f"metadata.method.{request_method}.volume": 1,
                },
                "$inc": {
                    "metadata.valid": (1 if is_valid else 0),
                    "metadata.invalid": (0 if is_valid else 1),
                    "metadata.volume": 1
                }
            }
        )
    else:
        database["statistics"].insert_one(
            bypass_document_validation=False, document=dict(
                _id=ObjectId(),
                timestamp=current_timestamp,
                metadata=dict(
                    network=network,
                    timestamp=current_timestamp,
                    method={
                        request_method: {
                            "valid": (1 if is_valid else 0),
                            "invalid": (0 if is_valid else 1),
                            "volume": 1
                        }
                    },
                    user_id=project["user_id"],
                    project_id=project["_id"],
                    valid=(1 if is_valid else 0),
                    invalid=(0 if is_valid else 1),
                    volume=1
                )
            )
        )
    if project["status"] == "inactive":
        database["project"].update_one(
            filter=dict(_id=ObjectId(project["_id"])), update={
                "$set": {
                    "status": "active"
                }
            }
        )
