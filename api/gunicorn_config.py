#!/usr/bin/env python3

# import os

bind: str = "0.0.0.0:8080"
workers: int = 4
threads: int = 1000

# pidfile: str = "app01.pid"
# worker_tmp_dir: str = "/dev/shm"
# worker_class: str = "gthread"
# workers: int = 8
# worker_connections: int = 1000
# timeout: int = 30
# keepalive: int = 2
# threads: int = 4
# proc_name: str = "app01"
# bind: str = f"0.0.0.0:{str(os.environ['port_addr'])}"
# backlog: int = 2048
# accesslog: str = "-"
# errorlog: str = "-"
# loglevel: str = "debug"
# access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
# # certfile: str = "/tmp/fullchain.pem"
# # keyfile: str = "/tmp/privkey.pem"
# # errorlog: str = '/tmp/errorfile'
# # capture_output: bool = True
