from pathlib import Path
import re

s = Path('app/page.tsx').read_text()

required_markers = [
    'REPLAY_MEMORY_PATCH_V1',
    'REPLAY_BRANCH_PATCH_V1',
    'PRODUCT_ENDINGS_V1',
    'REPLAY_SAVE_FIX_V1',
    'DEEP_CONSEQUENCES_V1',
    'STORY_EXPANSION_V1',
]
for marker in required_markers:
    if marker not in s:
        raise SystemExit(f'Missing marker: {marker}')

for scene_id in [f'scene-{n:02d}-' for n in range(1, 13)]:
    if scene_id not in s:
        raise SystemExit(f'Missing first-pass scene prefix: {scene_id}')

for scene_id in [f'replay-{n:02d}-' for n in range(1, 7)]:
    if scene_id not in s:
        raise SystemExit(f'Missing replay scene prefix: {scene_id}')

for choice_id in ['replay-05-choice-01', 'replay-05-choice-02', 'replay-05-choice-03']:
    if choice_id not in s:
        raise SystemExit(f'Missing replay ending choice: {choice_id}')

if 'previousChoices?: Record<string, string>;' not in s:
    raise SystemExit('Save schema lost previousChoices')
if 'previousChoices: replayPreviousChoices' not in s:
    raise SystemExit('Fresh-run persistence lost previousChoices')

ids = re.findall(r"id: '([^']+)'", s)
if len(ids) != len(set(ids)):
    raise SystemExit('Duplicate content IDs detected')

print(f'Smoke test passed: {len(ids)} unique content IDs.')
