# Nura UI/UX — Make It Feel Like a Chatbot

> This is ONLY about UI/UX. No backend, no datasets, no architecture. Just what you need to change on the frontend to make Nura feel like a real chatbot.

---

## The Core Problem Right Now

Your app currently looks like a **form wizard** — separate full-screen pages that replace each other:

````carousel
![Welcome — full page, looks like a landing page, not a chat](C:\Users\Mark Christian Anub\.gemini\antigravity\brain\5eac096c-b96b-4dc3-9375-46efc242caf1\artifacts\screen_welcome.png)
<!-- slide -->
![Concern — full page form with a textarea. Looks like a form, not a conversation.](C:\Users\Mark Christian Anub\.gemini\antigravity\brain\5eac096c-b96b-4dc3-9375-46efc242caf1\artifacts\screen_concern.png)
<!-- slide -->
![Location — another full page. User loses context of what they said before.](C:\Users\Mark Christian Anub\.gemini\antigravity\brain\5eac096c-b96b-4dc3-9375-46efc242caf1\artifacts\screen_location.png)
<!-- slide -->
![Benefits — another full page. Three screens deep, previous answers invisible.](C:\Users\Mark Christian Anub\.gemini\antigravity\brain\5eac096c-b96b-4dc3-9375-46efc242caf1\artifacts\screen_benefits.png)
````

**Why this feels wrong:** When a user says "Masakit ulo ko", then picks "Quezon City", then selects PhilHealth — they can't see their previous answers. Each step feels disconnected. It doesn't feel like a *conversation*.

---

## What It Should Feel Like Instead

Think of it like **Messenger or GCash** — a scrolling chat thread where:
- Nura "asks" a question (left-aligned bubble)
- The user "answers" (right-aligned bubble or inline input)
- The conversation scrolls up as new messages appear
- Previous answers stay visible above

### The Pattern: Conversational UI with Guided Inputs

```
┌─────────────────────────────────┐
│  Nura                     ≡     │  ← sticky header
├─────────────────────────────────┤
│                                 │
│  🟢 Nura                        │
│  ┌──────────────────────┐       │
│  │ Kumusta! Ako si Nura.│       │  ← bot message bubble (left)
│  │ Hindi ako doktor,    │       │
│  │ pero tutulungan      │       │
│  │ kitang malaman kung  │       │
│  │ saan ka pwedeng      │       │
│  │ magpatingin.         │       │
│  └──────────────────────┘       │
│                                 │
│  🟢 Nura                        │
│  ┌──────────────────────┐       │
│  │ Ano ang concern mo?  │       │
│  └──────────────────────┘       │
│                                 │
│  [Masakit ulo] [Lagnat]         │  ← quick-reply chips
│  [Ubo at sipon] [Check-up]     │
│  [Masakit mata] [Skin rash]    │
│                                 │
│          ┌──────────────────┐   │
│          │    Masakit ulo   │   │  ← user reply bubble (right)
│          └──────────────────┘   │
│                                 │
│  🟢 Nura                        │
│  ┌──────────────────────┐       │
│  │ Saan ka ngayon?      │       │
│  │ City o barangay.     │       │
│  └──────────────────────┘       │
│                                 │
│  [Quezon City] [Manila]         │
│  [Cebu City] [Davao]           │
│                                 │
│  ... and so on                  │
│                                 │
├─────────────────────────────────┤
│ [  Type your message...    ] ➤  │  ← sticky input bar at bottom
└─────────────────────────────────┘
```

---

## Exact Screen-by-Screen Changes

### Screen 1: Welcome → Opening Chat Message

**Before:** Full-page hero with big serif headline "Ano ang nararamdaman mo ngayon?" and a CTA button.

**After:** The chat thread starts with Nura introducing herself. No separate "welcome page". The app opens directly to the chat view.

```
What the user sees on first open:
─────────────────────────────────
  Nura
  Hindi doktor. Gabay sa pasilidad at benepisyo.
─────────────────────────────────

  🟢 Nura
  ┌─────────────────────────────┐
  │ Kumusta! Ako si Nura.       │
  │                             │
  │ Hindi ako doktor — pero     │
  │ tutulungan kitang malaman   │
  │ kung saan ka pwedeng        │
  │ magpatingin, anong benefit  │
  │ ang pwede mong gamitin, at  │
  │ ano ang sasabihin mo sa     │
  │ front desk.                 │
  │                             │
  │ Walang account. Walang      │
  │ sine-save.                  │
  └─────────────────────────────┘

  🟢 Nura
  ┌─────────────────────────────┐
  │ Ano ang concern o sintomas  │
  │ mo ngayon?                  │
  └─────────────────────────────┘

  [Masakit ulo] [Lagnat] [Ubo at sipon]
  [Masakit tiyan] [Check-up lang]
  [Masakit mata] [Prenatal check-up]

  ─────────────────────────────
  [ Sabihin ang concern mo... ] ➤
```

**Key changes:**
- No "Magsimula" button. The conversation starts immediately.
- The disclaimer is part of Nura's first message, not a separate block.
- Concern chips appear inline as quick-reply suggestions.
- A text input bar sits at the bottom (like a real chat app).

---

### Screen 2: Concern Submitted → Ask Location

When the user taps a chip OR types something and hits send:

```
  ... (previous messages scroll up) ...

  🟢 Nura
  ┌─────────────────────────────┐
  │ Ano ang concern o sintomas  │
  │ mo ngayon?                  │
  └─────────────────────────────┘

                ┌───────────────┐
                │  Masakit ulo  │  ← user bubble (right, darker color)
                └───────────────┘

  🟢 Nura
  ┌─────────────────────────────┐
  │ Okay, noted.                │
  │ Saan ka ngayon? Para        │
  │ mahanap ko ang malapit na   │
  │ pasilidad.                  │
  └─────────────────────────────┘

  [📍 Gamitin location ko]
  [Quezon City] [Manila] [Cebu City]
  [Davao City] [Caloocan] [Makati]

  ─────────────────────────────
  [ City o barangay...        ] ➤
```

**Key changes:**
- User's answer appears as a RIGHT-ALIGNED bubble.
- Nura acknowledges the answer ("Okay, noted") then asks the next question.
- The previous concern is still visible if the user scrolls up.
- Location chips appear as quick-replies.
- GPS button ("📍 Gamitin location ko") is a prominent chip.

---

### Screen 3: Location Submitted → Ask Benefits

```
                ┌───────────────┐
                │  Quezon City  │
                └───────────────┘

  🟢 Nura
  ┌─────────────────────────────┐
  │ Got it — Quezon City.       │
  │                             │
  │ May benefit ka ba? Piliin   │
  │ lahat ng applicable.        │
  │ Okay lang kung wala.        │
  └─────────────────────────────┘

  ┌─ Piliin ang benefit mo: ────┐
  │ ☐ PhilHealth               │
  │ ☐ YAKAP                    │
  │ ☐ Senior Citizen           │
  │ ☐ PWD                      │
  │ ☐ 4Ps                      │
  │ ☐ PhilCare HMO             │
  │ ───────────────────────    │
  │ ☐ Wala / hindi sure        │
  └────────────────────────────┘
  [ Hanapin ang pasilidad ➤ ]
```

**Key changes:**
- Benefits appear as an INLINE CARD inside the chat thread (not a separate page).
- The card has checkboxes just like your current BenefitScreen.
- A submit button is right below the card.
- The user can scroll up and see their entire conversation history.

---

### Screen 4: Loading → Typing Indicator

```
                ┌───────────────────┐
                │ ☑ PhilHealth      │
                └───────────────────┘

  🟢 Nura
  ┌──────────┐
  │ •  •  •  │  ← animated typing dots (Nura is "thinking")
  └──────────┘

  Hinahanap ang mga pasilidad
  para sa masakit ulo
  sa Quezon City...
```

**Key changes:**
- No full-page loading screen. Just a small "typing indicator" bubble on the left (like when someone is typing in Messenger).
- The animated dots (●●●) are inside a small bubble.
- A subtitle below explains what's happening.

---

### Screen 5: Results → Facility Cards in Chat

```
  🟢 Nura
  ┌─────────────────────────────┐
  │ Base sa concern mo at       │
  │ location, ito ang           │
  │ rekomenda ko:               │
  └─────────────────────────────┘

  ┌─ UNANG REKOMENDA ───────────┐
  │                             │
  │ Batasan Hills YAKAP         │
  │ Primary Care Clinic         │
  │                             │
  │ Batasan Road, Brgy Batasan  │
  │ Hills, Quezon City          │
  │ 1.2 km · Lun-Biy 8AM-5PM   │
  │                             │
  │ ┃ Pumunta dito para sa      │
  │ ┃ masakit ulo. PhilHealth   │
  │ ┃ YAKAP — Libreng           │
  │ ┃ konsultasyon at gamot     │
  │                             │
  │ DALHIN MO                   │
  │ PhilHealth ID o MDR, valid  │
  │ government ID               │
  │                             │
  │ SASABIHIN MO SA FRONT DESK  │
  │ "Gusto ko pong magpa-FPE    │
  │ at magpa-empanel sa YAKAP.  │
  │ First time ko po."          │
  │                             │
  │ [  Buksan sa Google Maps ↗] │
  │ [  Kopyahin ang address   ] │
  └─────────────────────────────┘

  ┌─ IBA PANG PWEDE ────────────┐
  │ East Avenue Medical Center  │
  │ 3.8 km          Tingnan ↗  │
  │─────────────────────────────│
  │ Novaliches Health Center    │
  │ 5.1 km          Tingnan ↗  │
  └─────────────────────────────┘

  🟢 Nura
  ┌─────────────────────────────┐
  │ Hindi ito medical advice.   │
  │ Kung lumala, pumunta agad   │
  │ sa Emergency Room o tumawag │
  │ sa 911.                     │
  │                             │
  │ May iba pa bang tanong?     │
  └─────────────────────────────┘

  ─────────────────────────────
  [ Mag-tanong pa...          ] ➤
```

**Key changes:**
- Facility cards appear INSIDE the chat thread as rich cards.
- Keep your existing PrimaryRecommendation and AlternateRow components — just render them inside the chat flow.
- Nura's final message asks "May iba pa bang tanong?" — this is what makes it feel like a chatbot, the conversation can continue.
- The input bar stays at the bottom, ready for follow-up.

---

### Screen 6: Follow-Up

If user types "Ano pa ang pwede kong gawin?" or "May iba pa ba?":

```
                ┌───────────────────────┐
                │ Ano pa ang pwede kong │
                │ gawin?               │
                └───────────────────────┘

  🟢 Nura
  ┌─────────────────────────────┐
  │ Pwede ka ring pumunta sa    │
  │ pinakamalapit na barangay   │
  │ health center — libre ang   │
  │ konsultasyon kahit walang   │
  │ PhilHealth.                 │
  │                             │
  │ Gusto mo bang mag-search    │
  │ ulit sa ibang lugar o       │
  │ ibang concern?              │
  └─────────────────────────────┘

  [Mag-search ulit] [Iba pang tanong]
```

---

## The Components You Need to Build/Change

### New Components:

| Component | What it does |
|---|---|
| `ChatThread.tsx` | The main scrollable container that holds all messages. Replaces your current screen-switching in `App.tsx`. |
| `BotBubble.tsx` | Left-aligned message bubble with Nura's avatar. Takes `children` so you can put text, cards, chips inside. |
| `UserBubble.tsx` | Right-aligned message bubble showing the user's answer. |
| `QuickReplies.tsx` | Row of tappable chip buttons that appear below a bot message. Disappear after user picks one. |
| `ChatInput.tsx` | Sticky bottom bar with text input + send button. Like Messenger. |
| `TypingIndicator.tsx` | The animated "●●●" bubble shown while waiting for results. |
| `BenefitPickerCard.tsx` | Inline card with checkboxes that appears inside the chat thread. Replaces the full-page BenefitScreen. |

### Components to KEEP (just render inside chat):

| Component | Change |
|---|---|
| `PrimaryRecommendation` | Keep exactly as-is. Render inside the ChatThread after results load. |
| `AlternateRow` | Keep exactly as-is. Render inside a card below the primary. |
| `AppShell` | Keep the header. Remove the full-height flex layout since content now scrolls. |
| `EmergencyScreen` | Keep as full-page takeover. Emergency is the ONE case where you break out of the chat. |

### Components to REMOVE:

| Component | Why |
|---|---|
| `WelcomeScreen` | Replaced by Nura's opening message in the chat thread. |
| `ConcernScreen` | Replaced by a bot bubble + quick replies + chat input. |
| `LocationScreen` | Replaced by a bot bubble + quick replies + chat input. |
| `BenefitScreen` | Replaced by a bot bubble + inline BenefitPickerCard. |
| `LoadingScreen` | Replaced by TypingIndicator bubble. |
| `ResultsScreen` | Replaced by facility cards rendered inline in chat thread. |

---

## Visual Design Rules for the Chat UI

### Message Bubbles

```css
/* Bot bubble (Nura) — left aligned */
.bot-bubble {
  background: #FFFFFF;           /* card white */
  border: 1px solid #DDE3E7;    /* paper-edge */
  border-radius: 2px 12px 12px 12px;  /* sharp top-left corner = "from bot" */
  padding: 14px 16px;
  max-width: 85%;
  margin-left: 0;
}

/* User bubble — right aligned */
.user-bubble {
  background: #0E2A3F;          /* seal navy */
  color: #FFFFFF;
  border-radius: 12px 2px 12px 12px;  /* sharp top-right = "from user" */
  padding: 12px 16px;
  max-width: 75%;
  margin-left: auto;            /* push right */
}
```

### Quick Reply Chips

```css
/* Quick replies below a bot message */
.quick-reply {
  border: 1.5px solid #0E2A3F;  /* seal */
  border-radius: 20px;          /* pill shape */
  padding: 8px 16px;
  font-size: 0.9375rem;
  color: #0E2A3F;
  background: transparent;
  cursor: pointer;
  transition: all 150ms;
}

.quick-reply:active {
  background: #0E2A3F;
  color: #FFFFFF;
  transform: scale(0.96);
}
```

### Chat Input Bar

```css
/* Sticky bottom input */
.chat-input-bar {
  position: sticky;
  bottom: 0;
  background: #FFFFFF;
  border-top: 1px solid #DDE3E7;
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  display: flex;
  gap: 8px;
  align-items: center;
}

.chat-input {
  flex: 1;
  border: 1.5px solid #DDE3E7;
  border-radius: 24px;
  padding: 10px 16px;
  font-size: 0.9375rem;
  outline: none;
}

.chat-input:focus {
  border-color: #0E2A3F;
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0E2A3F;
  color: white;
  border: none;
  display: grid;
  place-items: center;
}
```

### Typing Indicator

```css
.typing-dots {
  display: inline-flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #697682;
  animation: typingBounce 1.4s ease-in-out infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
```

---

## How the Chat State Machine Changes

Your current `useNura` hook tracks a `screen` state. For the chatbot UI, you switch to tracking a **message list**:

```typescript
type MessageType =
  | "bot-text"        // Nura says something
  | "bot-ask-concern" // Nura asks concern (shows chips + input)
  | "bot-ask-location"
  | "bot-ask-benefits"
  | "bot-typing"      // typing indicator
  | "bot-results"     // facility cards
  | "user-text";      // user's answer

type ChatMessage = {
  id: string;
  type: MessageType;
  content: string;             // text content
  chips?: string[];            // quick reply options (if any)
  facilities?: Facility[];     // for results message
  benefits?: BenefitProfile;   // for benefits picker
  timestamp: number;
};

// The state becomes a growing list:
type NuraState = {
  messages: ChatMessage[];
  currentInput: string;
  isWaitingForBenefits: boolean;  // special state for inline picker
  selectedBenefits: BenefitProfile;
  isLoading: boolean;
};
```

### How the flow works:

```
1. App mounts
   → Add bot message: "Kumusta! Ako si Nura..."
   → Add bot message: "Ano ang concern mo?" (with concern chips)
   → Input bar is active

2. User taps chip or types + sends
   → Add user message: "Masakit ulo"
   → Chips disappear (they were used)
   → Add bot message: "Okay, noted. Saan ka ngayon?" (with location chips)

3. User taps location chip or types
   → Add user message: "Quezon City"
   → Add bot message: "Got it. May benefit ka ba?" 
   → Add inline benefits picker card
   → Input bar changes to "Hanapin" button

4. User selects benefits + taps submit
   → Add user message: "PhilHealth"
   → Add typing indicator (●●●)
   → Call API

5. API returns
   → Remove typing indicator
   → Add bot message: "Ito ang rekomenda ko:"
   → Add results cards (PrimaryRecommendation + AlternateRows)
   → Add bot message: "May iba pa bang tanong?"
   → Input bar is active again for follow-up
```

---

## Scroll Behavior (Important!)

The chat must **auto-scroll to the latest message** when a new one appears. This is what makes it feel like a real chat:

```typescript
// Inside your ChatThread component:
const bottomRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages.length]);

// At the end of the message list:
<div ref={bottomRef} />
```

---

## Animation Timing

Each new message should fade/slide in with a slight stagger:

```css
.message-enter {
  animation: messageSlideIn 250ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

When Nura sends multiple messages (like intro + question), stagger them:
- Message 1: appears immediately
- Message 2: appears after 400ms delay
- Chips: appear after 200ms after last message

This makes it feel like Nura is "typing" each message, not dumping everything at once.

---

## Emergency — The One Exception

When emergency keywords are detected, **break out of the chat entirely**. Your current `EmergencyScreen` is already correct — full-screen red takeover with "Tumawag sa 911".

Don't try to show the emergency inside a chat bubble. Emergency is too important to be a small left-aligned message. Keep it as a full-screen interrupt.

---

## What the Final App.tsx Looks Like (Conceptually)

```tsx
export default function App() {
  const isOnline = useOnlineStatus();
  const [state, actions] = useNuraChat(); // renamed hook

  // Emergency is still full-screen takeover
  if (state.isEmergency) {
    return <EmergencyScreen onDismiss={actions.dismissEmergency} />;
  }

  return (
    <AppShell showHeader={true}>
      <OfflineBanner isOnline={isOnline} />
      
      {/* The entire conversation */}
      <ChatThread>
        {state.messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} actions={actions} />
        ))}
        
        {state.isLoading && <TypingIndicator />}
        
        <div ref={scrollAnchorRef} />
      </ChatThread>

      {/* Sticky bottom input */}
      <ChatInput
        value={state.currentInput}
        onChange={actions.setInput}
        onSend={actions.sendMessage}
        disabled={state.isLoading}
        placeholder="Sabihin ang concern mo..."
      />
    </AppShell>
  );
}
```

---

## Build Order (UI/UX Only)

> [!IMPORTANT]
> Do these in this exact order. Each step builds on the previous one.

### Step 1: Build the chat shell (1-2 hours)
- [ ] Create `ChatThread.tsx` — a scrollable `<div>` with `overflow-y: auto` and `flex: 1`
- [ ] Create `BotBubble.tsx` — left-aligned bubble with Nura avatar dot
- [ ] Create `UserBubble.tsx` — right-aligned navy bubble
- [ ] Create `ChatInput.tsx` — sticky bottom bar with input + send button
- [ ] Modify `App.tsx` to render ChatThread + ChatInput instead of screen switching

### Step 2: Convert the intro + concern flow (1-2 hours)
- [ ] On mount, push 2 bot messages: intro + "Ano ang concern mo?"
- [ ] Create `QuickReplies.tsx` — row of pill chips
- [ ] When user taps chip or types + sends: push user bubble, push next bot question
- [ ] Auto-scroll to bottom on new message

### Step 3: Convert location + benefits (1-2 hours)
- [ ] Push bot bubble asking location (with location chips)
- [ ] After location answered, push bot bubble + `BenefitPickerCard.tsx` inline
- [ ] BenefitPickerCard is your existing checkboxes wrapped in a card inside the thread
- [ ] Submit button on the picker triggers the API call

### Step 4: Convert loading + results (1-2 hours)
- [ ] Create `TypingIndicator.tsx` — animated dots in a small bot bubble
- [ ] After API returns, remove typing indicator, push results as cards in the chat
- [ ] Render `PrimaryRecommendation` and `AlternateRow` inline
- [ ] Push final bot message: "May iba pa bang tanong?"

### Step 5: Add follow-up support (30 min)
- [ ] After results, the input bar stays active
- [ ] If user types something, push their message + typing indicator
- [ ] Send a new API call (or mock response)
- [ ] Push new bot reply

### Step 6: Polish animations (30 min)
- [ ] Add `messageSlideIn` animation to each new message
- [ ] Add staggered delay for consecutive bot messages
- [ ] Add `active:scale-96` to all chips and buttons
- [ ] Add typing indicator bounce animation

---

## Quick Reference: Before vs After

| Aspect | Before (Form Wizard) | After (Chatbot) |
|---|---|---|
| Layout | Full-page screens that replace each other | Scrolling message thread |
| User's answers | Invisible after moving to next screen | Visible as bubbles in the thread |
| Nura's questions | Page headings (h2) | Left-aligned chat bubbles |
| Input method | Textarea on each page | Persistent bottom input bar + chips |
| Loading | Full-page spinner | Small typing indicator bubble |
| Results | Full-page card layout | Cards embedded in chat thread |
| Follow-up | Only "Mag-search ulit" | Free-text input for more questions |
| Feel | Government form | Talking to a helpful assistant |

---

## Feature: Embedded Map Preview (Patient View)

> [!IMPORTANT]
> Instead of only a "Buksan sa Google Maps" button, the primary facility card should show a **live map preview** with the facility pinned. The user still gets the button to open full navigation.

### How it looks inside the chat:

```
  ┌─ UNANG REKOMENDA ───────────┐
  │                             │
  │ Batasan Hills YAKAP         │
  │ Primary Care Clinic         │
  │                             │
  │ Batasan Road, Brgy Batasan  │
  │ Hills, Quezon City          │
  │ 1.2 km · Lun-Biy 8AM-5PM   │
  │                             │
  │ ┌───────────────────────┐   │
  │ │                       │   │
  │ │    🗺️ MAP PREVIEW      │   │  ← embedded map with pin
  │ │       📍              │   │
  │ │                       │   │
  │ └───────────────────────┘   │
  │                             │
  │ ┃ Pumunta dito para sa      │
  │ ┃ masakit ulo. PhilHealth   │
  │ ┃ YAKAP — Libreng           │
  │ ┃ konsultasyon at gamot     │
  │                             │
  │ DALHIN MO                   │
  │ PhilHealth ID o MDR, valid  │
  │ government ID               │
  │                             │
  │ SASABIHIN MO SA FRONT DESK  │
  │ "Gusto ko pong magpa-FPE    │
  │ at magpa-empanel sa YAKAP.  │
  │ First time ko po."          │
  │                             │
  │ [ 🧭 Directions — Maps  ↗ ] │  ← opens Google Maps navigation
  │ [  Kopyahin ang address   ] │
  └─────────────────────────────┘
```

### How the map works (two options):

**Option A — OpenStreetMap embed (FREE, no API key):**
```tsx
// New component: MapPreview.tsx
function MapPreview({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const bbox = `${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="mt-4 overflow-hidden rounded-form border border-paper-edge">
      <iframe
        title={`Map: ${name}`}
        src={src}
        width="100%"
        height="180"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
```
- ✅ Completely free, no API key
- ✅ Works immediately
- ⚠️ Looks a bit plain compared to Google Maps

**Option B — Google Maps Embed (needs API key):**
```tsx
function MapPreview({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // Graceful fallback: if no API key, show OpenStreetMap instead
  if (!apiKey) {
    const bbox = `${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
    return (
      <div className="mt-4 overflow-hidden rounded-form border border-paper-edge">
        <iframe title={`Map: ${name}`} src={src} width="100%" height="180"
          style={{ border: 0 }} loading="lazy" />
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`;
  return (
    <div className="mt-4 overflow-hidden rounded-form border border-paper-edge">
      <iframe title={`Map: ${name}`} src={src} width="100%" height="180"
        style={{ border: 0 }} loading="lazy" allowFullScreen />
    </div>
  );
}
```

**Environment variable (if using Google Maps):**
```env
# In frontend/.env
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

### Where to extract lat/lng from:

Your `maps_url` already contains coordinates:
```
https://maps.google.com/?q=14.6869,121.0857
```

Parse them:
```typescript
function extractLatLng(mapsUrl: string): { lat: number; lng: number } | null {
  const match = mapsUrl.match(/q=([-\d.]+),([-\d.]+)/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
}
```

### Where MapPreview renders inside PrimaryRecommendation:

Place it **after** the address/hours line and **before** the benefit explanation:
```
  facility name
  address
  1.2 km · hours
  ┌─────────────┐
  │  MAP HERE   │  ← MapPreview component
  └─────────────┘
  ┃ benefit explanation
  DALHIN MO ...
  SASABIHIN MO ...
  [ Directions ↗ ]
```

### Fallback when no coordinates available:

If `maps_url` is missing or can't be parsed, show a static placeholder:
```tsx
{coords ? (
  <MapPreview lat={coords.lat} lng={coords.lng} name={facility.name} />
) : (
  <div className="mt-4 flex h-[120px] items-center justify-center rounded-form
    border border-dashed border-paper-edge bg-paper text-meta text-ink-mute">
    Walang available na mapa para sa pasilidad na ito.
  </div>
)}
```

### "Directions" button replaces old "Buksan sa Google Maps":

```tsx
<a
  href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
  target="_blank"
  rel="noreferrer"
  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2
    rounded-form bg-seal px-5 text-body-lg font-semibold text-card
    transition-colors hover:bg-seal-press active:bg-seal-press"
>
  🧭 Directions — Google Maps ↗
</a>
```

This opens Google Maps with **turn-by-turn directions** from the user's current location to the facility. Much more useful than just showing the pin.

---

## Feature: Multilingual / Dialect Mode

### Language selector in the header:

Add a small dropdown or pill row in the `AppShell` header, right-aligned:

```
┌─────────────────────────────────┐
│ 🟢 Nura                        │
│ Hindi doktor.     [🌐 Filipino ▾] │  ← language selector
├─────────────────────────────────┤
```

### Supported modes:

| Mode | Label shown | What it does |
|---|---|---|
| `auto` | 🌐 Auto | Backend detects language from user's input, responds in same language |
| `fil` | Filipino | All Nura responses in Filipino/Tagalog |
| `ceb` | Cebuano | Nura responds in Cebuano/Bisaya |
| `ilo` | Ilocano | Nura responds in Ilocano |
| `hil` | Hiligaynon | Nura responds in Hiligaynon |
| `en` | English | Nura responds in English |

### Component: LanguageSelector.tsx

```tsx
const LANGUAGE_OPTIONS = [
  { code: "auto", label: "Auto", icon: "🌐" },
  { code: "fil",  label: "Filipino" },
  { code: "ceb",  label: "Cebuano" },
  { code: "ilo",  label: "Ilocano" },
  { code: "hil",  label: "Hiligaynon" },
  { code: "en",   label: "English" },
] as const;

type LanguageCode = typeof LANGUAGE_OPTIONS[number]["code"];

function LanguageSelector({
  value,
  onChange,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
}) {
  const current = LANGUAGE_OPTIONS.find((o) => o.code === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LanguageCode)}
      className="rounded-stamp border border-paper-edge bg-card px-2 py-1
        font-mono text-label text-ink-soft focus:border-seal focus:outline-none"
      aria-label="Piliin ang wika"
    >
      {LANGUAGE_OPTIONS.map((opt) => (
        <option key={opt.code} value={opt.code}>
          {opt.icon ?? ""} {opt.label}
        </option>
      ))}
    </select>
  );
}
```

### How it connects to the flow:

1. Store `selectedLanguage` in the `useNuraChat` state
2. Save to `localStorage` so it persists across sessions
3. Pass it in the `ChatRequest` to the backend:
   ```typescript
   type ChatRequest = {
     session_id: string;
     message: string;
     location?: string;
     benefits?: BenefitProfile;
     language?: string;  // ← add this field
   };
   ```
4. Backend passes it to Gemini's system prompt:
   `"Respond in {language}. If 'auto', detect from user's message."`
5. For the **mock/demo version**, the UI copy stays in Filipino but the `reply` field in mock responses can show the selected language label

### Where to render in AppShell:

```tsx
<header className="px-5 pb-3 pt-5">
  <div className="flex items-center gap-3">
    <img src="/logo-mark.png" alt="Nura" ... />
    <div className="min-w-0 flex-1">
      <h1 ...>Nura</h1>
      <p ...>Hindi doktor. Gabay sa pasilidad at benepisyo.</p>
    </div>
    {/* NEW: Language selector, right-aligned */}
    <LanguageSelector value={language} onChange={setLanguage} />
  </div>
  <div className="mt-4 h-px w-full bg-paper-edge" />
</header>
```

### Hackathon MVP approach:

> [!TIP]
> For the demo, you do NOT need to translate every UI string. The **Gemini response** adapts to the language. The fixed UI elements (button labels, chip text) stay in Filipino — that's fine. The important thing is that Nura's **reply text** and the **"what to say at front desk"** adapt to the user's chosen dialect.

---

## Feature: Offline Last Care Pass

### What it is:

After Nura gives a recommendation, the app **auto-saves** it locally. If the user loses internet or reopens the app later, they can tap a button to see their **last saved recommendation** — like a "digital referral slip" they carry with them.

### How it looks:

Add a small link in the header (visible only when a saved pass exists):

```
┌─────────────────────────────────┐
│ 🟢 Nura            📋 Last Pass │  ← tap to view saved pass
│ Hindi doktor.     [🌐 Auto ▾]  │
├─────────────────────────────────┤
```

When tapped, it opens an inline card in the chat (or a small modal):

```
  ┌─ 📋 LAST CARE PASS ────────────┐
  │                                │
  │ Na-save: April 26, 2026 5:30 AM │
  │                                │
  │ CONCERN                        │
  │ Masakit ulo                    │
  │                                │
  │ REKOMENDANG PASILIDAD          │
  │ Batasan Hills YAKAP Primary    │
  │ Care Clinic                    │
  │                                │
  │ ADDRESS                        │
  │ Batasan Road, Brgy Batasan     │
  │ Hills, Quezon City             │
  │                                │
  │ DALHIN MO                      │
  │ PhilHealth ID o MDR, valid     │
  │ government ID                  │
  │                                │
  │ SASABIHIN MO SA FRONT DESK     │
  │ "Gusto ko pong magpa-FPE at    │
  │ magpa-empanel sa YAKAP."       │
  │                                │
  │ [ 🧭 Directions ↗ ]            │
  │                                │
  │ Hindi ito medical advice.      │
  └────────────────────────────────┘

  [✕ Isara] [🗑️ Burahin ang pass]
```

### Data shape (saved to localStorage):

```typescript
type CarePass = {
  // What the user asked
  concern: string;
  location: string;
  benefitsSummary: string;   // e.g. "PhilHealth"

  // The recommendation
  facilityName: string;
  facilityAddress: string;
  whatToBring: string | null;
  whatToSay: string | null;
  benefitToClaim: string | null;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;

  // The explanation from Nura
  explanation: string;

  // Meta
  savedAt: number;           // Date.now() timestamp
  dataSource: string;        // "YAKAP", "MALASAKIT", etc.
};
```

### Storage functions (expand existing storage.ts):

```typescript
const CARE_PASS_KEY = "nura.care_pass";

export function saveCarePass(pass: CarePass): void {
  try {
    localStorage.setItem(CARE_PASS_KEY, JSON.stringify(pass));
  } catch {
    // silently fail
  }
}

export function getCarePass(): CarePass | null {
  try {
    const raw = localStorage.getItem(CARE_PASS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CarePass;
  } catch {
    return null;
  }
}

export function clearCarePass(): void {
  try {
    localStorage.removeItem(CARE_PASS_KEY);
  } catch {
    // silently fail
  }
}
```

### When to save:

Auto-save when results arrive (inside `useNuraChat`):
```typescript
// After API returns and results are pushed to chat:
if (response.facilities.length > 0) {
  const primary = response.facilities[0];
  const coords = primary.maps_url ? extractLatLng(primary.maps_url) : null;

  saveCarePass({
    concern: currentConcern,
    location: currentLocation,
    benefitsSummary: formatBenefits(currentBenefits),
    facilityName: primary.name,
    facilityAddress: primary.address,
    whatToBring: primary.what_to_bring ?? null,
    whatToSay: primary.what_to_say ?? null,
    benefitToClaim: primary.benefit_to_claim ?? null,
    mapsUrl: primary.maps_url ?? null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    explanation: response.reply,
    savedAt: Date.now(),
    dataSource: primary.data_source,
  });
}
```

### How offline access works:

1. User gets a recommendation → care pass auto-saved
2. User closes app or loses internet
3. User reopens app → header shows "📋 Last Pass" link
4. User taps → saved recommendation shown as a card
5. The Google Maps **directions link** still works offline (opens the Maps app)
6. All data is local — nothing needs a network call

### Component: CarePassCard.tsx

```tsx
function CarePassCard({
  pass,
  onClose,
  onClear,
}: {
  pass: CarePass;
  onClose: () => void;
  onClear: () => void;
}) {
  const savedDate = new Date(pass.savedAt).toLocaleString("fil-PH", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  return (
    <article className="rounded-block border-hair border-paper-edge bg-card">
      <div className="flex items-center gap-2 border-b border-paper-edge px-5 py-2">
        <span className="font-mono text-label uppercase text-seal">
          📋 Last Care Pass
        </span>
        <span className="ml-auto font-mono text-label text-ink-mute">
          {savedDate}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="font-mono text-label uppercase text-ink-soft">Concern</p>
          <p className="text-body text-ink">{pass.concern}</p>
        </div>

        <div>
          <p className="font-mono text-label uppercase text-ink-soft">
            Rekomendang Pasilidad
          </p>
          <p className="font-display text-title text-ink">{pass.facilityName}</p>
          <p className="text-body text-ink-soft">{pass.facilityAddress}</p>
        </div>

        {pass.whatToBring && (
          <div>
            <p className="font-mono text-label uppercase text-ink-soft">Dalhin Mo</p>
            <p className="text-body text-ink">{pass.whatToBring}</p>
          </div>
        )}

        {pass.whatToSay && (
          <div>
            <p className="font-mono text-label uppercase text-ink-soft">
              Sasabihin Mo sa Front Desk
            </p>
            <blockquote className="font-display text-body-lg italic text-ink">
              {pass.whatToSay}
            </blockquote>
          </div>
        )}

        {pass.mapsUrl && (
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${pass.lat},${pass.lng}`}
            target="_blank" rel="noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2
              rounded-form bg-seal px-5 text-body font-semibold text-card">
            🧭 Directions ↗
          </a>
        )}
      </div>

      <div className="flex gap-2 border-t border-paper-edge px-5 py-3">
        <button onClick={onClose}
          className="flex-1 rounded-form border border-paper-edge px-3 py-2
            text-body font-semibold text-ink">
          Isara
        </button>
        <button onClick={onClear}
          className="rounded-form px-3 py-2 text-meta text-ink-mute
            hover:text-stamp">
          🗑️ Burahin
        </button>
      </div>

      <p className="px-5 py-2 text-meta text-ink-mute">
        Hindi ito medical advice. Gabay lang sa pasilidad at benepisyo.
      </p>
    </article>
  );
}
```

### Important constraints:

- ❌ No medical diagnosis claims — all wording says "gabay" / "guidance"
- ❌ No over-engineering — just localStorage, no IndexedDB or service worker cache
- ✅ Graceful: if localStorage is full or unavailable, silently fail
- ✅ The care pass expires after 7 days (add expiry check in `getCarePass`)
- ✅ Only the LAST recommendation is saved (not a history)

---

## Updated Build Order (with new features)

> [!IMPORTANT]
> Steps 1-6 remain the same as above. Add these after:

### Step 7: Add MapPreview to facility card (1 hour)
- [ ] Create `MapPreview.tsx` with OpenStreetMap iframe (free, no key)
- [ ] Add `extractLatLng()` helper to parse coordinates from `maps_url`
- [ ] Render MapPreview inside `PrimaryRecommendation` after address line
- [ ] Add graceful fallback when no coordinates available
- [ ] Change "Buksan sa Google Maps" → "🧭 Directions" (opens directions mode)
- [ ] Optional: add `VITE_GOOGLE_MAPS_KEY` env var support for Google embed

### Step 8: Add Language Selector (30 min)
- [ ] Create `LanguageSelector.tsx` with dropdown
- [ ] Add `language` state to `useNuraChat`, save to localStorage
- [ ] Render selector in `AppShell` header (right-aligned)
- [ ] Pass `language` field in `ChatRequest` to backend
- [ ] For mock mode: append language label to mock reply text

### Step 9: Add Offline Care Pass (1 hour)
- [ ] Add `CarePass` type and `saveCarePass` / `getCarePass` / `clearCarePass` to storage.ts
- [ ] Auto-save care pass when results arrive
- [ ] Add "📋 Last Pass" link in AppShell header (shown only when pass exists)
- [ ] Create `CarePassCard.tsx` component
- [ ] Show care pass as inline card in chat when tapped
- [ ] Add "Isara" and "Burahin" buttons
- [ ] Test offline: disable network in DevTools, reopen app, tap Last Pass

---

## One Last Thing: Keep What's Working

> [!TIP]
> You do NOT need to rewrite everything. Your existing components are reusable:

- `PrimaryRecommendation` → render inside the chat thread after results
- `AlternateRow` → render inside a card after the primary
- `BenefitRow` → use inside `BenefitPickerCard`
- `EmergencyScreen` → keep as full-screen takeover (unchanged)
- All your Tailwind tokens (seal, paper, ink) → keep using them
- `mockData.ts` → keep using it, the API interface doesn't change
- `useSessionId`, `useOnlineStatus` → keep as-is
- Emergency keyword detection → keep as-is, just add dialect keywords later

The change is in **how you arrange these components** (chat thread vs. separate pages), not in rebuilding them from scratch.
