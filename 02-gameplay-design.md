# English Game - Gameplay and Interaction Design

## 1. Experience Summary

The intended player feeling is:

- easy to start
- quick to understand
- satisfying to answer
- worth replaying immediately

The game should use bright and simple feedback, short text blocks, and obvious primary actions.

## 2. Core Loop

The complete loop for V1:

1. enter the home page
2. tap "Start"
3. answer vocabulary meaning questions
4. receive instant feedback
5. continue building combo and score
6. finish the round
7. see result summary and wrong-word review
8. tap "Play Again"

The loop should be short enough to encourage repeated play.

## 3. Page Structure

## Home Page

Purpose:

- explain the game in one glance
- provide a clear start action
- show simple progress data

Suggested modules:

- game title
- short one-line slogan
- start button
- highest score
- latest accuracy
- optional "review wrong words" button

## In-Game Page

Purpose:

- keep the player focused on one decision at a time

Suggested modules:

- top status bar
  - remaining time
  - score
  - lives
  - combo
- current question area
  - large English word
  - optional phonetic symbol or part of speech
- answer options area
  - four large tap-friendly choices
- immediate feedback layer
  - correct / wrong state
  - short explanation if needed

## Result Page

Purpose:

- provide closure and motivate replay

Suggested modules:

- final score
- correct count / total
- accuracy
- highest combo
- encouraging result text
- wrong-word list
- replay button
- back to home button

## 4. Round Rules

Recommended initial rules:

- one round contains 10 questions
- one global countdown controls the whole round
- player starts with 3 lives
- each question has 4 options
- if answer is correct, move to next question after short feedback
- if answer is wrong, subtract one life and reset combo
- if lives reach zero, round ends immediately
- if question list finishes first, round ends as success
- if timer reaches zero, round ends immediately

## 5. Scoring Rules

Suggested scoring:

- correct answer: +100
- consecutive correct bonus:
  - combo 3+: +20
  - combo 5+: +50
  - combo 8+: +100
- wrong answer: no score gain

Design intent:

- reward streaks without making single mistakes feel catastrophic
- let weaker users still earn meaningful scores

## 6. Feedback Design

### Correct feedback

- green highlight
- short positive text such as "Great!" or "Correct!"
- optional combo animation

### Wrong feedback

- red highlight
- show correct meaning immediately
- brief neutral tone, not mocking

### End-of-round feedback

The result copy should encourage replay:

- high accuracy: "Nice run. You're recognizing the words faster."
- medium accuracy: "Good progress. A few more rounds will make these words familiar."
- low accuracy: "You already saw the key words once. Try again and beat this score."

## 7. Difficulty Design

V1 should stay simple, but difficulty still needs light control.

Possible difficulty levers:

- easier words first
- more common distractors later
- shorter total time in later versions
- reuse wrong words more often

For MVP, a safe approach is:

- mixed easy and medium words
- no aggressive time pressure
- stable 4-option format

## 8. Wrong-Word Review

This is one of the most important retention features in V1.

At the end of a round, show:

- the English word
- the correct Chinese meaning
- whether the user answered it wrong

Optional future enhancement:

- let the user replay only the wrong words

## 9. Local Persistence

Recommended local data to store in browser localStorage:

- highest score
- last round score
- latest accuracy
- wrong-word ids
- basic unlocked progress if later added

V1 should not store sensitive or unnecessary personal information.

## 10. Interaction Notes

### Desktop

- keyboard support can be added with keys 1 to 4
- hover state for answer options

### Mobile

- large vertical buttons
- avoid small clickable areas
- keep major information above the fold

## 11. UX Constraints

- no page should require reading long paragraphs
- the answer action should always be visually obvious
- animation should be light and quick
- the next step should always be clear

## 12. Future Interaction Expansions

- level map
- daily sign-in challenge
- limited-time challenge mode
- boss stage using reviewed wrong words
- audio pronunciation button
