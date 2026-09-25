# STRANGER THINGS — THE HAWKINS CASE

> Interactive mystery / investigation / horror web game
> Platform: Web
> Primary: Desktop
> Secondary: Mobile
> Tech direction: React-first, optionally React + Phaser

---

# 1. Product Vision

## 1.1. Concept

**STRANGER THINGS: THE HAWKINS CASE** là một game điều tra bí ẩn lấy cảm hứng từ không khí:

* Small town mystery
* 1980s
* Supernatural horror
* Missing person
* Secret laboratory
* Parallel dimension
* Investigation
* Puzzle
* Choice
* Consequence

Người chơi không chỉ đọc story.

Người chơi phải:

```text
EXPLORE
  ↓
INVESTIGATE
  ↓
FIND CLUES
  ↓
CONNECT EVIDENCE
  ↓
SOLVE PUZZLES
  ↓
MAKE CHOICES
  ↓
DISCOVER THE TRUTH
  ↓
SURVIVE
```

Mục tiêu là tạo cảm giác:

> "Mình thực sự đang điều tra một vụ án."

Không phải:

* Fan wiki
* Character encyclopedia
* Quiz
* Personality test
* Visual novel thuần túy
* Click từng object để đọc text

---

# 2. Core Gameplay Loop

Gameplay chính:

```text
Enter Location
      ↓
Explore
      ↓
Find Interactive Objects
      ↓
Inspect Objects
      ↓
Collect Clues
      ↓
Solve Puzzle
      ↓
Unlock New Information
      ↓
Connect Evidence
      ↓
Unlock New Location
      ↓
Story Event
      ↓
Choice
      ↓
World State Changes
      ↓
Continue Investigation
```

Ví dụ:

```text
Bedroom
   ↓
Inspect Radio
   ↓
Find Cassette
   ↓
Listen to Cassette
   ↓
Hear "03:17"
   ↓
Inspect Photograph
   ↓
Find Strange Symbol
   ↓
Evidence Board
   ↓
Connect:

Photograph
    ↓
Laboratory
    ↓
Cassette
    ↓
03:17
```

Từ đó mở:

```text
Basement
```

---

# 3. Main Game Screen

UI không nên quá giống dashboard.

Game screen phải ưu tiên **scene**.

```text
┌───────────────────────────────────────────────────────────┐
│ CASE #014                       03:17 AM             ⚙    │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                                                           │
│                      GAME SCENE                           │
│                                                           │
│                  [Bedroom / House]                        │
│                                                           │
│          Radio        Photograph        Window            │
│                                                           │
│                                                           │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ 🔦 INVENTORY        🧩 EVIDENCE        🗺 MAP             │
└───────────────────────────────────────────────────────────┘
```

---

# 4. UI Architecture

UI chia thành 3 layer.

## Layer 1 — Game Scene

Đây là phần lớn nhất.

Chứa:

* Background
* Characters
* Interactive objects
* Doors
* Exits
* Visual effects
* Horror events

---

## Layer 2 — HUD

HUD chỉ hiển thị thông tin cần thiết.

Ví dụ:

```text
CASE #014

03:17 AM
```

Khi danger:

```text
⚡ DANGER

Flashlight ███████░░
Stamina    █████░░░░░
Noise      ████░░░░░░
```

Không nên lúc nào cũng hiển thị tất cả.

---

## Layer 3 — Tools

Bottom navigation:

```text
🔦 Inventory
🧩 Evidence
🗺 Map
```

Có thể mở dưới dạng:

* Drawer
* Side panel
* Bottom sheet

Không nên chuyển route khỏi game.

---

# 5. UI State

UI nên phụ thuộc vào Game State.

Ví dụ:

```js
{
  ui: {
    activePanel: null,
    inspectionTarget: null,
    dialogueOpen: false,
    puzzleOpen: false,
    evidenceBoardOpen: false
  }
}
```

Possible states:

```text
NORMAL
INSPECTING
DIALOGUE
PUZZLE
EVIDENCE_BOARD
MAP
DANGER
CUTSCENE
```

---

# 6. Interactive Object System

Không hiển thị kiểu:

```text
CLICK HERE
CLICK ME
```

Thay vào đó:

* Cursor thay đổi
* Object glow nhẹ
* Animation nhỏ
* Sound
* Highlight khi hover
* Contextual label

Ví dụ:

```text
Radio
  ↓
Hover
  ↓
Small glow
  ↓
Cursor changes
  ↓
Click
  ↓
Inspect
```

---

# 7. Object Schema

Object nên được data-driven.

```js
{
  id: 'radio',
  type: 'INTERACTIVE_OBJECT',

  position: {
    x: 420,
    y: 280
  },

  interactions: [
    {
      type: 'INSPECT',
      eventId: 'inspect-radio'
    }
  ],

  states: {
    default: true,
    poweredOn: false,
    broken: false
  }
}
```

React component không nên chứa story logic.

---

# 8. Inspection Mode

Một số object cần chế độ inspect riêng.

Ví dụ:

```text
┌───────────────────────────────────────────────┐
│                                               │
│              OLD PHOTOGRAPH                   │
│                                               │
│                  [IMAGE]                      │
│                                               │
│            🔍 Zoom       ↔ Pan                │
│                                               │
├───────────────────────────────────────────────┤
│ "Something feels wrong about this photo."    │
└───────────────────────────────────────────────┘
```

Người chơi có thể:

* Zoom
* Pan
* Rotate
* Hover vùng đặc biệt
* Click hidden clue

Ví dụ:

```text
Photograph
    ↓
Zoom
    ↓
Inspect background
    ↓
Find strange symbol
    ↓
ADD_EVIDENCE("lab-symbol")
```

---

# 9. Inventory

Inventory không phải RPG inventory.

Nó là:

> Investigation Kit

Ví dụ:

```text
┌──────────────────────────────┐
│ INVENTORY                    │
├──────────────────────────────┤
│ 📼 Cassette                  │
│ 🔦 Flashlight                │
│ 📷 Photograph                │
│ 🔑 Basement Key              │
│ 📝 Strange Note              │
└──────────────────────────────┘
```

Item có thể:

* Inspect
* Combine
* Use
* Give
* Compare
* Trigger event

---

# 10. Evidence Board

Đây là một trong những UI quan trọng nhất.

Người chơi phải tự kết nối clues.

Ví dụ:

```text
             Photograph
                  │
                  ↓
            Lab Symbol
                  │
                  ↓
              Laboratory
                  │
                  ↓
              Cassette
                  │
                  ↓
                03:17
                  │
                  ↓
           Missing Person
```

UI có thể:

```text
┌────────────────────────────────────────────────────┐
│                 EVIDENCE BOARD                     │
│                                                    │
│   [PHOTO] ───────── [LAB SYMBOL]                  │
│       │                    │                       │
│       │                    ↓                       │
│       └────────────── [LAB]                        │
│                            │                       │
│                            ↓                       │
│                       [03:17]                      │
│                                                    │
│              [Connect Evidence]                    │
└────────────────────────────────────────────────────┘
```

Connection phải có logic.

Ví dụ:

```js
{
  from: 'photograph',
  to: 'lab-symbol'
}
```

Nếu connection đúng:

```text
Evidence connection discovered.
```

Nếu sai:

Không nhất thiết phải hiện:

```text
WRONG!
```

Có thể chỉ:

```text
Nothing seems to connect these.
```

---

# 11. Evidence Schema

```js
{
  id: 'lab-symbol',

  type: 'VISUAL_CLUE',

  title: 'Strange Symbol',

  description:
    'A strange symbol appears in the background of the photograph.',

  discoveredAt: 'house-bedroom',

  tags: [
    'laboratory',
    'supernatural'
  ]
}
```

---

# 12. Map UI

Map không chỉ dùng để navigation.

Map cũng là investigation tool.

```text
             HAWKINS

       🏠 Wheeler House
              │
              │
       🏫 Hawkins High
              │
              │
       🏥 Hawkins Lab
              │
              │
       🌲 Forest
```

Location state:

```text
LOCKED
DISCOVERED
AVAILABLE
DANGER
COMPLETED
```

Ví dụ:

```js
{
  id: 'hawkins-lab',
  state: 'LOCKED'
}
```

Sau khi tìm đủ evidence:

```js
{
  id: 'hawkins-lab',
  state: 'AVAILABLE'
}
```

---

# 13. Dialogue UI

Không biến game thành visual novel.

Dialogue nên xuất hiện trong scene.

```text
┌─────────────────────────────────────────────┐
│                                             │
│                 GAME SCENE                  │
│                                             │
│                                             │
│  Steve                                      │
│  "You really heard something at 3:17?"      │
│                                             │
│  [YES]                                      │
│  [I'M NOT SURE]                             │
│  [CHANGE SUBJECT]                            │
│                                             │
└─────────────────────────────────────────────┘
```

Choice có thể thay đổi:

```js
choices: {
  trustedSteve: true
}
```

---

# 14. Choice System

Choice không nên chỉ thay đổi dialogue.

Choice có thể thay đổi:

* Flags
* Relationships
* Available locations
* Evidence
* Danger
* Ending
* Future events

Ví dụ:

```text
You hear something downstairs.

[OPEN THE DOOR]

[HIDE]

[LEAVE THE HOUSE]
```

Các lựa chọn:

```text
OPEN
→ discover basement
→ danger increases

HIDE
→ discover monster behavior

LEAVE
→ lose evidence
→ future event changes
```

---

# 15. Horror UI

UI itself phải trở thành một phần của horror.

Ví dụ:

Normal:

```text
03:17 AM
```

Sau một event:

```text
03:17 AM
```

Người chơi quay lại:

```text
03:17 AM
```

Sau đó:

```text
03:17 AM
```

Nhưng âm thanh thay đổi.

Sau khi vào Upside Down:

```text
03:17 AM
```

Text có thể:

* Glitch
* Flicker
* Distort
* Shift
* Disappear

Ví dụ:

```text
INVENTORY
```

→

```text
INVENT0RY
```

hoặc:

```text
I N V E N T O R Y
```

Không nên lạm dụng.

---

# 16. Central Game State

Game phải có một Game State trung tâm.

```js
{
  player: {
    location: 'house',
    health: 100,
    stamina: 80
  },

  inventory: [],

  evidence: [],

  connections: [],

  discoveredLocations: [],

  completedPuzzles: [],

  choices: {},

  flags: {},

  objectives: [],

  world: {
    current: 'normal',
    dangerLevel: 0
  },

  story: {
    chapter: 1,
    scene: 'house-bedroom'
  }
}
```

---

# 17. Flags

Flags dùng để lưu các fact quan trọng của story.

```js
{
  foundCassette: true,

  listenedToCassette: true,

  inspectedPhotograph: true,

  openedBasement: false,

  knowsAboutLab: true,

  metDustin: false,

  enteredUpsideDown: false
}
```

Flag không nên được hardcode trực tiếp trong UI.

---

# 18. Objective System

Player không nên bị bắt tự đoán hoàn toàn.

UI có thể hiển thị:

```text
CURRENT OBJECTIVE

Find out what happened
at 03:17 AM.
```

Nhưng internal state có thể phức tạp hơn:

```js
{
  id: 'investigate-0317',

  requirements: [
    'found-cassette',
    'listened-cassette',
    'found-photograph'
  ]
}
```

---

# 19. Scene System

Story nên được chia:

```text
Chapter
  ↓
Scene
  ↓
Interaction
  ↓
Event
  ↓
State Change
  ↓
Next Scene
```

Ví dụ:

```text
Chapter 1
   ↓
House
   ↓
Bedroom
   ↓
Inspect Radio
   ↓
Find Cassette
   ↓
Listen
   ↓
Discover 03:17
```

---

# 20. Scene Schema

```js
{
  id: 'house-bedroom',

  background: 'bedroom.webp',

  objects: [
    'radio',
    'photograph',
    'window'
  ],

  exits: [
    'living-room',
    'hallway'
  ]
}
```

---

# 21. Event System

Đây là phần quan trọng nhất của game engine.

Flow:

```text
PLAYER ACTION
      ↓
EVENT ENGINE
      ↓
CHECK CONDITIONS
      ↓
EXECUTE EFFECTS
      ↓
UPDATE GAME STATE
      ↓
RENDER UI
```

Ví dụ:

```text
Player clicks Photograph

        ↓

Event:
inspect-photograph

        ↓

Check:
inspectedPhotograph == false

        ↓

Effects:

SET_FLAG inspectedPhotograph

ADD_EVIDENCE lab-symbol

UPDATE_OBJECTIVE investigate-0317

        ↓

UI updates
```

---

# 22. Event Schema

```js
{
  id: 'discover-lab-symbol',

  trigger: {
    type: 'INTERACTION',
    target: 'photograph'
  },

  conditions: [
    {
      type: 'FLAG',
      key: 'inspectedPhotograph',
      operator: 'eq',
      value: false
    }
  ],

  effects: [
    {
      type: 'ADD_EVIDENCE',
      evidenceId: 'lab-symbol'
    },

    {
      type: 'SET_FLAG',
      key: 'inspectedPhotograph',
      value: true
    },

    {
      type: 'SET_FLAG',
      key: 'knowsAboutLab',
      value: true
    }
  ]
}
```

---

# 23. Condition Engine

Condition types:

```text
FLAG
ITEM
EVIDENCE
LOCATION
PUZZLE
CHOICE
WORLD
TIME
OBJECT_STATE
```

Ví dụ:

```js
{
  type: 'ITEM',
  itemId: 'basement-key',
  operator: 'contains'
}
```

Hoặc:

```js
{
  type: 'FLAG',
  key: 'knowsAboutLab',
  operator: 'eq',
  value: true
}
```

---

# 24. Effect Engine

Effect types:

```text
ADD_ITEM
REMOVE_ITEM

ADD_EVIDENCE
REMOVE_EVIDENCE

SET_FLAG
UNSET_FLAG

UNLOCK_LOCATION
LOCK_LOCATION

COMPLETE_PUZZLE

START_DIALOGUE
START_SCENE

PLAY_AUDIO
PLAY_EFFECT

CHANGE_WORLD

TRIGGER_DANGER

CHANGE_OBJECT_STATE

UPDATE_OBJECTIVE
```

---

# 25. Puzzle System

Puzzle không nên hardcode trong React component.

Puzzle phải có data riêng.

Supported puzzle types:

```text
CODE
SEQUENCE
AUDIO_DECODING
IMAGE_COMPARISON
MAP_COORDINATES
OBJECT_COMBINATION
TIMELINE
```

---

# 26. Puzzle State

```js
{
  id: 'frequency-puzzle',

  status: 'IN_PROGRESS',

  attempts: 2,

  solved: false,

  input: [],

  solution: [
    '0',
    '3',
    '1',
    '7'
  ]
}
```

Khi solve:

```text
Puzzle solved
      ↓
COMPLETE_PUZZLE
      ↓
SET_FLAG
      ↓
UNLOCK_LOCATION
      ↓
Trigger story event
```

---

# 27. Upside Down System

Upside Down không chỉ là đổi background.

Nó là một **World State**.

```js
{
  world: {
    current: 'normal'
  }
}
```

Hoặc:

```js
{
  world: {
    current: 'upside-down'
  }
}
```

Một location có thể có 2 state:

```js
{
  location: 'house',

  normal: {
    objects: [
      'radio',
      'photo',
      'door'
    ]
  },

  upsideDown: {
    objects: [
      'radio',
      'vine',
      'portal',
      'shadow'
    ]
  }
}
```

---

# 28. World Transition

World transition có thể được trigger bởi:

```text
Story Event
Puzzle
Choice
Time
Danger
Interaction
```

Ví dụ:

```text
Solve Puzzle
      ↓
Lights Flicker
      ↓
Audio Distortion
      ↓
World Transition
      ↓
UPSIDE DOWN
```

---

# 29. Danger System

Danger system không nhất thiết phải là combat.

Có thể gồm:

```text
Monster Detection
Stealth
Hiding
Running
Flashlight
Noise
Stamina
```

Ví dụ:

```js
{
  dangerLevel: 0,

  flashlight: 80,

  stamina: 100,

  noise: 20
}
```

Danger levels:

```text
0 → SAFE

1 → SUSPICIOUS

2 → DANGER

3 → CHASE
```

---

# 30. Example Chase Flow

```text
Player enters basement
        ↓
Noise detected
        ↓
Danger = 1
        ↓
Player hears sound
        ↓
Danger = 2
        ↓
Lights go off
        ↓
Monster appears
        ↓
CHASE
```

Player có thể:

```text
RUN
HIDE
TURN OFF FLASHLIGHT
LOCK DOOR
USE ITEM
```

---

# 31. Choice State

Choice state được lưu riêng.

```js
{
  choices: {
    openedDoor: true,
    trustedCharacter: true,
    tookCassette: false
  }
}
```

Choice có thể ảnh hưởng chapter sau.

Ví dụ:

```text
tookCassette = true

↓

Chapter 2

Character:
"Why did you take that tape?"
```

---

# 32. Multiple Endings

Ending dựa trên Game State.

Ví dụ:

```text
Ending A
Escape

Ending B
Truth Revealed

Ending C
Someone Disappears

Ending D
Upside Down

Ending E
Secret Ending
```

Không nên đơn giản:

```js
if (choice === 'A')
```

Mà dựa trên nhiều state:

```text
Evidence
+
Choices
+
Puzzle Completion
+
Flags
+
Danger
+
World State
```

---

# 33. Secret Ending

Secret ending yêu cầu hidden conditions.

Ví dụ:

```text
Find all hidden evidence
        +
Solve every major puzzle
        +
Discover secret location
        +
Do not lose cassette
        +
Make specific choices
```

Sau đó:

```text
SECRET ENDING UNLOCKED
```

---

# 34. Save System

Game State phải có thể serialize.

```js
{
  version: 1,

  chapter: 1,

  scene: 'house-bedroom',

  player: {},

  inventory: [],

  evidence: [],

  connections: [],

  flags: {},

  choices: {},

  puzzles: {},

  objectives: [],

  locations: [],

  worldState: {},

  endings: []
}
```

Có thể lưu bằng:

```text
localStorage
```

hoặc IndexedDB nếu state lớn.

---

# 35. Story Data Architecture

Story phải tách khỏi React.

Không làm:

```jsx
if (scene === 'bedroom') {
  ...
}
```

với hàng trăm logic.

Nên:

```text
STORY DATA
     ↓
GAME ENGINE
     ↓
GAME STATE
     ↓
REACT UI
```

---

# 36. Recommended Folder Structure

```text
src/

├── app/
│
├── game/
│   │
│   ├── engine/
│   │   ├── gameEngine.js
│   │   ├── conditionEngine.js
│   │   ├── effectEngine.js
│   │   ├── eventEngine.js
│   │   └── sceneEngine.js
│   │
│   ├── state/
│   │   ├── gameState.js
│   │   └── selectors.js
│   │
│   ├── story/
│   │   ├── chapters/
│   │   ├── scenes/
│   │   ├── puzzles/
│   │   ├── evidence/
│   │   └── endings/
│   │
│   └── systems/
│       ├── inventory/
│       ├── dialogue/
│       ├── investigation/
│       ├── danger/
│       ├── audio/
│       └── save/
│
├── components/
│   ├── GameScene/
│   ├── HUD/
│   ├── Inventory/
│   ├── EvidenceBoard/
│   ├── Map/
│   ├── Dialogue/
│   ├── Puzzle/
│   └── Inspection/
│
└── assets/
```

---

# 37. Core Architecture

```text
                    STORY DATA
                        │
                        ↓
                 ┌─────────────┐
                 │ GAME ENGINE │
                 └──────┬──────┘
                        │
          ┌─────────────┴─────────────┐
          ↓                           ↓
 CONDITION ENGINE              EVENT ENGINE
          │                           │
          └─────────────┬─────────────┘
                        ↓
                  GAME STATE
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
     PLAYER           STORY           WORLD
        │               │               │
        └───────────────┼───────────────┘
                        ↓
                    REACT UI
                        │
       ┌────────────────┼─────────────────┐
       ↓                ↓                 ↓
    SCENE           INVENTORY          EVIDENCE
       ↓                ↓                 ↓
   DIALOGUE           PUZZLE              MAP
```

---

# 38. Important Architecture Rule

## UI should NOT decide the story.

Bad:

```jsx
if (hasCassette && clickedRadio) {
  unlockBasement();
}
```

Good:

```text
Player Action
     ↓
Event
     ↓
Condition Engine
     ↓
Effect Engine
     ↓
Game State
     ↓
UI
```

React chỉ render state.

---

# 39. React vs Phaser

## React-only

Phù hợp nếu game chủ yếu là:

* Investigation
* Interactive images
* UI
* Dialogue
* Puzzle
* Evidence board
* Map
* Story

Ưu điểm:

* Dễ phát triển
* Dễ responsive
* Dễ quản lý state
* Dễ build web app

---

## React + Phaser

Nên dùng nếu muốn:

* Character movement
* Sprite
* Collision
* Canvas
* Animation
* Real-time movement
* Monster AI
* Chase sequence

Architecture:

```text
React
 ├── HUD
 ├── Inventory
 ├── Evidence
 ├── Dialogue
 ├── Puzzle
 └── Menus

          ↕

      GAME STATE

          ↕

Phaser
 ├── Scene
 ├── Character
 ├── Monster
 ├── Animation
 ├── Collision
 └── Game Loop
```

Không nên đưa toàn bộ UI vào Phaser.

---

# 40. UX Principles

## Do

* Minimal UI
* Contextual interaction
* Progressive hints
* Strong atmosphere
* Sound-driven feedback
* Meaningful choices
* Hidden clues
* Reusable story engine

## Don't

* Spam modal
* Show every clue immediately
* Constant jumpscare
* Giant HUD
* Excessive text
* Click every pixel
* Hardcode story inside components

---

# 41. Responsive UI

Desktop:

```text
Scene
+
Bottom toolbar
+
Side panels
```

Mobile:

```text
Scene
   ↓
Bottom sheet
   ↓
Inventory
Evidence
Map
```

Evidence board trên mobile có thể:

```text
horizontal scroll
+
pinch zoom
+
drag
```

---

# 42. Game Atmosphere

Game state nên ảnh hưởng visual/audio.

```text
NORMAL
 ↓
SUSPICIOUS
 ↓
DANGER
 ↓
UPSIDE DOWN
```

Ví dụ:

### NORMAL

* Ambient sound
* Stable lighting
* Normal UI

### SUSPICIOUS

* Subtle distortion
* Radio noise
* Flickering light

### DANGER

* Heartbeat
* UI shake
* Darker scene
* Limited visibility

### UPSIDE DOWN

* Heavy distortion
* Different ambient sound
* Organic movement
* Glitching UI
* World changes

---

# 43. Example Full Gameplay

## Chapter 1 — 03:17

```text
START
  ↓
House
  ↓
Bedroom
```

Player sees:

```text
Radio
Photograph
Window
Door
```

---

## Step 1 — Radio

Player inspects radio.

```text
Radio is turned off.

But the speaker produces static.
```

Event:

```text
PLAY_AUDIO
```

---

## Step 2 — Cassette

Player discovers cassette.

```text
ADD_ITEM cassette
SET_FLAG foundCassette = true
```

---

## Step 3 — Listen

Player uses cassette.

Audio:

```text
static...

03:17...

static...
```

State:

```text
SET_FLAG listenedToCassette = true
```

Objective:

```text
Find out what happened at 03:17.
```

---

## Step 4 — Photograph

Player inspects photograph.

Zooms into background.

Finds:

```text
Strange symbol
```

State:

```text
ADD_EVIDENCE lab-symbol
```

---

## Step 5 — Evidence Board

Player opens board.

Clues:

```text
Cassette
03:17
Photograph
Lab Symbol
```

Player connects:

```text
Photograph
     ↓
Lab Symbol
     ↓
Laboratory
```

Correct connection unlocks:

```text
Hawkins Lab
```

---

## Step 6 — Frequency Puzzle

Player discovers radio frequency.

Puzzle:

```text
0 3 1 7
```

Correct input:

```text
0317
```

Puzzle solved.

---

## Step 7 — Basement

Basement unlocks.

Player enters.

Lights flicker.

Audio changes.

Danger:

```text
SAFE
 ↓
SUSPICIOUS
```

---

## Step 8 — Horror Event

Player hears something.

```text
03:17
```

Again.

But the clock is now physically stopped at:

```text
03:17
```

---

## Step 9 — Upside Down

Player turns around.

The room changes.

```text
NORMAL
   ↓
TRANSITION
   ↓
UPSIDE DOWN
```

Game demo ends.

```text
END OF CHAPTER 1
```

---

# 44. MVP

MVP should be small.

## Chapter 1

Include:

```text
House
 ├── Bedroom
 ├── Living Room
 └── Basement
```

Gameplay:

```text
3–5 interactive objects

3–5 clues

1 inventory system

1 evidence board

1 puzzle

1 meaningful choice

1 horror event

1 Upside Down reveal
```

Expected flow:

```text
START

↓

Radio

↓

Cassette

↓

Photograph

↓

03:17

↓

Evidence Board

↓

Frequency Puzzle

↓

Basement

↓

Upside Down

↓

END OF DEMO
```

---

# 45. Phase 2

Add:

```text
Chapter 2
Multiple locations
Character dialogue
Map
More puzzles
Danger system
Save system
Multiple endings
Audio system
Hidden clues
Achievements
```

---

# 46. Phase 3

Full game:

```text
3–5 Chapters

Complex branching

Investigation board

Multiple Upside Down locations

Monster behavior

Replayability

Secret ending

Achievements

Soundtrack

Advanced mobile UX
```

---

# 47. Anti-patterns

## Do NOT build:

### Fan Wiki

```text
Characters
Locations
Episodes
Trivia
```

Không có gameplay.

---

### Quiz

```text
Which character are you?
```

Không đủ chiều sâu.

---

### Pure Visual Novel

Chỉ:

```text
Text
→
Choice
→
Text
```

Không có investigation thật.

---

### Click Everything

```text
Click chair
Click table
Click wall
Click floor
```

Mà không có ý nghĩa.

---

### Jumpscare Simulator

Không nên:

```text
CLICK
→ BOO
```

liên tục.

Horror nên đến từ:

```text
Atmosphere
Sound
Uncertainty
Story
World State
Consequences
```

---

# 48. Data-driven Story

Story nên được định nghĩa bằng data.

Ví dụ:

```js
const events = {
  discoverLabSymbol: {
    trigger: {
      type: 'INTERACTION',
      target: 'photograph'
    },

    conditions: [
      {
        type: 'FLAG',
        key: 'inspectedPhotograph',
        operator: 'eq',
        value: true
      }
    ],

    effects: [
      {
        type: 'ADD_EVIDENCE',
        evidenceId: 'lab-symbol'
      },

      {
        type: 'SET_FLAG',
        key: 'knowsAboutLab',
        value: true
      }
    ]
  }
};
```

Điều này cho phép:

```text
Story Team
    ↓
Data
    ↓
Game Engine
    ↓
Game
```

thay vì phải sửa React component.

---

# 49. Recommended Development Order

Không nên bắt đầu bằng toàn bộ story.

## Step 1

Build:

```text
Game State
```

---

## Step 2

Build:

```text
Scene System
```

---

## Step 3

Build:

```text
Interaction System
```

---

## Step 4

Build:

```text
Event Engine
```

---

## Step 5

Build:

```text
Condition Engine
Effect Engine
```

---

## Step 6

Build:

```text
Inventory
```

---

## Step 7

Build:

```text
Evidence
```

---

## Step 8

Build:

```text
Puzzle
```

---

## Step 9

Build:

```text
Dialogue
Choice
```

---

## Step 10

Build:

```text
World State
Upside Down
Danger
```

---

## Step 11

Build:

```text
Save
Multiple Endings
```

---

# 50. Golden Rule

Architecture nên tuân theo:

```text
STORY DATA
     ↓
GAME ENGINE
     ↓
GAME STATE
     ↓
UI
```

Không phải:

```text
REACT COMPONENT
     ↓
random if/else
     ↓
random state
     ↓
story logic
```

Mục tiêu là tạo một **mini game engine có thể tái sử dụng**, trong đó việc thêm chapter mới chủ yếu là thêm:

```text
Scenes
Events
Conditions
Effects
Puzzles
Evidence
Dialogues
```

chứ không phải viết lại architecture.

---

# 51. Important Product Direction

Nếu mục tiêu cuối cùng là **public/commercial product**, không nên phụ thuộc trực tiếp vào IP của Stranger Things.

Có thể dùng concept này làm prototype:

```text
1980s
+
Small Town
+
Missing Person
+
Secret Experiment
+
Parallel Dimension
+
Supernatural Horror
+
Investigation
```

Sau đó chuyển thành original IP:

```text
Original Town
Original Characters
Original Monster
Original World
Original Story
Original Visual Identity
```

Như vậy architecture/gameplay có thể giữ lại nhưng sản phẩm có thể trở thành một IP riêng.

---

# 52. Final Architecture Summary

```text
                    PLAYER
                      │
                      ↓
                PLAYER ACTION
                      │
                      ↓
                ┌───────────┐
                │   EVENT   │
                │  ENGINE   │
                └─────┬─────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
    CONDITIONS                 EFFECTS
          │                       │
          └───────────┬───────────┘
                      ↓
                 GAME STATE
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
     PLAYER          STORY          WORLD
       │              │              │
       └──────────────┼──────────────┘
                      ↓
                    REACT
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
     SCENE         EVIDENCE       INVENTORY
       │              │              │
       ↓              ↓              ↓
   DIALOGUE         PUZZLE           MAP
       │              │              │
       └──────────────┼──────────────┘
                      ↓
                   PLAYER
```

## Core Principle

> **The player changes the Game State.
> The Game State changes the world.
> The world changes the story.
> The story creates the next player action.**
