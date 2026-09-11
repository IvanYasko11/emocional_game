# Emocional Game

Interactive emotional story prototype built with Next.js.

## Story architecture

Story content is organized as `Chapter` objects containing `Scene` objects. Chapters,
scenes, and choices use stable IDs, so new content can be inserted without changing a
player's saved position. A scene advances through `nextSceneId`; the final scene of a
chapter can instead use `nextChapterId` (on either the scene or its chapter).

Progress is stored in browser `localStorage` as `between-us-save-v3` with:

- `version`
- `chapterId` and `sceneId`
- `choices`, keyed by scene ID
- `memories`, `trust`, and `tension`

The client migrates the previous `between-us-save-v2` format on first load. Existing
story content and presentation are unchanged; the new transition model is ready for a
future chapter without adding one in this refactor.

## Run locally

```bash
npm install
npm run dev
```

## Deployment

Optimized for deployment on Vercel with Next.js.
