#!/usr/bin/env python3
"""
============================================================
 SYNC FUN FUNCTIONS -> BLIPWORK          (FUNFUN-PART2-BRIEF D12)
------------------------------------------------------------
 graph-quest is the SOURCE OF TRUTH for Fun Functions. blipwork
 mounts it (js/mount.js's mountFunFunctions) inside a shadow root,
 and to do that it needs a COPY of the mount's import graph sitting
 in its own tree, because a browser cannot import across two
 separately-served origins/folders.

 This script makes that copy. The destination,
 maths-homework-quest/js/funfun/, is GENERATED OUTPUT: it is wiped
 and rewritten on every run, and nothing there may ever be
 hand-edited. Fix Fun Functions in graph-quest, then run this.

 WHAT IS COPIED (and why nothing else)
   js/mount.js            the seam itself
   js/play.js             the one play loop
   js/ui.js js/i18n.js    DOM helpers + the bilingual strings
   js/backend.js          HostBackend() lives here
   js/check.js js/funclib.js
   js/screens.js          ONLY for questUnlocked() — blipwork draws
                          its own tiles but reuses the grandfathered
                          unlock rule
   js/supabase-config.js  backend.js imports it (the standalone's
                          cloud backend); unused in mounted mode but
                          the import must resolve
   js/engine/*.js         graph + interactive + keypad + slider
   js/quests/*.js         all 15 quests plus their shared helpers
   mount-driver.js        the headless harness driver, so blipwork's
                          verify-funfun.html drives the SAME driver
                          mount-test.html does
   css/styles.css   ->    js/funfun/styles.css

 WHAT IS DELIBERATELY NOT COPIED
   css/standalone.css     page-owning rules (html, body, the grid
                          overlay). It would repaint blipwork's page.
   js/app.js              the standalone shell: chrome, map, its own
                          results card, url flags, service worker.
                          blipwork owns all of that itself.

 LAYOUT: the js/ prefix is stripped, subfolders are kept —
 js/quests/index.js -> js/funfun/quests/index.js — so every relative
 import inside the copied files ("./ui.js", "../check.js",
 "./engine/keypad.js") keeps resolving untouched.

 THE ONE REWRITE: mount-driver.js sits at graph-quest's ROOT and
 imports "./js/mount.js". In the flattened destination it sits
 beside mount.js, so that single specifier is rewritten to
 "./mount.js". This is the ONLY content change the script makes;
 it asserts the specifier was present, so a future move of
 mount-driver.js fails loudly here instead of silently shipping a
 broken import.

 Python 3, stdlib only, idempotent. Run it from anywhere:
   python graph-quest/tools/sync-to-blipwork.py
============================================================
"""

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------
# what to copy: (source path relative to graph-quest root,
#                destination path relative to js/funfun/)
# ---------------------------------------------------------------
FLAT_JS = [
    "mount.js",
    "play.js",
    "ui.js",
    "i18n.js",
    "backend.js",
    "check.js",
    "funclib.js",
    "screens.js",
    "supabase-config.js",
]
GLOB_DIRS = ["engine", "quests"]          # js/<dir>/*.js -> js/funfun/<dir>/*.js
ROOT_FILES = [("mount-driver.js", "mount-driver.js")]
CSS = [("css/styles.css", "styles.css")]

# the single content rewrite (see the header)
REWRITES = {
    "mount-driver.js": [('from "./js/mount.js"', 'from "./mount.js"')],
}

GENERATED_MD = """# GENERATED — never hand-edit

Every file in `js/funfun/` is a COPY of Fun Functions, whose source of
truth is the **graph-quest** repo. This folder is wiped and rewritten
in full on every sync.

To change anything here:

1. edit it in `graph-quest/js/…` (or `graph-quest/css/styles.css`)
2. run `python graph-quest/tools/sync-to-blipwork.py`
3. re-run blipwork's `verify-funfun.html`

The one thing the script rewrites is `mount-driver.js`'s import of
mount.js (`./js/mount.js` -> `./mount.js`), because the `js/` prefix is
stripped in this layout.

`manifest.json` beside this file lists exactly what was copied, from
which graph-quest commit, and each file's sha256.
"""


def git_commit(root: Path) -> str:
    try:
        out = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=20,
        )
        if out.returncode == 0:
            return out.stdout.strip()
        return "unknown"
    except Exception:
        return "unknown"


def git_dirty(root: Path) -> bool:
    try:
        out = subprocess.run(
            ["git", "-C", str(root), "status", "--porcelain"],
            capture_output=True, text=True, timeout=20,
        )
        return out.returncode == 0 and bool(out.stdout.strip())
    except Exception:
        return False


def plan(src_root: Path):
    """-> [(abs source path, relative destination path)], sorted, stable."""
    pairs = []
    for name in FLAT_JS:
        pairs.append((src_root / "js" / name, name))
    for d in GLOB_DIRS:
        for p in sorted((src_root / "js" / d).glob("*.js")):
            pairs.append((p, f"{d}/{p.name}"))
    for src, dest in ROOT_FILES:
        pairs.append((src_root / src, dest))
    for src, dest in CSS:
        pairs.append((src_root / src, dest))
    return pairs


def main() -> int:
    here = Path(__file__).resolve()
    src_root = here.parent.parent                      # graph-quest/
    default_dest = src_root.parent / "maths-homework-quest" / "js" / "funfun"

    ap = argparse.ArgumentParser(description="Sync Fun Functions into blipwork's js/funfun/.")
    ap.add_argument("--dest", default=str(default_dest),
                    help="destination js/funfun folder (default: sibling maths-homework-quest)")
    ap.add_argument("--dry-run", action="store_true", help="say what would happen, write nothing")
    args = ap.parse_args()

    dest_root = Path(args.dest).resolve()
    pairs = plan(src_root)

    missing = [str(s) for s, _ in pairs if not s.is_file()]
    if missing:
        print("REFUSING TO SYNC — these source files are missing:", file=sys.stderr)
        for m in missing:
            print("  " + m, file=sys.stderr)
        return 2

    if not dest_root.parent.parent.is_dir():
        print(f"REFUSING TO SYNC — {dest_root.parent.parent} is not a folder "
              f"(is blipwork checked out beside graph-quest?)", file=sys.stderr)
        return 2

    commit = git_commit(src_root)
    dirty = git_dirty(src_root)

    print(f"source : {src_root}")
    print(f"dest   : {dest_root}")
    print(f"commit : {commit}{'  (WORKING TREE DIRTY — this copy is not that commit)' if dirty else ''}")
    print(f"files  : {len(pairs)}")
    if args.dry_run:
        for _, rel in pairs:
            print("  would copy  " + rel)
        return 0

    # WIPE: this folder is generated output, so a file that no longer
    # exists upstream must not survive here.
    if dest_root.exists():
        shutil.rmtree(dest_root)
    dest_root.mkdir(parents=True)

    entries = []
    for src, rel in pairs:
        out = dest_root / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        data = src.read_bytes()
        rules = REWRITES.get(rel)
        if rules:
            text = data.decode("utf-8")
            for old, new in rules:
                if old not in text:
                    print(f"REFUSING TO SYNC — expected to rewrite {old!r} in {rel}, "
                          f"but it is not there any more. Check the header's "
                          f"'THE ONE REWRITE' note.", file=sys.stderr)
                    return 3
                text = text.replace(old, new)
            data = text.encode("utf-8")
        out.write_bytes(data)
        entries.append({
            "from": str(src.relative_to(src_root)).replace("\\", "/"),
            "to": rel,
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "rewritten": bool(rules),
        })
        print(f"  copied  {rel}")

    (dest_root / "GENERATED.md").write_text(GENERATED_MD, encoding="utf-8")

    manifest = {
        "generatedBy": "graph-quest/tools/sync-to-blipwork.py",
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "sourceRepo": "graph-quest",
        "sourceCommit": commit,
        "sourceWorkingTreeDirty": dirty,
        "note": "GENERATED OUTPUT — never hand-edit js/funfun/. See GENERATED.md.",
        "files": entries,
    }
    (dest_root / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(f"  wrote   GENERATED.md")
    print(f"  wrote   manifest.json")
    print(f"done — {len(entries)} files synced into {dest_root}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
