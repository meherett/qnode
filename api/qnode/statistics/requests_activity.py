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


@flask.route("/api/statistics/requests-activity/<project_id_or_key>", methods=["GET"])
@flask.route("/statistics/requests-activity/<project_id_or_key>", methods=["GET"], subdomain="api")
@is_authorized(["admin", "user"])
def get_statistics_requests_activity(user: dict, project_id_or_key: str) -> Response:
    current_datetime: datetime = datetime.utcnow()
    last: str = request.args.get("last")
    if last == "15m":
        datetime_unit: str = "minute"
        current_datetime = current_datetime.replace(
            second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(minutes=15))
    elif last == "1h":
        datetime_unit: str = "minute"
        current_datetime = current_datetime.replace(
            minute=0, second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(hours=1))
    elif last == "24h":
        datetime_unit: str = "hour"
        current_datetime = current_datetime.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(hours=24))
    elif last == "7d":
        datetime_unit: str = "day"
        current_datetime = current_datetime.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        from_datetime: datetime = (current_datetime - timedelta(days=7))
    elif last == "30d":
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
    requests_activity: dict = {}
    is_empty: bool = (
        False if statistics else True
    )

    if last == "15m":
        temp_datetime: datetime = from_datetime
        datetimes_volume: list = [temp_datetime]
        for _ in range(15):
            temp_datetime += timedelta(minutes=1)
            datetimes_volume.append(temp_datetime)

        for statistic in statistics:
            for method in statistic["method"].keys():
                for _ in range(15):
                    datetime_volume: datetime = datetimes_volume[_]
                    if (datetime_volume <= statistic["timestamp"] < (datetime_volume + timedelta(minutes=1))):
                        unique_key: str = (str(datetime_volume) + method + statistic["network"])
                        if unique_key in requests_activity.keys():
                            requests_activity[unique_key]["valid"] += statistic["method"][method]["valid"]
                            requests_activity[unique_key]["invalid"] += statistic["method"][method]["invalid"]
                            requests_activity[unique_key]["volume"] += statistic["method"][method]["volume"]
                        else:
                            requests_activity.setdefault(unique_key, {
                                "timestamp": datetime_volume,
                                "method": method,
                                "network": statistic["network"],
                                "valid": statistic["method"][method]["valid"],
                                "invalid": statistic["method"][method]["invalid"],
                                "volume": statistic["method"][method]["volume"]
                            })
                        break

    elif last == "1h":
        temp_datetime: datetime = from_datetime
        datetimes_volume: list = [temp_datetime]
        for _ in range(12):
            temp_datetime += timedelta(minutes=5)
            datetimes_volume.append(temp_datetime)

        for statistic in statistics:
            for method in statistic["method"].keys():
                for _ in range(12):
                    datetime_volume: datetime = datetimes_volume[_]
                    if (datetime_volume <= statistic["timestamp"] < (datetime_volume + timedelta(minutes=5))):
                        unique_key: str = (str(datetime_volume) + method + statistic["network"])
                        if unique_key in requests_activity.keys():
                            requests_activity[unique_key]["valid"] += statistic["method"][method]["valid"]
                            requests_activity[unique_key]["invalid"] += statistic["method"][method]["invalid"]
                            requests_activity[unique_key]["volume"] += statistic["method"][method]["volume"]
                        else:
                            requests_activity.setdefault(unique_key, {
                                "timestamp": datetime_volume,
                                "method": method,
                                "network": statistic["network"],
                                "valid": statistic["method"][method]["valid"],
                                "invalid": statistic["method"][method]["invalid"],
                                "volume": statistic["method"][method]["volume"]
                            })
                        break

    elif last == "24h":
        temp_datetime: datetime = from_datetime
        datetimes_volume: list = [temp_datetime]
        for _ in range(24):
            temp_datetime += timedelta(hours=1)
            datetimes_volume.append(temp_datetime)

        for statistic in statistics:
            for method in statistic["method"].keys():
                for _ in range(24):
                    datetime_volume: datetime = datetimes_volume[_]
                    if (datetime_volume <= statistic["timestamp"] < (datetime_volume + timedelta(hours=1))):
                        unique_key: str = (str(datetime_volume) + method + statistic["network"])
                        if unique_key in requests_activity.keys():
                            requests_activity[unique_key]["valid"] += statistic["method"][method]["valid"]
                            requests_activity[unique_key]["invalid"] += statistic["method"][method]["invalid"]
                            requests_activity[unique_key]["volume"] += statistic["method"][method]["volume"]
                        else:
                            requests_activity.setdefault(unique_key, {
                                "timestamp": datetime_volume,
                                "method": method,
                                "network": statistic["network"],
                                "valid": statistic["method"][method]["valid"],
                                "invalid": statistic["method"][method]["invalid"],
                                "volume": statistic["method"][method]["volume"]
                            })
                        break

    elif last == "7d":
        temp_datetime: datetime = from_datetime
        datetimes_volume: list = [temp_datetime]
        for _ in range(7):
            temp_datetime += timedelta(days=1)
            datetimes_volume.append(temp_datetime)

        for statistic in statistics:
            for method in statistic["method"].keys():
                for _ in range(7):
                    datetime_volume: datetime = datetimes_volume[_]
                    if (datetime_volume <= statistic["timestamp"] < (datetime_volume + timedelta(days=1))):
                        unique_key: str = (str(datetime_volume) + method + statistic["network"])
                        if unique_key in requests_activity.keys():
                            requests_activity[unique_key]["valid"] += statistic["method"][method]["valid"]
                            requests_activity[unique_key]["invalid"] += statistic["method"][method]["invalid"]
                            requests_activity[unique_key]["volume"] += statistic["method"][method]["volume"]
                        else:
                            requests_activity.setdefault(unique_key, {
                                "timestamp": datetime_volume,
                                "method": method,
                                "network": statistic["network"],
                                "valid": statistic["method"][method]["valid"],
                                "invalid": statistic["method"][method]["invalid"],
                                "volume": statistic["method"][method]["volume"]
                            })
                        break

    elif last == "30d":
        temp_datetime: datetime = from_datetime
        datetimes_volume: list = [temp_datetime]
        for _ in range(15):
            temp_datetime += timedelta(days=2)
            datetimes_volume.append(temp_datetime)

        for statistic in statistics:
            for method in statistic["method"].keys():
                for _ in range(15):
                    datetime_volume: datetime = datetimes_volume[_]
                    if (datetime_volume <= statistic["timestamp"] < (datetime_volume + timedelta(days=2))):
                        unique_key: str = (str(datetime_volume) + method + statistic["network"])
                        if unique_key in requests_activity.keys():
                            requests_activity[unique_key]["valid"] += statistic["method"][method]["valid"]
                            requests_activity[unique_key]["invalid"] += statistic["method"][method]["invalid"]
                            requests_activity[unique_key]["volume"] += statistic["method"][method]["volume"]
                        else:
                            requests_activity.setdefault(unique_key, {
                                "timestamp": datetime_volume,
                                "method": method,
                                "network": statistic["network"],
                                "valid": statistic["method"][method]["valid"],
                                "invalid": statistic["method"][method]["invalid"],
                                "volume": statistic["method"][method]["volume"]
                            })
                        break

    requests_activity_list: list = [requests_activity[key] for key in requests_activity.keys()]
    data.setdefault("requests_activity", requests_activity_list)
    data.setdefault("total_requests", len(requests_activity_list))
    data.setdefault("is_empty", is_empty)
    data.setdefault("datetime_unit", datetime_unit)

    return response(
        status=HTTPStatus.OK, data=data
    )
