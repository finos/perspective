
import os
import shutil
import re


#   "docs:prebuild": "echo \"cleaning docs build folder\" && rimraf ./docs/build",
#     "docs:build": "sphinx-build -b markdown docs docs/build",
#     "docs:deploy": "npm-run-all docs:deploy:core docs:deploy:table",
#     "docs:deploy:core": "(echo \"---\nid: perspective-python-core\ntitle: perspective.core Python API\n---\n\n\"; cat ./docs/build/perspective.core.md) > ../../docs/obj/perspective-python-core.md",
#     "docs:deploy:table": "(echo \"---\nid: perspective-python-table\ntitle: perspective.table Python API\n---\n\n\"; cat ./docs/build/perspective.table.md) > ../../docs/obj/perspective-python-table.md"
 

HEADER = """---
id: "perspective-python"
title: "perspective-python API"
---

"""

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
                
                # Fix parameter lists
                fixed = re.sub("^ *?\n    \\* ", "    * ", txt, flags=re.DOTALL | re.MULTILINE)

                # Fix headers
                fixed = re.sub("^# ", "## ", fixed, flags=re.DOTALL | re.MULTILINE)
                fixed = re.sub("^### Examples?", "##### Examples", fixed, flags=re.DOTALL | re.MULTILINE)

                output += fixed

    output_dir = os.path.join(cwd, "..", "..", "..", "docs", "obj")
    with open(os.path.join(output_dir, "perspective-python.md"), "w+") as file:
        file.write(output)
        file.truncate()


main()