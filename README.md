# Repro Builder

Isolation testing for product managers.

A vague bug report is several guesses stacked into one sentence. "The export doesn't
work on my phone" claims that the export failed, that the phone is the reason, and that
it happens every time. Any of those can be wrong, and an engineer is an expensive way to
find out which.

Paste the complaint in the reporter's own words. Repro Builder returns:

- **An isolation matrix.** Rows are test runs, columns are the variables in play, and
  exactly one cell is filled per row. Change one thing between runs and the result means
  something. Change two and it means nothing.
- **A run script.** Every run states what it changes, what it holds fixed, the steps to
  follow, and what each outcome tells you.
- **Questions for the reporter**, split into what to ask before testing and what to ask
  only if testing is inconclusive, alongside a list of things to look up yourself rather
  than ask.
- **A verdict.** One of three: confirmed bug, spec gap, or expected behaviour the user
  disliked. The tree maps each observable outcome to one of them, and the current call
  comes with a confidence level and what would overturn it.
- **Two drafts**: a reply to the reporter and a handoff note for engineering, if it gets
  that far.

## The three verdicts

| Verdict | What it means | Who acts |
| --- | --- | --- |
| Confirmed bug | There was a clear expectation, stated or obvious, and the product missed it | Engineering |
| Spec gap | The product behaves as built because nobody decided what it should do | Product, before any code |
| Expected behaviour the user disliked | It works as designed and the reporter wanted something else | Nobody, beyond recording the signal |

## Running it locally

```bash
npm install
npm run dev
```

Then open the address Vite prints.

## The API key

The app calls the Anthropic Messages API directly from the browser using a key the
viewer pastes into the form. Nothing is stored: the key lives in React state for as long
as the tab is open and is sent nowhere except `api.anthropic.com`. There is no server, no
environment variable and no key committed to this repo.

Three saved runs ship with the app as fixed, hand-written text, so anyone can read a
complete worked example without a key of their own.

## Where the output comes from

A language model reads the complaint text and writes the plan from that alone. It has no
access to the product, the logs or the users, so everything it produces is a hypothesis
to test rather than a finding. The app says this on the page as well as here.

## Built with

React, Vite, and the Anthropic Messages API. No component library.

Part of the [daily AI builds](https://github.com/kakkarprerna/daily-ai-builds) series.
