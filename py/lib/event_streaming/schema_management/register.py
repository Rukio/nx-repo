# -*- coding: utf-8 -*-
"""
A script to register all schemas in a directory

Authentication is done with a bearer token using the env var AIVEN_API_TOKEN

Usage
------------
To see help message with current options
python register.py --help

The avro schema file must be set as well as the designated project and service to validate against
python register.py -f path/to/avro/schema.avsc -p my-kafka-project -s my-kafka-service
"""
from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path

from schema_management.api import AivenAPIClient
from schema_management.utils import get_token
from schema_management.utils import IGNORE_FILES

logging.basicConfig()
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def register_schema(schema_path: str, recursive: bool, project: str, service: str, token: str) -> None:
    """Register the schemas from the schema file or schema files in a directory recursively

    Parameters
    ----------
    schema_path
        The file path to the schema
    recursive
        Boolean value indicating if the path should crawled for all files
    project
        The name of the Aiven project to use to validate
    service
        The name of the Kafka service in the project to validate
    token
        The bearer token to authenticate with the Aiven API
        https://docs.aiven.io/docs/platform/concepts/authentication-tokens
    """
    api = AivenAPIClient(token, project, service)

    schema_path_obj = Path(schema_path)
    if not recursive or schema_path_obj.is_file():
        if schema_path_obj.name in IGNORE_FILES:
            return
        logger.info(f"Registering {str(schema_path_obj)}")
        api.register_schema_from_file(str(schema_path_obj), project, service)
    else:
        logger.info(f"Registering schemas in {schema_path}")
        for root, dir_names, file_names in os.walk(schema_path_obj):
            for f in file_names:
                if f in IGNORE_FILES:
                    continue
                fp = os.path.join(root, f)
                logger.info(f"Registering schema at {fp}")
                api.register_schema_from_file(fp, project, service)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--file-path", dest="fp", required=True)
    parser.add_argument("-r", "--recursive", dest="recursive", action="store_true", default=True)
    parser.add_argument("-p", "--project", required=True, dest="project")
    parser.add_argument("-s", "--service", required=True, dest="service")
    args = parser.parse_args()
    token = get_token()
    register_schema(args.fp, args.recursive, args.project, args.service, token)
