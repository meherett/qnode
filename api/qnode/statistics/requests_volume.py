#!/usr/bin/env python3

from http import HTTPStatus
from pymongo import DESCENDING
from bson.objectid import ObjectId
from datetime import (
    datetime, timedelta
)

import bson.errors

from ..authentication import is_authorized
from .. import (
    flask, database, response, Response, request
)


@flask.route("/api/statistics/requests-volume/<project_id_or_key>", methods=["GET"])
@flask.route("/statistics/requests-volume/<project_id_or_key>", methods=["GET"], subdomain="api")
@is_authorized(["admin", "user"])
def get_statistics_requests_volume(user: dict, project_id_or_key: str) -> Response:
    current_datetime: datetime = datetime.utcnow()
    last: str = request.args.get("last")
    if last == "15m":
        length: int = 16
        datetime_unit: str = "minute"
        current_datetime = current_datetime.replace(
            second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(minutes=15))
    elif last == "1h":
        length: int = 13
        datetime_unit: str = "minute"
        current_datetime = current_datetime.replace(
            minute=0, second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(hours=1))
    elif last == "24h":
        length: int = 25
        datetime_unit: str = "hour"
        current_datetime = current_datetime.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(hours=24))
    elif last == "7d":
        length: int = 8
        datetime_unit: str = "day"
        current_datetime = current_datetime.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(days=7))
    elif last == "30d":
        length: int = 16
        datetime_unit: str = "day"
        current_datetime = current_datetime.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(days=30))
    else:
        return response(
            status=HTTPStatus.BAD_REQUEST, error=dict(
                message="invalid last time, please choose only from 15m, 1h, 24h, 7d or 30d time options" if last else "last option is required"
            )
        )

    if project_id_or_key == "all-projects":
        _match: dict = {
            "metadata.user_id": {
                "$eq": user["_id"]
            },
            "timestamp": {
                "$gte": from_datetime, "$lt": current_datetime
            }
        }
    else:
        try:
            filter_by_id_or_key: dict = dict(_id=ObjectId(project_id_or_key))
        except bson.errors.InvalidId:
            filter_by_id_or_key: dict = dict(key=project_id_or_key)
        project: dict = database["project"].find_one(
            filter=filter_by_id_or_key
        )
        _match: dict = {
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

    statistics: list = list(database["statistics"].aggregate([
        {
            "$match": _match
        },
        {
            "$group": {
                "_id": "$_id",
                "timestamp": {
                    "$first": "$metadata.timestamp"
                },
                "network": {
                    "$first": "$metadata.network"
                },
                "method": {
                    "$first": "$metadata.method"
                },
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
        },
        {
            "$sort": {
                "timestamp": DESCENDING
            }
        }
    ]))

    data: dict = {}
    valid_volumes: list = []
    invalid_volumes: list = []
    volumes: list = []
    is_empty: bool = (
        False if statistics else True
    )

    total_valid_volume: int = 0
    total_invalid_volume: int = 0
    total_volume: int = 0

    if last == "15m":
        temp_datetime: datetime = from_datetime
        valid_volumes: list = [{"x": str(temp_datetime), "y": 0}]
        invalid_volumes: list = [{"x": str(temp_datetime), "y": 0}]
        volumes: list = [{"x": str(temp_datetime), "y": 0}]
        for _ in range(15):
            temp_datetime += timedelta(minutes=1)
            valid_volumes.append({"x": str(temp_datetime), "y": 0})
            invalid_volumes.append({"x": str(temp_datetime), "y": 0})
            volumes.append({"x": str(temp_datetime), "y": 0})

        for statistic in statistics:
            for _ in range(15):
                temp_x_datetime: datetime = datetime.fromisoformat(volumes[_]["x"])
                if temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=1)):
                    valid_volumes[_]["y"] += statistic["valid"]
                    invalid_volumes[_]["y"] += statistic["invalid"]
                    volumes[_]["y"] += statistic["volume"]
                    break

            total_valid_volume += statistic["valid"]
            total_invalid_volume += statistic["invalid"]
            total_volume += statistic["volume"]

    elif last == "1h":
        temp_datetime: datetime = from_datetime
        valid_volumes: list = [{"x": str(temp_datetime), "y": 0}]
        invalid_volumes: list = [{"x": str(temp_datetime), "y": 0}]
        volumes: list = [{"x": str(temp_datetime), "y": 0}]
        for _ in range(12):
            temp_datetime += timedelta(minutes=5)
            valid_volumes.append({"x": str(temp_datetime), "y": 0})
            invalid_volumes.append({"x": str(temp_datetime), "y": 0})
            volumes.append({"x": str(temp_datetime), "y": 0})

        for statistic in statistics:
            for _ in range(12):
                temp_x_datetime: datetime = datetime.fromisoformat(volumes[_]["x"])
                if temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=5)):
                    valid_volumes[_]["y"] += statistic["valid"]
                    invalid_volumes[_]["y"] += statistic["invalid"]
                    volumes[_]["y"] += statistic["volume"]
                    break

            total_valid_volume += statistic["valid"]
            total_invalid_volume += statistic["invalid"]
            total_volume += statistic["volume"]

    elif last == "24h":
        temp_datetime: datetime = from_datetime
        valid_volumes: list = [{"x": str(temp_datetime), "y": 0}]
        invalid_volumes: list = [{"x": str(temp_datetime), "y": 0}]
        volumes: list = [{"x": str(temp_datetime), "y": 0}]
        for _ in range(24):
            temp_datetime += timedelta(hours=1)
            valid_volumes.append({"x": str(temp_datetime), "y": 0})
            invalid_volumes.append({"x": str(temp_datetime), "y": 0})
            volumes.append({"x": str(temp_datetime), "y": 0})

        for statistic in statistics:
            for _ in range(24):
                temp_x_datetime: datetime = datetime.fromisoformat(volumes[_]["x"])
                if temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(hours=1)):
                    valid_volumes[_]["y"] += statistic["valid"]
                    invalid_volumes[_]["y"] += statistic["invalid"]
                    volumes[_]["y"] += statistic["volume"]
                    break

            total_valid_volume += statistic["valid"]
            total_invalid_volume += statistic["invalid"]
            total_volume += statistic["volume"]

    elif last == "7d":
        temp_datetime: datetime = from_datetime
        valid_volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
        invalid_volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
        volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
        for _ in range(7):
            temp_datetime += timedelta(days=1)
            valid_volumes.append({"x": str(temp_datetime.date()), "y": 0})
            invalid_volumes.append({"x": str(temp_datetime.date()), "y": 0})
            volumes.append({"x": str(temp_datetime.date()), "y": 0})

        for statistic in statistics:
            for _ in range(7):
                temp_x_datetime: datetime = datetime.fromisoformat(volumes[_]["x"])
                if temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=1)):
                    valid_volumes[_]["y"] += statistic["valid"]
                    invalid_volumes[_]["y"] += statistic["invalid"]
                    volumes[_]["y"] += statistic["volume"]
                    break

            total_valid_volume += statistic["valid"]
            total_invalid_volume += statistic["invalid"]
            total_volume += statistic["volume"]

    elif last == "30d":
        temp_datetime: datetime = from_datetime
        valid_volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
        invalid_volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
        volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
        for _ in range(15):
            temp_datetime += timedelta(days=2)
            valid_volumes.append({"x": str(temp_datetime.date()), "y": 0})
            invalid_volumes.append({"x": str(temp_datetime.date()), "y": 0})
            volumes.append({"x": str(temp_datetime.date()), "y": 0})

        for statistic in statistics:
            for _ in range(15):
                temp_x_datetime: datetime = datetime.fromisoformat(volumes[_]["x"])
                if temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=2)):
                    valid_volumes[_]["y"] += statistic["valid"]
                    invalid_volumes[_]["y"] += statistic["invalid"]
                    volumes[_]["y"] += statistic["volume"]
                    break

            total_valid_volume += statistic["valid"]
            total_invalid_volume += statistic["invalid"]
            total_volume += statistic["volume"]

    data.setdefault("valid_volumes", valid_volumes)
    data.setdefault("invalid_volumes", invalid_volumes)
    data.setdefault("volumes", volumes)
    data.setdefault("is_empty", is_empty)
    data.setdefault("current_datetime", str(current_datetime))
    data.setdefault("from_datetime", str(from_datetime))
    data.setdefault("datetime_unit", datetime_unit)
    data.setdefault("length", length)
    data.setdefault("total_valid_volume", total_valid_volume)
    data.setdefault("total_invalid_volume", total_invalid_volume)
    data.setdefault("total_volume", total_volume)

    return response(
        status=HTTPStatus.OK, data=data
    )
