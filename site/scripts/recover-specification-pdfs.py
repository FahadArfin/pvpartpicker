"""Recover timed-out cached PDFs using PyMuPDF; exact-model guards still apply.

Usage: python scripts/recover-specification-pdfs.py CACHE_DIRECTORY
Requires pymupdf. No network, OCR, or estimates. Long manuals retain specification
pages only. Review transcriptions visually before declaring ratings verified.
"""
import json, re, sys
from pathlib import Path
import pymupdf

root = Path(sys.argv[1])
index = json.loads((root / 'pdf-index.json').read_text(encoding='utf8'))
tables = json.loads((root / 'pdf-tables.json').read_text(encoding='utf8'))
recovered = []
for doc in index['documents']:
    key = doc['url'].split('?')[0]
    path = root / 'pdf' / doc['filename']
    if key in tables or not path.exists():
        continue
    try:
        with pymupdf.open(path) as pdf:
            if len(pdf) > 120:
                continue
            texts, rows = [], []
            for page in pdf:
                text = page.get_text()
                texts.append(text)
                if len(pdf) > 16 and not re.search(r'(?im)^\s*(?:(?:technical|general|electrical)\s+)?(?:specifications?|technical data)\b', text):
                    continue
                lines = {}
                for word in page.get_text('words'):
                    lines.setdefault(round(word[1] / 3) * 3, []).append(word)
                for words in lines.values():
                    cells, last = [], None
                    for word in sorted(words, key=lambda w: w[0]):
                        if last is None or word[0] - last > 14:
                            cells.append(word[4])
                        else:
                            cells[-1] += ' ' + word[4]
                        last = word[2]
                    if 2 <= len(cells) <= 16 and all(len(c) < 400 for c in cells):
                        rows.append(cells)
            value = {**doc, 'text': '\n'.join(texts), 'rows': rows, 'extractor': 'pymupdf-recovery'}
            (root / 'pdf' / (path.stem + '.json')).write_text(json.dumps(value, ensure_ascii=False), encoding='utf8')
            tables[key] = value
            recovered.append({'url': doc['url'], 'pages': len(pdf), 'rows': len(rows)})
    except Exception as error:
        recovered.append({'url': doc['url'], 'error': type(error).__name__})
(root / 'pdf-tables.json').write_text(json.dumps(tables, ensure_ascii=False), encoding='utf8')
(root / 'recovery-pass.json').write_text(json.dumps(recovered, indent=2), encoding='utf8')
print(json.dumps({'recovered': len([r for r in recovered if 'error' not in r]), 'extracted': len(tables)}))
