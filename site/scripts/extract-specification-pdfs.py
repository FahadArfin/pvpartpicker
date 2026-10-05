"""Extract candidate table rows; collection still requires exact model/variant matching.

Usage: python scripts/extract-specification-pdfs.py CACHE_DIRECTORY
Requires pdfplumber. No OCR guesses are used. Keep raw PDFs in the ignored cache.
"""
import json, re, sys, subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import pdfplumber

root = Path(sys.argv[1])
index = json.loads((root / 'pdf-index.json').read_text(encoding='utf8'))
worker = '--document' in sys.argv
selected = sys.argv[sys.argv.index('--document') + 1] if worker else None
results = {}
def extract(doc):
    target = root / 'pdf' / (Path(doc['filename']).stem + '.json')
    if target.exists():
        return json.loads(target.read_text(encoding='utf8'))
    try:
        texts, rows = [], []
        with pdfplumber.open(root / 'pdf' / doc['filename']) as pdf:
            # Specification sheets are normally short. Large manuals need a reviewed page selection.
            if len(pdf.pages) > 120:
                return {**doc, 'rows': [], 'text': '', 'error': 'manual_exceeds_120_pages'}
            for page in pdf.pages:
                text = page.extract_text() or ''
                texts.append(text)
                if len(pdf.pages) > 16 and not re.search(r'(?im)^\s*(?:(?:technical|general|electrical)\s+)?(?:specifications?|technical data)\b', text):
                    continue
                for table in page.extract_tables():
                    for row in table:
                        cells = [re.sub(r'\s+', ' ', c or '').strip() for c in row]
                        if 2 <= len(cells) <= 16 and 1 < len(cells[0]) < 120 and all(len(c) < 400 for c in cells):
                            rows.append(cells)
                layout = page.extract_text(layout=True) or ''
                for line in layout.splitlines():
                    cells = [c.strip() for c in re.split(r'\s{2,}', line.strip()) if c.strip()]
                    if 2 <= len(cells) <= 16 and 1 < len(cells[0]) < 120 and all(len(c) < 400 for c in cells):
                        rows.append(cells)
        value = {**doc, 'text': '\n'.join(texts), 'rows': rows}
        target.write_text(json.dumps(value, ensure_ascii=False), encoding='utf8')
        return value
    except Exception as error:
        print(json.dumps({'file': doc['filename'], 'error': str(error)}, ensure_ascii=True))
        return None

if worker:
    doc = next(d for d in index['documents'] if d['filename'] == selected)
    value = extract(doc)
    target = root / 'pdf' / (Path(doc['filename']).stem + '.json')
    if value and not target.exists():
        target.write_text(json.dumps(value, ensure_ascii=False), encoding='utf8')
else:
    def bounded(doc):
        target = root / 'pdf' / (Path(doc['filename']).stem + '.json')
        if target.exists():
            return doc
        failure = root / 'pdf' / (Path(doc['filename']).stem + '.failure.json')
        if failure.exists() and '--retry-failures' not in sys.argv:
            return doc
        try:
            subprocess.run([sys.executable, __file__, str(root), '--document', doc['filename']], timeout=25, capture_output=True, check=True)
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, OSError):
            (root / 'pdf' / (Path(doc['filename']).stem + '.failure.json')).write_text(json.dumps({'url': doc['url'], 'error': 'extraction_timeout_or_failure'}), encoding='utf8')
        return doc
    with ThreadPoolExecutor(max_workers=4) as pool:
        for i, doc in enumerate(pool.map(bounded, index['documents'])):
            target = root / 'pdf' / (Path(doc['filename']).stem + '.json')
            if target.exists():
                results[doc['url'].split('?')[0]] = json.loads(target.read_text(encoding='utf8'))
            (root / 'pdf-extraction-progress.json').write_text(json.dumps({'checked': i + 1, 'total': len(index['documents']), 'extracted': len(results)}), encoding='utf8')
    (root / 'pdf-tables.json').write_text(json.dumps(results, ensure_ascii=False), encoding='utf8')
    (root / 'pdf-extraction-failures.json').write_text(json.dumps([json.loads(p.read_text(encoding='utf8')) for p in (root / 'pdf').glob('*.failure.json')]), encoding='utf8')
    print(json.dumps({'extracted': len(results)}))
