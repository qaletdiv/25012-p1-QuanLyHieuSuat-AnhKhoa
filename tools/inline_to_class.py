#!/usr/bin/env python3
import os, re, sys

STYLE_SIGNATURES = [
    ([
        "width:100%",
        "border:1px solid var(--border)",
        "border-radius:10px",
        "padding:8px",
        "background:var(--panel-2)"
     ], "field"),
    ([
        "padding:10px 12px",
        "border-radius:10px",
        "border:1px solid var(--border)"
     ], "field field-lg"),
]

TAG_PATTERN = re.compile(r"<(?P<tag>input|select|textarea)(?P<attrs>[^>]*)>", re.IGNORECASE)
STYLE_ATTR_RE = re.compile(r'\sstyle\s*=\s*"([^"]*)"', re.IGNORECASE)
CLASS_ATTR_RE = re.compile(r'\sclass\s*=\s*"([^"]*)"', re.IGNORECASE)

def normalize_css(s):
    return ";".join([p.strip() for p in s.replace("\n"," ").split(";") if p.strip()])

def style_matches(style_value, substrings):
    s = normalize_css(style_value)
    return all(sub in s for sub in substrings)

def process_tag(tag_html):
    m_style = STYLE_ATTR_RE.search(tag_html)
    if not m_style:
        return tag_html, False
    style_val = m_style.group(1)
    add_classes = None
    for subs, classes in STYLE_SIGNATURES:
        if style_matches(style_val, subs):
            add_classes = classes
            break
    if not add_classes:
        return tag_html, False
    new_tag = tag_html[:m_style.start()] + tag_html[m_style.end():]
    m_class = CLASS_ATTR_RE.search(new_tag)
    if m_class:
        existing = m_class.group(1).strip()
        merged = " ".join(sorted(set((existing + " " + add_classes).split())))
        new_tag = new_tag[:m_class.start(1)] + merged + new_tag[m_class.end(1):]
    else:
        pos = new_tag.rfind(">")
        new_tag = new_tag[:pos] + f' class="{add_classes}"' + new_tag[pos:]
    return new_tag, True

def process_html(content):
    changed = False
    def _repl(m):
        nonlocal changed
        full = m.group(0)
        new_tag, did = process_tag(full)
        if did:
            changed = True
            return new_tag
        return full
    new_content = TAG_PATTERN.sub(_repl, content)
    return new_content, changed

def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/inline_to_class.py /path/to/project")
        sys.exit(1)
    root = sys.argv[1]
    total_files = 0
    modified = 0
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith(".html"):
                total_files += 1
                fp = os.path.join(dirpath, fn)
                with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                new_content, changed = process_html(content)
                if changed:
                    with open(fp, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    modified += 1
                    print(f"[fixed] {fp}")
    print(f"Done. Scanned: {total_files} HTML files. Modified: {modified}.")

if __name__ == "__main__":
    main()
