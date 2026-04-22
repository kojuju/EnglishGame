# English Game - MVP Build Plan

## 1. Recommended Technical Direction

For fast delivery and easy iteration, the recommended stack is:

- Vite
- React
- TypeScript
- simple CSS or Tailwind
- local JSON question bank
- browser localStorage for persistence

This stack is enough for a polished single-player web MVP without backend work.

## 2. MVP Functional Modules

### A. Static data module

Responsible for:

- vocabulary dataset loading
- question source management
- distractor generation basis

### B. Game engine module

Responsible for:

- round start
- question sequencing
- score updates
- combo logic
- life updates
- timer updates
- round end conditions

### C. UI module

Responsible for:

- home page
- in-game page
- result page
- reusable status and option components

### D. Persistence module

Responsible for:

- save high score
- save latest result
- save wrong-word list

## 3. Suggested Project Structure

```text
src/
  data/
    words.json
  components/
    StatusBar.tsx
    QuestionCard.tsx
    OptionButton.tsx
    ResultPanel.tsx
  pages/
    HomePage.tsx
    GamePage.tsx
    ResultPage.tsx
  hooks/
    useGameEngine.ts
  utils/
    question.ts
    scoring.ts
    storage.ts
  types/
    game.ts
  App.tsx
  main.tsx
```

## 4. Minimal Data Structure

Example word entry:

```json
{
  "id": "cet4-001",
  "word": "abandon",
  "meaning": "放弃",
  "partOfSpeech": "v.",
  "difficulty": "easy"
}
```

Example runtime question shape:

```json
{
  "wordId": "cet4-001",
  "prompt": "abandon",
  "correctAnswer": "放弃",
  "options": ["放弃", "获得", "隐藏", "连接"]
}
```

## 5. Milestone Breakdown

### Milestone 1 - Basic framework

- initialize web project
- set up page routing or page-state switching
- prepare basic layout and styles

Exit condition:

- the app opens and can switch between home, game, and result views

### Milestone 2 - Core game flow

- load local words
- generate question set
- answer questions
- calculate score, combo, lives
- finish round on valid end condition

Exit condition:

- a full round can be completed from start to result

### Milestone 3 - Persistence and review

- store high score
- store latest accuracy
- store wrong-word list
- show wrong-word review in result page

Exit condition:

- refresh does not erase key progress data

### Milestone 4 - Polish

- improve feedback animations
- improve button states
- improve mobile layout
- tune copywriting and pacing

Exit condition:

- the product feels coherent and replayable

## 6. Acceptance Criteria for V1

The MVP is complete when:

- the user can start a round from the home page
- the user can answer 10 vocabulary questions
- correct and wrong answers are handled clearly
- score, timer, lives, and combo all work as expected
- the round ends correctly
- the result page shows score, accuracy, and wrong words
- high score persists locally
- the experience works on both desktop and mobile browser sizes

## 7. Open Decisions for Later

These do not block MVP, but should be revisited:

- exact question count per round
- exact timer length
- whether wrong words should immediately reappear in the same round
- whether part of speech should always be shown
- whether example sentences should appear after wrong answers

## 8. Immediate Next Build Order

The practical implementation order should be:

1. create the project skeleton
2. prepare a small CET-4 word dataset
3. implement the game engine
4. build the three main pages
5. add local persistence
6. polish visual feedback

## 9. Suggested First Dataset Size

A good starting point is:

- 120 words total
- 70 easy
- 40 medium
- 10 hard

This is enough to validate gameplay without slowing down development.
