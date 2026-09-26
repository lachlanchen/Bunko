"""Preserve source figures, including TeX-drawn diagrams, in owner editions."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.runtime/owner-figures'
TIKZ = re.compile(r'\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}')


def unwrap_image_boxes(text):
    """Pandoc discards resizebox/scalebox contents; CSS scales book figures."""
    pattern = re.compile(r'\\(resizebox\*?|scalebox)\s*')
    def argument(start):
        while start < len(text) and text[start].isspace():
            start += 1
        if start == len(text) or text[start] != '{':
            raise ValueError('Expected a braced TeX image-box argument')
        depth, end = 1, start + 1
        while end < len(text) and depth:
            if text[end] == '\\':
                end += 2
                continue
            if text[end] == '{': depth += 1
            elif text[end] == '}': depth -= 1
            end += 1
        if depth:
            raise ValueError('Unclosed TeX image box')
        return text[start + 1:end - 1], end
    replacements = []
    for match in pattern.finditer(text):
        end = match.end()
        for _ in range(3 if match[1].startswith('resizebox') else 2):
            body, end = argument(end)
        if '\\includegraphics' in body:
            replacements.append((match.start(), end, body))
    for start, end, body in reversed(replacements):
        text = text[:start] + body + text[end:]
    return text


def resolve_image(name, source, figure_root=None):
    """Respect chapter-local images and course assets; never silently drop one."""
    path = Path(name)
    roots = [source.parent]
    if figure_root:
        roots += [figure_root, figure_root.parent, figure_root.parent / 'assets']
    roots += [source.parent / 'figures', source.parent / 'assets',
              source.parent.parent / 'figures', source.parent.parent / 'assets']
    for root in roots:
        for candidate in (root / path, root / path.name):
            if candidate.is_file():
                return candidate.resolve()
    raise FileNotFoundError(f'{source}: missing figure {name}')


def render_tikz(diagram, source):
    preamble = next((p / 'common_preamble.tex' for p in source.parents
                     if (p / 'common_preamble.tex').is_file()), None)
    if not preamble:
        raise ValueError(f'No diagram preamble for {source}')
    # Use the original fonts, macros, libraries and book text width. Preview
    # crops the actual vector drawing, including labels outside the main box.
    tex = ('\\documentclass[11pt,oneside]{book}\n' + preamble.read_text() + r'''
\usepackage[active,tightpage]{preview}
\PreviewEnvironment{tikzpicture}
\setlength\PreviewBorder{6pt}
\begin{document}
''' + diagram + '\n\\end{document}\n')
    key = hashlib.sha256(tex.encode()).hexdigest()[:20]
    folder = CACHE / key
    target = folder / f'diagram-{key}.png'
    if target.exists():
        return target
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'diagram.tex').write_text(tex)
    engine = 'xelatex' if 'fontspec' in tex else 'pdflatex'
    result = subprocess.run([engine, '-no-shell-escape', '-interaction=nonstopmode',
                             '-halt-on-error', '-output-directory', str(folder),
                             str(folder / 'diagram.tex')], cwd=source.parent,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=60)
    (folder / 'compile.log').write_bytes(result.stdout)
    if result.returncode:
        raise RuntimeError(f'Diagram render failed for {source}; see {folder}/compile.log')
    subprocess.run(['pdftoppm', '-singlefile', '-scale-to', '1800', '-png',
                    str(folder / 'diagram.pdf'), str(target.with_suffix(''))],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, timeout=60)
    (folder / 'source.json').write_text(json.dumps({'source': str(source.relative_to(ROOT.parent)),
                                                  'diagramSha256': hashlib.sha256(diagram.encode()).hexdigest()}))
    return target


def prepare_tex(text, source):
    """Replacing drawings before Pandoc lets it retain positions and captions."""
    # Cover artwork is published separately in meta.json, not as a body figure.
    text = re.sub(r'\\begin\{titlepage\}[\s\S]*?\\end\{titlepage\}', '', text)
    def replace(match):
        target = render_tikz(match[0], source)
        return '\\includegraphics{' + str(target) + '}'
    text = TIKZ.sub(replace, text)
    text = re.sub(r'(?<!\\)%[^\n]*', '', text)
    return unwrap_image_boxes(text)
