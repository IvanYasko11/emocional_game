from pathlib import Path

path = Path('app/lib/miraDirector.ts')
assert path.exists(), 'Mira director missing'
text = path.read_text(encoding='utf-8')
assert 'chooseMiraDirective' in text
assert 'unlock_scene' in text
print('mira-director smoke ok')
