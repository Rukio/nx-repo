# -*- coding: utf-8 -*-
from __future__ import annotations

import os
import pathlib

from click.testing import CliRunner

from scripts import refactor_protos

FILE_CONTENTS_WITH_FIXABLE_IMPORTS = """
from common import blah <- fixable
from google import x <- should not change
from proto.common import <- should not change
there is from nothing <- should not change
 from common import blah <- should not change
"""

FIXED_FILE_CONTENTS = """
from proto.common import blah <- fixable
from google import x <- should not change
from proto.common import <- should not change
there is from nothing <- should not change
 from common import blah <- should not change
"""


class SetupEnv:
    """
    SetupEnv creates a dummy root folders + files at the provided root_path.
    contains reference to all files + folders created, and helper funcs
    """

    def __init__(self, root_path: pathlib.Path) -> None:
        """
        setup env builds a dir structure based at tmp_path that looks like this:
        tmp_path/root
        - file_pb2_grpc.py
        - file.py
        - subdir
        - - file_pb2.py
        - - file2.py

        All of the files have the same contents
        """
        self.root_dir_path = root_path / "root"
        self.root_dir_path.mkdir()

        self.valid_file_paths = []
        self.invalid_file_paths = []
        self.dir_paths = [self.root_dir_path]

        valid_file_1 = self.root_dir_path / "file_pb2_grpc.py"
        valid_file_1.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)
        self.valid_file_paths.append(valid_file_1)

        invalid_file_1 = self.root_dir_path / "file.py"
        invalid_file_1.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)
        self.invalid_file_paths.append(invalid_file_1)

        sub_dir = self.root_dir_path / "subdir"
        sub_dir.mkdir()
        self.dir_paths.append(sub_dir)

        valid_file_2 = sub_dir / "file_pb2.py"
        valid_file_2.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)
        self.valid_file_paths.append(valid_file_2)

        invalid_file_2 = sub_dir / "file2.py"
        invalid_file_2.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)
        self.invalid_file_paths.append(invalid_file_2)

    def assert_file_contents_equal_expected(self, filepath: pathlib.Path, expected_content: str):
        """
        Helper that asserts the content of the file is equal at filepath is equal to content
        """
        with open(filepath, "r") as f:
            file_contents = f.read()
        assert file_contents == expected_content


def test_refactor_proto_imports(tmp_path: pathlib.Path):
    test_env = SetupEnv(tmp_path)
    # Test that a filepath passed to func fixes the imports properly
    valid_file = test_env.valid_file_paths[0]
    # verify file is invalid to start
    test_env.assert_file_contents_equal_expected(valid_file, FILE_CONTENTS_WITH_FIXABLE_IMPORTS)

    # run refactor and verify that the new file matches expected fixed contents
    refactor_protos.refactor_proto_imports(valid_file)
    test_env.assert_file_contents_equal_expected(valid_file, FIXED_FILE_CONTENTS)


def test_ensure_init_py(tmp_path: pathlib.Path):
    # run ensure_init_py, and verify no __init__.py exists, then run script
    # and verify existance
    test_env = SetupEnv(tmp_path)
    exp_init_path = test_env.root_dir_path / "__init__.py"
    assert not os.path.exists(exp_init_path)

    refactor_protos.ensure_init_py(test_env.root_dir_path)

    assert os.path.exists(exp_init_path)

    test_env.assert_file_contents_equal_expected(exp_init_path, refactor_protos.GENERATED_FILE_COMMENT)

    # verify that running ensure_init_py when init exists does not override contents of __init__.py
    new_init_contents = "# some bs"
    with open(exp_init_path, "w") as f:
        f.write(new_init_contents)
    refactor_protos.ensure_init_py(test_env.root_dir_path)
    test_env.assert_file_contents_equal_expected(exp_init_path, new_init_contents)


def test_refactor_protos(tmp_path):
    runner = CliRunner()

    with runner.isolated_filesystem(temp_dir=tmp_path):
        test_env = SetupEnv(tmp_path)
        # verify error occurs when passing in file instead of dir
        some_file_path = test_env.valid_file_paths[0]
        out = runner.invoke(refactor_protos.refactor_protos, [str(some_file_path)])
        # NOTE: there isn't a great way of looking at what invalid input error occured
        assert "Error: Invalid value for 'DIRNAME':" in out.stdout

        # verify no error when directory passed in
        out = runner.invoke(refactor_protos.refactor_protos, [str(test_env.root_dir_path)])
        assert out.exit_code == 0

        # verify file expected to change are updated
        for fp in test_env.valid_file_paths:
            test_env.assert_file_contents_equal_expected(fp, FIXED_FILE_CONTENTS)

        # verify files unexpected to change did not change
        for fp in test_env.invalid_file_paths:
            test_env.assert_file_contents_equal_expected(fp, FILE_CONTENTS_WITH_FIXABLE_IMPORTS)

        # verify that __init__.py is in each dir, with proper header contents
        for dp in test_env.dir_paths:
            exp_init_path = dp / "__init__.py"
            assert os.path.exists(exp_init_path)
            test_env.assert_file_contents_equal_expected(exp_init_path, refactor_protos.GENERATED_FILE_COMMENT)


def setup_env(tmp_path: pathlib.Path):
    """
    setup env builds a dir structure based at tmp_path that looks like this:
    tmp_path/root
    - file_pb2_grpc.py
    - file.py
    - subdir
    - - file_pb2.py
    - - file2.py

    All of the files have the same contents
    """
    root_dir = tmp_path / "root"
    root_dir.mkdir()
    valid_file_1 = root_dir / "file_pb2_grpc.py"
    valid_file_1.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)
    invalid_file_1 = root_dir / "file.py"
    invalid_file_1.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)
    sub_dir = root_dir / "subdir"
    sub_dir.mkdir()
    valid_file_2 = sub_dir / "file_pb2.py"
    valid_file_2.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)
    invalid_file_2 = sub_dir / "file2.py"
    invalid_file_2.write_text(FILE_CONTENTS_WITH_FIXABLE_IMPORTS)


def check_file_contents_equal_expected(filepath: pathlib.Path, expected_content: str):
    """
    Helper that asserts the content of the file is equal at filepath is equal to content
    """
    with open(filepath, "r") as f:
        file_contents = f.read()
    assert file_contents == expected_content
