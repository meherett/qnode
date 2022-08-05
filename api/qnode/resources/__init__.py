#!/usr/bin/env python3

from .user import UserResource
from .project import ProjectResource
from .token import TokenResource

from .. import api

api.add_resource(UserResource, "/api/users", methods=["GET", "POST"], endpoint="api_users")
api.add_resource(UserResource, "/api/users/<_id>", methods=["GET", "PUT", "DELETE"], endpoint="api_user")
api.add_resource(UserResource, "/users", methods=["GET", "POST"], endpoint="users", subdomain="api")
api.add_resource(UserResource, "/users/<_id>", methods=["GET", "PUT", "DELETE"], endpoint="user", subdomain="api")

api.add_resource(ProjectResource, "/api/projects", methods=["GET", "POST"], endpoint="api_projects")
api.add_resource(ProjectResource, "/api/projects/<_id_or_key>", methods=["GET", "PUT", "DELETE"], endpoint="api_project")
api.add_resource(ProjectResource, "/projects", methods=["GET", "POST"], endpoint="projects", subdomain="api")
api.add_resource(ProjectResource, "/projects/<_id_or_key>", methods=["GET", "PUT", "DELETE"], endpoint="project", subdomain="api")

api.add_resource(TokenResource, "/api/tokens", methods=["GET", "POST"], endpoint="api_tokens")
api.add_resource(TokenResource, "/api/tokens/<_id>", methods=["GET", "PUT", "DELETE"], endpoint="api_token")
api.add_resource(TokenResource, "/tokens", methods=["GET", "POST"], endpoint="tokens", subdomain="api")
api.add_resource(TokenResource, "/tokens/<_id>", methods=["GET", "PUT", "DELETE"], endpoint="token", subdomain="api")
