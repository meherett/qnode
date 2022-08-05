#!/usr/bin/env python3

from base64 import (
    b64encode, b64decode, urlsafe_b64encode, urlsafe_b64decode
)
from bson.json_util import json
from Crypto.Cipher import AES
from Crypto import Random
from passlib.hash import pbkdf2_sha256
from typing import Any

from .config import Config


def encrypt(data: str, bs: int = Config.BS, bss: str = Config.BSS) -> str:
    iv: bytes = Random.new().read(bs)
    cipher = AES.new(bss.encode("utf8"), AES.MODE_CFB, iv, segment_size=AES.block_size * 8)
    pad: Any = lambda s: s + (bs - len(s) % bs) * chr(bs - len(s) % bs)
    encrypted_msg: bytes = cipher.encrypt(pad(str(data)).encode("utf8"))
    return urlsafe_b64encode(iv + encrypted_msg).decode("utf8").rstrip("=")


def encrypt_object(data: dict) -> str:
    return encrypt(data=json.dumps(data))


def decrypt(encrypted: str, bs: int = Config.BS, bss: str = Config.BSS) -> str:
    decoded_msg: bytes = urlsafe_b64decode((encrypted + "=" * (4 - len(encrypted) % 4)))
    iv, encrypted_msg = decoded_msg[:bs], decoded_msg[bs:]
    cipher = AES.new(bss.encode("utf8"), AES.MODE_CFB, iv, segment_size=AES.block_size * 8)
    unpad: Any = lambda s: s[:-ord(s[len(s) - 1:])]
    byte_decrypted = unpad(cipher.decrypt(encrypted_msg))
    return str(byte_decrypted, "utf-8")


def decrypt_object(encrypted: str) -> dict:
    return json.loads(decrypt(encrypted=encrypted))


def encrypt_const(data: str, secret_key: str = Config.SECRET_KEY) -> str:
    cipher = AES.new(secret_key.encode("utf-8"), AES.MODE_ECB)
    return b64encode(cipher.encrypt(data.encode("utf-8"))).decode("utf-8")


def decrypt_const(encrypted: str, secret_key: str = Config.SECRET_KEY) -> str:
    cipher = AES.new(secret_key.encode("utf-8"), AES.MODE_ECB)
    return cipher.decrypt(b64decode(encrypted.encode("utf-8"))).decode("utf-8")


def generate_hash_by_pbkdf2(data: str, salt_size: int, rounds: int) -> str:
    return pbkdf2_sha256.using(
        salt_size=salt_size, rounds=rounds
    ).hash(data)


def verify_hash_by_pbkdf2(data: str, hashed: str, salt_size: int, rounds: int) -> bool:
    return pbkdf2_sha256.using(
        salt_size=salt_size, rounds=rounds
    ).verify(data, hashed)
