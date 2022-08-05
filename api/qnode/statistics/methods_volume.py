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


@flask.route("/api/statistics/methods-volume/<project_id_or_key>", methods=["GET"])
@flask.route("/statistics/methods-volume/<project_id_or_key>", methods=["GET"], subdomain="api")
@is_authorized(["admin", "user"])
def get_statistics_methods_volume(user: dict, project_id_or_key: str) -> Response:
    current_datetime: datetime = datetime.utcnow()
    last: str = request.args.get("last")
    top: int = int(request.args.get("top"))
    network: str = request.args.get("network")
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

    if network == "all-networks":
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
    else:
        if project_id_or_key == "all-projects":
            _match: dict = {
                "metadata.user_id": {
                    "$eq": user["_id"]
                },
                "metadata.network": {
                    "$eq": network
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
                "metadata.network": {
                    "$eq": network
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
    methods_volume: dict = {}
    unsorted_methods: dict = {}
    methods: dict = {}
    is_empty: bool = (
        False if statistics else True
    )

    if last == "15m":
        for statistic in statistics:
            for method in statistic["method"].keys():
                if method in unsorted_methods.keys():
                    unsorted_methods[method]["total_valid_volume"] += statistic["method"][method]["valid"]
                    unsorted_methods[method]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    unsorted_methods[method]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    unsorted_methods.setdefault(method, {
                            "total_valid_volume": statistic["method"][method]["valid"],
                            "total_invalid_volume": statistic["method"][method]["invalid"],
                            "total_volume": statistic["method"][method]["volume"],
                        }
                    )

        sorted_methods = sorted(unsorted_methods.items(), key=lambda t: t[1]["total_volume"], reverse=True)[:top]
        methods: dict = {sorted_methods[index][0]: sorted_methods[index][1] for index in range(len(sorted_methods))}
        methods_volume: dict = {}

        for index in range(len(sorted_methods)):
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(15):
                temp_datetime += timedelta(minutes=1)
                volumes.append({"x": str(temp_datetime), "y": 0})
            methods_volume.setdefault(sorted_methods[index][0], volumes)

        for statistic in statistics:
            for method in methods_volume.keys():
                if method in statistic["method"].keys():
                    for _ in range(15):
                        temp_x_datetime: datetime = datetime.fromisoformat(methods_volume[method][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=1))):
                            methods_volume[method][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "1h":
        for statistic in statistics:
            for method in statistic["method"].keys():
                if method in unsorted_methods.keys():
                    unsorted_methods[method]["total_valid_volume"] += statistic["method"][method]["valid"]
                    unsorted_methods[method]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    unsorted_methods[method]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    unsorted_methods.setdefault(method, {
                        "total_valid_volume": statistic["method"][method]["valid"],
                        "total_invalid_volume": statistic["method"][method]["invalid"],
                        "total_volume": statistic["method"][method]["volume"],
                    }
                                       )

        sorted_methods = sorted(unsorted_methods.items(), key=lambda t: t[1]["total_volume"], reverse=True)[:top]
        methods: dict = {sorted_methods[index][0]: sorted_methods[index][1] for index in range(len(sorted_methods))}
        methods_volume: dict = {}

        for index in range(len(sorted_methods)):
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(12):
                temp_datetime += timedelta(minutes=5)
                volumes.append({"x": str(temp_datetime), "y": 0})
            methods_volume.setdefault(sorted_methods[index][0], volumes)

        for statistic in statistics:
            for method in methods_volume.keys():
                if method in statistic["method"].keys():
                    for _ in range(12):
                        temp_x_datetime: datetime = datetime.fromisoformat(methods_volume[method][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=5))):
                            methods_volume[method][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "24h":
        for statistic in statistics:
            for method in statistic["method"].keys():
                if method in unsorted_methods.keys():
                    unsorted_methods[method]["total_valid_volume"] += statistic["method"][method]["valid"]
                    unsorted_methods[method]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    unsorted_methods[method]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    unsorted_methods.setdefault(method, {
                        "total_valid_volume": statistic["method"][method]["valid"],
                        "total_invalid_volume": statistic["method"][method]["invalid"],
                        "total_volume": statistic["method"][method]["volume"],
                    }
                                       )

        sorted_methods = sorted(unsorted_methods.items(), key=lambda t: t[1]["total_volume"], reverse=True)[:top]
        methods: dict = {sorted_methods[index][0]: sorted_methods[index][1] for index in range(len(sorted_methods))}
        methods_volume: dict = {}

        for index in range(len(sorted_methods)):
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(24):
                temp_datetime += timedelta(hours=1)
                volumes.append({"x": str(temp_datetime), "y": 0})
            methods_volume.setdefault(sorted_methods[index][0], volumes)

        for statistic in statistics:
            for method in methods_volume.keys():
                if method in statistic["method"].keys():
                    for _ in range(24):
                        temp_x_datetime: datetime = datetime.fromisoformat(methods_volume[method][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(hours=1))):
                            methods_volume[method][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "7d":
        for statistic in statistics:
            for method in statistic["method"].keys():
                if method in unsorted_methods.keys():
                    unsorted_methods[method]["total_valid_volume"] += statistic["method"][method]["valid"]
                    unsorted_methods[method]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    unsorted_methods[method]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    unsorted_methods.setdefault(method, {
                        "total_valid_volume": statistic["method"][method]["valid"],
                        "total_invalid_volume": statistic["method"][method]["invalid"],
                        "total_volume": statistic["method"][method]["volume"],
                    }
                                       )

        sorted_methods = sorted(unsorted_methods.items(), key=lambda t: t[1]["total_volume"], reverse=True)[:top]
        methods: dict = {sorted_methods[index][0]: sorted_methods[index][1] for index in range(len(sorted_methods))}
        methods_volume: dict = {}

        for index in range(len(sorted_methods)):
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
            for _ in range(7):
                temp_datetime += timedelta(days=1)
                volumes.append({"x": str(temp_datetime.date()), "y": 0})
            methods_volume.setdefault(sorted_methods[index][0], volumes)

        for statistic in statistics:
            for method in methods_volume.keys():
                if method in statistic["method"].keys():
                    for _ in range(7):
                        temp_x_datetime: datetime = datetime.fromisoformat(methods_volume[method][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=1))):
                            methods_volume[method][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "30d":
        for statistic in statistics:
            for method in statistic["method"].keys():
                if method in unsorted_methods.keys():
                    unsorted_methods[method]["total_valid_volume"] += statistic["method"][method]["valid"]
                    unsorted_methods[method]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    unsorted_methods[method]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    unsorted_methods.setdefault(method, {
                        "total_valid_volume": statistic["method"][method]["valid"],
                        "total_invalid_volume": statistic["method"][method]["invalid"],
                        "total_volume": statistic["method"][method]["volume"],
                    }
                                       )

        sorted_methods = sorted(unsorted_methods.items(), key=lambda t: t[1]["total_volume"], reverse=True)[:top]
        methods: dict = {sorted_methods[index][0]: sorted_methods[index][1] for index in range(len(sorted_methods))}
        methods_volume: dict = {}

        for index in range(len(sorted_methods)):
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime.date()), "y": 0}]
            for _ in range(15):
                temp_datetime += timedelta(days=2)
                volumes.append({"x": str(temp_datetime.date()), "y": 0})
            methods_volume.setdefault(sorted_methods[index][0], volumes)

        for statistic in statistics:
            for method in methods_volume.keys():
                if method in statistic["method"].keys():
                    for _ in range(15):
                        temp_x_datetime: datetime = datetime.fromisoformat(methods_volume[method][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=2))):
                            methods_volume[method][_]["y"] += statistic["method"][method]["volume"]
                            break

    data.setdefault("methods_volume", methods_volume)
    data.setdefault("methods", methods)
    data.setdefault("is_empty", is_empty)
    data.setdefault("current_datetime", str(current_datetime))
    data.setdefault("from_datetime", str(from_datetime))
    data.setdefault("datetime_unit", datetime_unit)
    data.setdefault("length", length)

    return response(
        status=HTTPStatus.OK, data=data
    )
