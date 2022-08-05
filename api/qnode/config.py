#!/usr/bin/env python3

from json import loads

import sys
import os


class Config(object):

    ISSUER_NAME: str = os.getenv("ISSUER_NAME", "QNode")
    QNODE_HOST: str = os.getenv("QNODE_HOST", "0.0.0.0")
    QNODE_PORT: int = os.getenv("QNODE_PORT", 8080)

    SERVER_NAME: str = os.getenv("SERVER_NAME", "qnode.meherett.com")

    PROPAGATE_EXCEPTIONS: bool = os.getenv("PROPAGATE_EXCEPTIONS", True)
    JSON_SORT_KEYS: bool = os.getenv("JSON_SORT_KEYS", False)

    SALT_EMAIL: str = os.getenv("SALT_EMAIL", "qnode-email-confirmation")
    SALT_SIZE: int = os.getenv("SALT_SIZE", 16)
    ROUNDS: int = os.getenv("ROUNDS", 31_000)
    PASSPHRASE_KEY: str = os.getenv("PASSPHRASE_KEY", "0QlA3XOcipJd0uGqGELlTXS8Zc4-xVRnvyRd0gXYnmdL7NQfD5Ht4eevKg8QWfWK")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "0f3458782530d5f38ea77a2c71f4b5cf")
    ENDTIME: int = os.getenv("ENDTIME", 10)

    HEADERS: dict = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Content-Type": "application/json",
    }
    KEY_LENGTH: int = os.getenv("KEY_LENGTH", 37)
    JWT_KEY_LENGTH: int = os.getenv("JWT_KEY_LENGTH", 32)
    TOKEN_EXPIRY_TIMESTAMP: int = os.getenv("TOKEN_EXPIRY_TIMESTAMP", 3600)  # 1 hour
    TOKEN_2FA_EXPIRY_TIMESTAMP: int = os.getenv("TOKEN_2FA_EXPIRY_TIMESTAMP", 600)  # 10 minutes

    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "meheret.tesfaye.batu@gmail.com")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "rugccwpihfaoebwp")
    MAIL_PORT: int = os.getenv("MAIL_PORT", 465)
    MAIL_USE_SSL: bool = os.getenv("MAIL_USE_SSL", True)
    MAIL_USE_TLS: bool = os.getenv("MAIL_USE_TLS", False)

    SENDER_EMAIL_ADDRESS: str = os.getenv("SENDER_EMAIL_ADDRESS", "meheret.tesfaye.batu@gmail.com")
    QNODE_WEB_ENDPOINT: str = os.getenv("QNODE_WEB_ENDPOINT", f"http://qnode.meherett.com")
    QNODE_API_ENDPOINT: str = os.getenv("QNODE_API_ENDPOINT", f"http://api.qnode.meherett.com")

    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "qnode")
    DATABASE_PASSWORD: str = os.getenv("DATABASE_PASSWORD", "21qazxswedcvfr43")
    DATABASE_URL: str = os.getenv("DATABASE_URL", (
        f"mongodb+srv://meherett:{DATABASE_PASSWORD}"
        f"@qnode.4ume7.mongodb.net/{DATABASE_NAME}"
        f"?retryWrites=true&w=majority"
        f"&ssl=true&ssl_cert_reqs=CERT_NONE"
    ))
    # Get current working directory path (like linux or unix path).
    cwd: str = os.path.dirname(sys.modules[__package__].__file__)
    with open(f"{cwd}/schemas.json", "r", encoding="utf-8") as schemas:
        DATABASE_SCHEMAS: dict = loads(schemas.read())
        schemas.close()

    BSS: str = os.getenv("BSS", "xBsy8CNyWCDKwMeH")
    BS: int = os.getenv("BS", 16)

    HOST_JANUS_MAINNET: str = os.getenv("HOST_JANUS_MAINNET", "janus-mainnet")
    PORT_JANUS_MAINNET: int = os.getenv("PORT_JANUS_MAINNET", 23890)
    TIMEOUT_JANUS_MAINNET: int = os.getenv("TIMEOUT_JANUS_MAINNET", 10)
    HOST_QTUM_NODE_MAINNET: str = os.getenv("HOST_QTUM_NODE_MAINNET", "qtum-mainnet")
    PORT_QTUM_NODE_MAINNET: int = os.getenv("PORT_QTUM_NODE_MAINNET", 3890)

    HOST_JANUS_TESTNET: str = os.getenv("HOST_JANUS_TESTNET", "janus-testnet")
    PORT_JANUS_TESTNET: int = os.getenv("PORT_JANUS_TESTNET", 23889)
    TIMEOUT_JANUS_TESTNET: int = os.getenv("TIMEOUT_JANUS_TESTNET", 10)
    HOST_QTUM_NODE_TESTNET: str = os.getenv("HOST_QTUM_NODE_TESTNET", "qtum-testnet")
    PORT_QTUM_NODE_TESTNET: int = os.getenv("PORT_QTUM_NODE_TESTNET", 3889)

    AVAILABLE_METHODS: list = os.getenv("AVAILABLE_METHODS", [
        "web3_clientVersion",
        "web3_sha3",
        "net_version",
        "net_listening",
        "net_peerCount",
        "eth_protocolVersion",
        "eth_chainId",
        "eth_mining",
        "eth_hashrate",
        "eth_gasPrice",
        "eth_accounts",
        "eth_blockNumber",
        "eth_getBalance",
        "eth_getStorageAt",
        "eth_getTransactionCount",
        "eth_getCode",
        "eth_sign",
        "eth_signTransaction",
        "eth_sendTransaction",
        "eth_sendRawTransaction",
        "eth_call",
        "eth_estimateGas",
        "eth_getBlockByHash",
        "eth_getBlockByNumber",
        "eth_getTransactionByHash",
        "eth_getTransactionByBlockHashAndIndex",
        "eth_getTransactionByBlockNumberAndIndex",
        "eth_getTransactionReceipt",
        "eth_getUncleByBlockHashAndIndex",
        "eth_getCompilers",
        "eth_newFilter",
        "eth_newBlockFilter",
        "eth_uninstallFilter",
        "eth_getFilterChanges",
        "eth_getFilterLogs",
        "eth_getLogs",
        "eth_subscribe",
        "eth_unsubscribe",
        "qtum_getUTXOs",
        "dev_gethexaddress",
        "dev_fromhexaddress",
        "dev_generatetoaddress"
    ])
