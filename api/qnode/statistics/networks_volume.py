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


@flask.route("/api/statistics/networks-volume/<project_id_or_key>", methods=["GET"])
@flask.route("/statistics/networks-volume/<project_id_or_key>", methods=["GET"], subdomain="api")
@is_authorized(["admin", "user"])
def get_statistics_networks_volume(user: dict, project_id_or_key: str) -> Response:
    current_datetime: datetime = datetime.utcnow()
    last: str = request.args.get("last")
    method: str = request.args.get("method")
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
    networks_volume: dict = {}
    networks: dict = {}
    is_empty: bool = (
        False if statistics else True
    )

    if last == "15m":
        for statistic in statistics:
            network: str = statistic["network"]
            if method == "all-methods":
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["valid"]
                    networks[network]["total_invalid_volume"] += statistic["invalid"]
                    networks[network]["total_volume"] += statistic["volume"]
                else:
                    networks.setdefault(network, {
                            "total_valid_volume": statistic["valid"],
                            "total_invalid_volume": statistic["invalid"],
                            "total_volume": statistic["volume"]
                        }
                    )
            elif method in statistic["method"].keys():
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["method"][method]["valid"]
                    networks[network]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    networks[network]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    networks.setdefault(network, {
                            "total_valid_volume": statistic["method"][method]["valid"],
                            "total_invalid_volume": statistic["method"][method]["invalid"],
                            "total_volume": statistic["method"][method]["volume"]
                        }
                    )

        for network in networks.keys():
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(15):
                temp_datetime += timedelta(minutes=1)
                volumes.append({"x": str(temp_datetime), "y": 0})
            networks_volume.setdefault(network, volumes)

        for network in networks_volume.keys():
            for statistic in statistics:
                if network != statistic["network"]:
                    continue
                elif method == "all-methods":
                    for _ in range(15):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=1))):
                            networks_volume[network][_]["y"] += statistic["volume"]
                            break
                elif method in statistic["method"].keys():
                    for _ in range(15):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=1))):
                            networks_volume[network][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "1h":
        for statistic in statistics:
            network: str = statistic["network"]
            if method == "all-methods":
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["valid"]
                    networks[network]["total_invalid_volume"] += statistic["invalid"]
                    networks[network]["total_volume"] += statistic["volume"]
                else:
                    networks.setdefault(network, {
                        "total_valid_volume": statistic["valid"],
                        "total_invalid_volume": statistic["invalid"],
                        "total_volume": statistic["volume"]
                    }
                                        )
            elif method in statistic["method"].keys():
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["method"][method]["valid"]
                    networks[network]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    networks[network]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    networks.setdefault(network, {
                            "total_valid_volume": statistic["method"][method]["valid"],
                            "total_invalid_volume": statistic["method"][method]["invalid"],
                            "total_volume": statistic["method"][method]["volume"]
                        }
                    )

        for network in networks.keys():
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(12):
                temp_datetime += timedelta(minutes=5)
                volumes.append({"x": str(temp_datetime), "y": 0})
            networks_volume.setdefault(network, volumes)

        for network in networks_volume.keys():
            for statistic in statistics:
                if network != statistic["network"]:
                    continue
                elif method == "all-methods":
                    for _ in range(12):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=5))):
                            networks_volume[network][_]["y"] += statistic["volume"]
                            break
                elif method in statistic["method"].keys():
                    for _ in range(12):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(minutes=5))):
                            networks_volume[network][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "24h":
        for statistic in statistics:
            network: str = statistic["network"]
            if method == "all-methods":
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["valid"]
                    networks[network]["total_invalid_volume"] += statistic["invalid"]
                    networks[network]["total_volume"] += statistic["volume"]
                else:
                    networks.setdefault(network, {
                        "total_valid_volume": statistic["valid"],
                        "total_invalid_volume": statistic["invalid"],
                        "total_volume": statistic["volume"]
                    }
                                        )
            elif method in statistic["method"].keys():
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["method"][method]["valid"]
                    networks[network]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    networks[network]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    networks.setdefault(network, {
                            "total_valid_volume": statistic["method"][method]["valid"],
                            "total_invalid_volume": statistic["method"][method]["invalid"],
                            "total_volume": statistic["method"][method]["volume"]
                        }
                    )

        for network in networks.keys():
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(24):
                temp_datetime += timedelta(hours=1)
                volumes.append({"x": str(temp_datetime), "y": 0})
            networks_volume.setdefault(network, volumes)

        for network in networks_volume.keys():
            for statistic in statistics:
                if network != statistic["network"]:
                    continue
                elif method == "all-methods":
                    for _ in range(24):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(hours=1))):
                            networks_volume[network][_]["y"] += statistic["volume"]
                            break
                elif method in statistic["method"].keys():
                    for _ in range(24):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(hours=1))):
                            networks_volume[network][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "7d":
        for statistic in statistics:
            network: str = statistic["network"]
            if method == "all-methods":
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["valid"]
                    networks[network]["total_invalid_volume"] += statistic["invalid"]
                    networks[network]["total_volume"] += statistic["volume"]
                else:
                    networks.setdefault(network, {
                        "total_valid_volume": statistic["valid"],
                        "total_invalid_volume": statistic["invalid"],
                        "total_volume": statistic["volume"]
                    }
                                        )
            elif method in statistic["method"].keys():
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["method"][method]["valid"]
                    networks[network]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    networks[network]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    networks.setdefault(network, {
                            "total_valid_volume": statistic["method"][method]["valid"],
                            "total_invalid_volume": statistic["method"][method]["invalid"],
                            "total_volume": statistic["method"][method]["volume"]
                        }
                    )

        for network in networks.keys():
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(7):
                temp_datetime += timedelta(days=1)
                volumes.append({"x": str(temp_datetime.date()), "y": 0})
            networks_volume.setdefault(network, volumes)

        for network in networks_volume.keys():
            for statistic in statistics:
                if network != statistic["network"]:
                    continue
                elif method == "all-methods":
                    for _ in range(7):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=1))):
                            networks_volume[network][_]["y"] += statistic["volume"]
                            break
                elif method in statistic["method"].keys():
                    for _ in range(7):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=1))):
                            networks_volume[network][_]["y"] += statistic["method"][method]["volume"]
                            break

    elif last == "30d":
        for statistic in statistics:
            network: str = statistic["network"]
            if method == "all-methods":
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["valid"]
                    networks[network]["total_invalid_volume"] += statistic["invalid"]
                    networks[network]["total_volume"] += statistic["volume"]
                else:
                    networks.setdefault(network, {
                        "total_valid_volume": statistic["valid"],
                        "total_invalid_volume": statistic["invalid"],
                        "total_volume": statistic["volume"]
                    }
                                        )
            elif method in statistic["method"].keys():
                if network in networks.keys():
                    networks[network]["total_valid_volume"] += statistic["method"][method]["valid"]
                    networks[network]["total_invalid_volume"] += statistic["method"][method]["invalid"]
                    networks[network]["total_volume"] += statistic["method"][method]["volume"]
                else:
                    networks.setdefault(network, {
                            "total_valid_volume": statistic["method"][method]["valid"],
                            "total_invalid_volume": statistic["method"][method]["invalid"],
                            "total_volume": statistic["method"][method]["volume"]
                        }
                    )

        for network in networks.keys():
            temp_datetime: datetime = from_datetime
            volumes: list = [{"x": str(temp_datetime), "y": 0}]
            for _ in range(15):
                temp_datetime += timedelta(days=2)
                volumes.append({"x": str(temp_datetime.date()), "y": 0})
            networks_volume.setdefault(network, volumes)

        for network in networks_volume.keys():
            for statistic in statistics:
                if network != statistic["network"]:
                    continue
                elif method == "all-methods":
                    for _ in range(15):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=2))):
                            networks_volume[network][_]["y"] += statistic["volume"]
                            break
                elif method in statistic["method"].keys():
                    for _ in range(15):
                        temp_x_datetime: datetime = datetime.fromisoformat(networks_volume[network][_]["x"])
                        if (temp_x_datetime <= statistic["timestamp"] < (temp_x_datetime + timedelta(days=2))):
                            networks_volume[network][_]["y"] += statistic["method"][method]["volume"]
                            break

    data.setdefault("networks_volume", networks_volume)
    data.setdefault("networks", networks)
    data.setdefault("is_empty", is_empty)
    data.setdefault("current_datetime", str(current_datetime))
    data.setdefault("from_datetime", str(from_datetime))
    data.setdefault("datetime_unit", datetime_unit)
    data.setdefault("length", length)

    return response(
        status=HTTPStatus.OK, data=data
    )
