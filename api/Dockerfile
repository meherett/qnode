# syntax=docker/dockerfile:1

# Use the Python v3.10.5 alpine image
FROM python:3.10.5-alpine

# Set the working directory to /qnode-api
WORKDIR /qnode-api

# Copy the current directory contents into the container at /qnode-api
COPY . /qnode-api

# Install all Dependencies for WSGI
RUN set -e && apk add --no-cache --virtual .build-deps gcc g++ make libffi-dev libc-dev linux-headers

# Upgrade PIP package to latest
RUN python3 -m pip install --upgrade pip

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install websockets==10.3

# Remove temporary build-deps
RUN apk del .build-deps

# Expose port number
EXPOSE 8080

# Give read, write and execute permission to entrypoint.sh
RUN chmod 777 entrypoint.sh

# Set endpoint for QNode (gunicorn) and run the project
ENTRYPOINT ["sh", "entrypoint.sh"]
