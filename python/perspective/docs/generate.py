################################################################################
#
# Copyright (c) 2019, the Perspective Authors.
#
# This file is part of the Perspective library, distributed under the terms of
# the Apache License 2.0.  The full license can be found in the LICENSE file.
#

import os
import shutil
import re

HEADER = """---
id: "perspective-python"
title: "perspective-python API"
---

"""

def fix_param_lists(txt):
    return re.sub("^ *?\n    \\* ", "    * ", txt, flags=re.DOTALL | re.MULTILINE)

def fix_headers(txt):
    txt = re.sub("^# ", "## ", txt, flags=re.DOTALL | re.MULTILINE)
    txt = re.sub("^### Examples?", "##### Examples", txt, flags=re.DOTALL | re.MULTILINE)
    return txt

def fix_returns(txt):
    offset = 0
    for match in re.finditer("^\\* \\*\\*Returns\\*\\*.+?\\* \\*\\*Return type\\*\\*", txt, flags=re.DOTALL | re.MULTILINE):
        group = match.group(0)
        new_group = re.sub("        ", "    ", group)
        txt = txt[:match.start(0) - offset] + new_group + txt[match.end(0) - offset:]
        offset += len(group) - len(new_group)
    return txt

def main():
    cwd = os.path.dirname(os.path.realpath(__file__))
    build_dir = os.path.join(cwd, "build")
    if (os.path.exists(build_dir)):
        print("Cleaning docs build folder '{}'".format(build_dir))
        shutil.rmtree(build_dir)
    os.system("sphinx-build -b markdown {} {}".format(cwd, build_dir))

    output = HEADER
    for filename in ["perspective.table.md", "perspective.core.md"]:
        if filename.endswith(".md"):
            with open(os.path.join(build_dir, filename), "r+") as file:
                txt = file.read()
                txt = fix_param_lists(txt)
                txt = fix_headers(txt)
                txt = fix_returns(txt)
                output += txt

    output_dir = os.path.join(cwd, "..", "..", "..", "docs", "docs", "obj")
    with open(os.path.join(output_dir, "perspective-python.md"), "w+") as file:
        file.write(output)
        file.truncate()


main()