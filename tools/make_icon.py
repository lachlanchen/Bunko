#!/usr/bin/env python3
"""Compatibility entry point: export the approved Bunko icon master."""
from pathlib import Path
import subprocess

subprocess.run(["node", str(Path(__file__).with_name("export_icon.mjs"))], check=True)
