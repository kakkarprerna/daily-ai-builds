# Cost-of-Error Estimator

A small tool for product managers to work out which AI failures are actually worth fixing first.

You describe your product and list the ways your AI gets things wrong, roughly how often each one happens. Claude estimates a realistic cost per incident for each category and ranks them by monthly exposure, so the list tells you where to put your evaluation and guardrail effort rather than guessing.

Part of a series of small AI-product tools built to explore trust, evaluation, and governance problems that come up when shipping AI features.

## How it works

The app calls the Anthropic API directly from your browser using an API key you provide. There's no backend and nothing is stored anywhere except your own browser. The estimates come from Claude reading the context and categories you type in; they aren't pulled from any real support or billing data, so treat the ranking as a prioritisation tool rather than an audited number.

## Running it locally

```bash
npm install
npm run dev
```

Open the local address Vite prints (usually `http://localhost:5173`), paste in an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/settings/keys), and try it with the pre-filled example or your own categories.

A note on the key: because this is a static site with no server, the key lives only in your browser's `localStorage` and is sent only to Anthropic's API. That's fine for a personal demo you run yourself, but don't share a deployed copy of this app with other people using your own key; anyone who opens their browser's network tab can see it. If you want to hand this to someone else, have them use their own key.

## Deploying to GitHub Pages

The repo is set up with the `gh-pages` package.

```bash
npm run deploy
```

This builds the app and pushes `dist/` to a `gh-pages` branch. Then, in the repo's Settings → Pages, set the source to the `gh-pages` branch.

`vite.config.js` sets `base: '/cost-of-error-estimator/'`, which matches a project page at `username.github.io/cost-of-error-estimator`. If you rename the repo, or you're deploying to a custom domain or a user page, change `base` to match (`/` for a custom domain or user page).

## Stack

React + Vite, styled with plain CSS, icons from `lucide-react`. No backend, no build-time secrets, no analytics.
