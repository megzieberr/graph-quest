# -*- coding: utf-8 -*-
"""Regenerate AFRIKAANS-TEKS.md from source, in play order.

Walks every learner-string carrier (B("en","af") calls AND {en,af} object
literals — the q2-point coach bug taught us B() alone is not enough, and
this version also renders `"lit" + expr + "lit"` concatenations, the other
half of that same lesson) and emits one labelled bullet per Afrikaans
string, ⟨…⟩ standing in for anything the game fills in at runtime
(${expr} in templates, or a + expr + concatenation part).

Run:  python tools/extract_af.py          (writes AFRIKAANS-TEKS.md)
      python tools/extract_af.py --check  (writes nothing; prints counts)

Labels come from the surrounding code shape (object key, mc() argument
position, or the `const x =` name), same vocabulary as Megan's 2026-08-12
file: vraag / wenk / afleier / nudge / metodekaart / regte antwoord /
antwoord-etiket / instruksie / byskrif / titel. A string whose role is not
provable gets a plain unlabelled bullet — never a guessed label.

After ANY content session: re-run this, eyeball the diff, commit the file.
New quest file? Add it to SECTIONS in map order (mirror js/quests/index.js).
"""
import html
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILL = "⟨…⟩"  # ⟨…⟩

# ---- map order: MUST mirror js/quests/index.js ----
SECTIONS = [
    ("Quest 1 · Ontdek (parabool-skuiwers)", ["js/quests/q1-discover.js"]),
    ("Quest 2 · Ontdek 2 (lyn · hiperbool · eksponensieel)", ["js/quests/q1b-discover2.js"]),
    ("Quest 3 · Vinnige Oë (vergelyking-flitse)", ["js/quests/qB-recognize.js"]),
    ("Quest 4 · Op die grafiek", ["js/quests/q2-point.js"]),
    ("Quest 5 · Lees die gebied", ["js/quests/q3-region.js"]),
    ("Quest 6 · Plus en minus", ["js/quests/q5-signs.js"]),
    ("Quest 7 · Bo of onder", ["js/quests/q6-compare.js"]),
    ("Quest 8 · Lengtes", ["js/quests/qL-lengths.js"]),
    ("Quest 9 · Gemiddelde gradiënt", ["js/quests/qG-gradient.js"]),
    ("Quest 10 · Transformasies", ["js/quests/qT-transform.js"]),
    ("Quest 11 · Vind die vergelyking", ["js/quests/qE-equation.js"]),
    ("Quest 12 · Aard van wortels", ["js/quests/qK-roots.js"]),
    ("Quest 13 · Ongelykhede 2", ["js/quests/qI-inequal2.js"]),
    ("Quest 14 · Eksamenmodus", ["js/quests/q7-exam.js"]),
    ("App-teks oral (knoppies, terugvoer, UI)",
     ["js/i18n.js", "js/play.js", "js/check.js", "js/funclib.js",
      "js/quests/_shared.js", "js/quests/_graphs.js", "js/quests/_intervals.js",
      "js/engine/interactive.js", "js/engine/slider.js", "js/engine/function-graph.js",
      "js/engine/keypad.js"]),
    ("Kaart & skerms", ["js/screens.js"]),
    ("App-raam", ["js/app.js", "js/backend.js"]),
]

PREAMBLE = (
    "# Fun Functions — al die Afrikaanse teks\n\n"
    "Reël vir regmaak: **verander net die Afrikaanse sin self** — moenie die "
    "etikette, kolpunte of ⟨…⟩ uitvee nie. ⟨…⟩ is 'n getal of naam wat die "
    "speletjie self invul. Los reëls wat reg is net so. Ek werk elke verandering "
    "terug in die kode in.\n"
)

# role → label. None = provably-unlabelled roles stay bare bullets.
KEY_LABEL = {
    "prompt": "vraag",
    "hint": "wenk",
    "hints": "wenk",          # first item only, see decide()
    "misc": "nudge (na verkeerde keuse)",
    "coach": "instruksie",
    "solution": "metodekaart",  # first item only
    "method": "metodekaart",    # first item only
    "graphCap": "byskrif",
    "caption": "byskrif",
    "answerLabel": "antwoord-etiket",
    "title": "titel",
    "label": "afleier",
    "correct": "regte antwoord",
    "wrongs": "afleier",
    "stem": "byskrif",
    "intro": "intro-les",
    "beats": "intro-les",
}
FIRST_ONLY = {"hints", "solution", "method"}

# ---------------------------------------------------------------- tokenizer
def tokenize(src):
    """JS → tokens: id / str / tpl / punct / num.  tpl.v = [('lit',s)|('expr',src)]."""
    toks, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in " \t\r\n":
            i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            while i < n and src[i] != "\n":
                i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"":
            i, s = read_string(src, i, c)
            toks.append({"t": "str", "v": s})
            continue
        if c == "`":
            i, parts = read_template(src, i)
            toks.append({"t": "tpl", "v": parts})
            continue
        if c.isalpha() or c in "_$":
            j = i
            while j < n and (src[j].isalnum() or src[j] in "_$"):
                j += 1
            toks.append({"t": "id", "v": src[i:j]})
            i = j
            continue
        if c.isdigit():
            j = i
            while j < n and (src[j].isalnum() or src[j] == "."):
                j += 1
            toks.append({"t": "num", "v": src[i:j]})
            i = j
            continue
        # regex literals never carry learner text; a naive '/' is fine here
        toks.append({"t": "punct", "v": c})
        i += 1
    return toks


def read_string(src, i, quote):
    out, i, n = [], i + 1, len(src)
    while i < n:
        c = src[i]
        if c == "\\" and i + 1 < n:
            nxt = src[i + 1]
            out.append({"n": "\n", "t": "\t"}.get(nxt, nxt))
            i += 2
            continue
        if c == quote:
            return i + 1, "".join(out)
        out.append(c)
        i += 1
    return n, "".join(out)


def read_template(src, i):
    """Backtick template → list of ('lit', text) / ('expr', source) parts."""
    parts, buf, i, n = [], [], i + 1, len(src)
    while i < n:
        c = src[i]
        if c == "\\" and i + 1 < n:
            buf.append(src[i + 1])
            i += 2
            continue
        if c == "`":
            if buf:
                parts.append(("lit", "".join(buf)))
            return i + 1, parts
        if c == "$" and i + 1 < n and src[i + 1] == "{":
            if buf:
                parts.append(("lit", "".join(buf)))
                buf = []
            depth, j = 1, i + 2
            while j < n and depth:
                if src[j] == "{":
                    depth += 1
                elif src[j] == "}":
                    depth -= 1
                j += 1
            parts.append(("expr", src[i + 2:j - 1]))
            i = j
            continue
        buf.append(c)
        i += 1
    if buf:
        parts.append(("lit", "".join(buf)))
    return n, parts


# ---------------------------------------------------------------- rendering
def clean(text):
    """Decode entities, strip tags — the .md shows prose, the code keeps HTML."""
    text = re.sub(r"<br\s*/?>", " ", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def render_variants(toks):
    """Token slice → list of template strings.  A top-level `cond ? a : b`
    yields BOTH branches as separate bullets (q5's method card taught us)."""
    depth = 0
    for idx, tk in enumerate(toks):
        if tk["t"] != "punct":
            continue
        if tk["v"] in "([{":
            depth += 1
        elif tk["v"] in ")]}":
            depth -= 1
        elif tk["v"] == "?" and depth == 0:
            open_q, d2, j = 1, 0, idx + 1
            while j < len(toks):
                t2 = toks[j]
                if t2["t"] == "punct":
                    if t2["v"] in "([{":
                        d2 += 1
                    elif t2["v"] in ")]}":
                        d2 -= 1
                    elif t2["v"] == "?" and d2 == 0:
                        open_q += 1
                    elif t2["v"] == ":" and d2 == 0:
                        open_q -= 1
                        if open_q == 0:
                            break
                j += 1
            return render_variants(toks[idx + 1:j]) + render_variants(toks[j + 1:])
    s = render_arg(toks)
    # a bullet that is nothing but fill-ins tells Megan nothing — drop it
    if not re.search(r"\w", s.replace(FILL, "")):
        return []
    return [s]


def render_arg(toks):
    """Token slice → template string; every non-literal chunk becomes ⟨…⟩."""
    out = []
    for tk in toks:
        if tk["t"] == "str":
            out.append(tk["v"])
        elif tk["t"] == "tpl":
            for kind, val in tk["v"]:
                out.append(val if kind == "lit" else FILL)
        elif tk["t"] == "punct" and tk["v"] == "+":
            continue
        else:
            out.append(FILL)
    s = "".join(out)
    s = re.sub(r"(?:⟨…⟩\s*){2,}", FILL, s)
    return clean(s)


def split_args(toks, start):
    """toks[start] == '('.  → (arg slices, index just past ')')."""
    depth, args, cur, i = 1, [], [], start + 1
    while i < len(toks) and depth:
        tk = toks[i]
        if tk["t"] == "punct":
            if tk["v"] in "([{":
                depth += 1
            elif tk["v"] in ")]}":
                depth -= 1
                if depth == 0:
                    break
            elif tk["v"] == "," and depth == 1:
                args.append(cur)
                cur = []
                i += 1
                continue
        cur.append(tk)
        i += 1
    if cur:
        args.append(cur)
    return args, i + 1


# ---------------------------------------------------------------- extraction
def decide(stack, assign_name):
    """Innermost provable role wins; None = unlabelled bullet."""
    if assign_name and assign_name in KEY_LABEL:
        if assign_name in FIRST_ONLY:
            return None
        return KEY_LABEL[assign_name]
    for level in reversed(stack):
        # the current key AND the container's own role both count — a level's
        # unrelated last key must not shadow the name it was assigned to
        for key in (level.get("key"), level.get("inherit")):
            if key in KEY_LABEL:
                if key in FIRST_ONLY:
                    return KEY_LABEL[key] if level.get("item", 0) == 0 else None
                return KEY_LABEL[key]
        call = level.get("call")
        if call == "mc":
            # mc(concept, prompt, correct, wrongs, opts) — concept is arg 1
            return {2: "vraag", 3: "regte antwoord", 4: "afleier"}.get(level["arg"])
        if call == "quest":
            return None  # title + blurb stay bare, like her file
    return None


def extract_file(path):
    """→ ordered [(label_or_None, af_text)] for one source file."""
    src = path.read_text(encoding="utf-8")
    toks = tokenize(src)
    found, stack = [], []
    i = 0
    while i < len(toks):
        tk = toks[i]
        if tk["t"] == "punct":
            v = tk["v"]
            if v == "(":
                call = toks[i - 1]["v"] if i and toks[i - 1]["t"] == "id" else None
                stack.append({"o": "(", "call": call, "arg": 1})
            elif v == "{":
                inherit = stack[-1].get("key") if stack else None
                # `quest3.intro = {` / `const wrongs = [` — the assigned name
                # is the container's role
                if i >= 2 and toks[i - 1] == {"t": "punct", "v": "="} and toks[i - 2]["t"] == "id":
                    inherit = toks[i - 2]["v"]
                stack.append({"o": "{", "inherit": inherit, "en_seen": False})
            elif v == "[":
                inherit = stack[-1].get("key") if stack else None
                if i >= 2 and toks[i - 1] == {"t": "punct", "v": "="} and toks[i - 2]["t"] == "id":
                    inherit = toks[i - 2]["v"]
                stack.append({"o": "[", "inherit": inherit, "item": 0})
            elif v in ")]}":
                if stack:
                    stack.pop()
            elif v == "," and stack:
                top = stack[-1]
                if top["o"] == "(":
                    top["arg"] += 1
                elif top["o"] == "[":
                    top["item"] += 1
                elif top["o"] == "{":
                    top["key"] = None
            i += 1
            continue

        # object key:   ident :
        if (tk["t"] == "id" and i + 1 < len(toks)
                and toks[i + 1] == {"t": "punct", "v": ":"}
                and stack and stack[-1]["o"] == "{"):
            stack[-1]["key"] = tk["v"]
            if tk["v"] == "en":
                stack[-1]["en_seen"] = True
            if tk["v"] == "af" and stack[-1]["en_seen"]:
                # {en: "...", af: "..."} literal — value runs to , or }
                depth, j, val = 0, i + 2, []
                while j < len(toks):
                    t2 = toks[j]
                    if t2["t"] == "punct":
                        if t2["v"] in "([{":
                            depth += 1
                        elif t2["v"] in ")]}":
                            if depth == 0:
                                break
                            depth -= 1
                        elif t2["v"] == "," and depth == 0:
                            break
                    val.append(t2)
                    j += 1
                label = decide(stack[:-1], None)
                for text in render_variants(val):
                    found.append((label, text))
            i += 2
            continue

        # B("en", "af") call
        if tk["t"] == "id" and tk["v"] == "B" and i + 1 < len(toks) \
                and toks[i + 1] == {"t": "punct", "v": "("}:
            assign = None
            if i >= 2 and toks[i - 1] == {"t": "punct", "v": "="} and toks[i - 2]["t"] == "id":
                assign = toks[i - 2]["v"]
            label = decide(stack, assign)
            args, nxt = split_args(toks, i + 1)
            if len(args) >= 2:
                for text in render_variants(args[1]):
                    found.append((label, text))
                # a template inside the EN arg may hide nested B()s — recurse
                for arg in args[:1]:
                    for t2 in arg:
                        if t2["t"] == "tpl":
                            for kind, val in t2["v"]:
                                if kind == "expr" and "B(" in val:
                                    found.extend(extract_source(val))
            i = nxt
            continue
        i += 1
    return found


def extract_source(src_fragment):
    toks = tokenize(src_fragment)
    tmp = Path("__frag__")
    # tiny reuse shim: run the same walk over a fragment
    class P:  # noqa
        def read_text(self, encoding):
            return src_fragment
    return extract_file(P())


def build():
    out = io.StringIO()
    out.write(PREAMBLE)
    totals = 0
    for header, files in SECTIONS:
        bullets, seen = [], set()
        for rel in files:
            p = ROOT / rel
            if not p.exists():
                continue
            for label, text in extract_file(p):
                key = (label, text)
                if key in seen:
                    continue
                seen.add(key)
                bullets.append((label, text))
        if not bullets:
            continue
        out.write(f"\n## {header}\n")
        for label, text in bullets:
            if label:
                out.write(f"- **[{label}]** {text}\n")
            else:
                out.write(f"- {text}\n")
        totals += len(bullets)
    return out.getvalue(), totals


def main():
    text, totals = build()
    if "--check" in sys.argv:
        print(f"{totals} bullets across {len(SECTIONS)} sections (nothing written)")
        return
    (ROOT / "AFRIKAANS-TEKS.md").write_text(text, encoding="utf-8", newline="\n")
    print(f"AFRIKAANS-TEKS.md written: {totals} bullets")


if __name__ == "__main__":
    main()
