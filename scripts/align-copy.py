from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()
replacements = {
    '~ 8 минут · 6 сцен': '~ 15–20 минут · 12 сцен',
    '8 минут · 6 сцен': '15–20 минут · 12 сцен',
    '8 минут. Несколько разных последствий.': '15–20 минут. Несколько разных последствий.',
}
changed = False
for old, new in replacements.items():
    if old in s:
        s = s.replace(old, new)
        changed = True
p.write_text(s)
print('Copy aligned.' if changed else 'Copy already aligned.')
