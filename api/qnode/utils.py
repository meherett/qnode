#!/usr/bin/env python3

from datetime import datetime
from random import choice

import string

# Alphabet and digits.
letters: str = string.ascii_letters + string.digits


def get_current_timestamp(plus: int = 0) -> int:
    return int(datetime.timestamp(datetime.now())) \
        if plus == 0 else int(datetime.timestamp(datetime.now())) + plus


def generate_key(length: int = 32) -> str:
    return str().join(choice(letters) for _ in range(length))
