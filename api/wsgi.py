#!/usr/bin/env python3

"""
QNODE API (BACK-END) PROJECT

GitHub Repository  : https://github.com/meherett/qnode-api
PostMan Collection : https://www.getpostman.com/collections/90360ec55b3d70d4d453
Google Cloud Compute Engine (GCE) Endpoint : http://api.qnode.meherett.com or http://qnode.meherett.com/api
LocalHost Endpoint : http://localhost:8080

Author : Meheret Tesfaye Batu <meherett@zoho.com> <https://meherett.github.com>
"""

from qnode import flask


if __name__ == '__main__':
    flask.run(
        host=flask.config["QNODE_HOST"], port=flask.config["QNODE_PORT"]
    )
