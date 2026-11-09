"""Stable Studionet deployment. Signing accounts live in Node memory only."""
import subprocess
import sys
from pathlib import Path
raise SystemExit(subprocess.call(['node', 'scripts/deploy.js', *sys.argv[1:]],cwd=Path(__file__).resolve().parent))
