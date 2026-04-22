# English Game - Requirements

## 1. Product Positioning

This project is a lightweight web-based English mini-game for learners with weak CET-4 foundations. The first version focuses on one narrow but high-value ability:

- recognize high-frequency CET-4 vocabulary quickly
- match English words to Chinese meanings with low cognitive load
- build confidence through short, game-like sessions instead of heavy test pressure

The product should feel like a casual level-based game, not a traditional cram-school exercise system.

## 2. Target Users

### Primary users

- CET-4 learners around the 300-point level
- users with weak vocabulary foundations
- users who are easily frustrated by long reading passages or dense grammar study
- users who need a simple way to restart English learning

### User traits

- weak retention for isolated word memorization
- low patience for long explanations
- needs fast feedback and visible progress
- more likely to continue if the experience feels light and rewarding

## 3. Core Goal

The first version should help users reach this practical outcome:

> When seeing a common CET-4 word, the user can quickly identify its likely Chinese meaning.

This is not a full English learning solution. It is a focused entry-point product.

## 4. Non-Goals

The first version should **not** aim to solve:

- full CET-4 exam preparation
- grammar systems
- listening comprehension
- sentence translation
- speaking assessment
- social competition and leaderboard systems

## 5. Product Principles

1. **Low barrier**: users should understand how to play within 5 seconds.
2. **Short sessions**: one round should be short enough to replay immediately.
3. **Fast feedback**: every answer should give instant positive or corrective feedback.
4. **Low frustration**: failure should not feel punishing.
5. **Visible progress**: scores, combo, and review should make improvement obvious.

## 6. MVP Scope

### In scope

- single-player web game
- local-only play, no login
- high-frequency CET-4 vocabulary question bank
- multiple-choice meaning recognition
- score, lives, timer, combo
- end-of-round summary
- wrong-word review
- local high score / simple local progress persistence

### Out of scope

- account system
- cloud sync
- ranking leaderboard
- multiplayer
- voice and listening mode
- image-based vocabulary mode
- complex level map or story mode

## 7. Core Gameplay

Each question presents:

- one English word
- four Chinese meaning options
- one correct answer and three distractors

The player:

- selects the correct meaning before time runs out
- gains score for correct answers
- gains extra reward for consecutive correct answers
- loses life or combo on mistakes

The round ends when:

- the question count is completed, or
- the timer ends, or
- lives drop to zero

## 8. MVP Session Design

Recommended initial values:

- 10 questions per round
- 60 to 90 seconds total round time
- 3 lives
- 4 options per question
- combo bonus after consecutive correct answers

These values should remain configurable in code instead of hardcoded into UI logic.

## 9. Content Scope

The initial vocabulary pool should start small and controllable:

- 100 to 300 CET-4 high-frequency words
- each word includes:
  - word
  - Chinese meaning
  - optional part of speech
  - optional example sentence
  - difficulty tag

Question quality matters more than quantity in V1.

## 10. Success Signals

The first version is successful if users can:

- start a round quickly
- finish a round without confusion
- understand why they were right or wrong
- replay immediately after failure or success
- review wrong words after a round

## 11. Risks and Design Constraints

### Main risks

- boring repetition if distractors are weak
- frustration if timer pressure is too strong
- low retention if only score exists without review
- weak game feel if feedback is too plain

### Constraints

- should run smoothly in browsers on desktop and mobile
- should work fully offline once static assets are loaded
- should avoid heavy backend dependence in V1

## 12. Version Direction After MVP

Possible future directions:

- spelling challenge mode
- mistake-based adaptive question selection
- daily challenge
- stage progression by difficulty
- sentence example reinforcement
- listening mode
