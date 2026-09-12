# BETWEEN US — launch plan

## Product loop

1. **Hook:** a 10-second premise — «Ты когда-нибудь оставался, когда тебя не просили?»
2. **First session:** 12 scenes, three meaningful choices per scene.
3. **Payoff:** the game remembers choices and reveals a differentiated ending.
4. **Replay:** second run uses the first run as context and changes later moments.
5. **Share:** the ending is designed to be shared as a personal result rather than a generic score.
6. **Season loop:** future episodes should reuse the same stable save model and introduce new characters/relationships.

## Healthy engagement principles

The goal is emotional investment, curiosity and narrative attachment — not coercive retention. Do not use fake emergencies, guilt, manipulative notifications, gambling mechanics or pressure to pay.

## Monetization model

Recommended order:

- Free Episode 01.
- Paid Episode 02 / season pass after the player has completed the free story.
- Optional cosmetic profile cards / collectible memory pages.
- Optional supporter purchase with no gameplay advantage.

Do not add a payment SDK until the owner chooses a provider and supplies the required account/keys. Never hard-code secrets into the repository.

## Distribution

Priority:

1. Public web/PWA deployment — fastest path to real users.
2. Telegram Mini App — strong fit for shareable short sessions; requires a bot/app account owned by the publisher.
3. itch.io — good for an early indie audience and feedback.
4. Product Hunt / Reddit / TikTok / Shorts — acquisition experiments after a public URL exists.
5. App stores only after retention is demonstrated; wrapping the web app too early adds cost without proving demand.

## Launch gate

Before public promotion:

- production URL opens on iPhone and Android;
- first run reaches all 12 scenes;
- refresh does not lose progress;
- second run changes based on first-run choices;
- ending share action works;
- no console/build errors;
- analytics is privacy-conscious and uses only the minimum events needed;
- payment is disabled until a real provider/account is configured.

## Minimal event vocabulary

If analytics is added later, keep it small:

- `session_start`
- `scene_view`
- `choice_made`
- `run_completed`
- `replay_started`
- `share_clicked`

Avoid collecting message text, names, contacts or other unnecessary personal data.
