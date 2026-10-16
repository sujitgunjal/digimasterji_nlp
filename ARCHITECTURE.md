# DigiMasterJi system architecture

This page is the execution map of DigiMasterJi. Read the diagrams from top to bottom. Each number is one step the system actually takes.

DigiMasterJi is a multilingual STEM tutor. A parent or teacher has one account and creates a profile for each learner. The learner types a question. The backend searches uploaded textbook pages, then asks Gemma (through Ollama) to answer in that learner's language. The same textbook text is later used to build quizzes. Scores update XP and the study streak.

```mermaid
flowchart LR
  Browser["Browser<br/>React app"]
  API["FastAPI<br/>auth, profiles, chat, quizzes, admin"]
  Mongo[("MongoDB<br/>digimasterji")]
  Embed["MiniLM<br/>turns text into a 384-number vector"]
  Ollama["Ollama<br/>gemma3:31B-cloud"]

  Browser -->|"JWT on every call"| API
  API --> Mongo
  API --> Embed
  API --> Ollama
  Embed --> API
  Ollama --> API
```

| Piece | Role in the flow |
| --- | --- |
| React app | Screens for sign-in, profiles, chat, quizzes, progress, and textbook upload |
| FastAPI | Checks the token, runs the step, and returns JSON |
| MongoDB | Stores accounts, profiles, chats, quizzes, and textbook chunks |
| MiniLM | Builds the vector used to find similar textbook chunks |
| Ollama / Gemma | Writes the tutor reply and the quiz questions |

Two tokens are used. The **master token** belongs to the parent or teacher and can manage profiles and textbooks. The **profile token** belongs to one learner and is required for chat and quizzes, so one child cannot open another child's chats.

---

## 1. From the landing page to a lesson

```mermaid
flowchart TD
  S1["1. Open the landing page<br/>React, React Router, Tailwind"] --> S2{"2. Already signed in?<br/>master JWT in localStorage"}
  S2 -->|No| S3["3. Register or sign in<br/>React form, Axios"]
  S3 --> S4["4. Check the password<br/>and return a master token<br/>FastAPI, bcrypt, python-jose JWT"]
  S2 -->|Yes| S5["5. Profile picker<br/>React, Axios GET /profiles"]
  S4 --> S5
  S5 --> S6{"6. Learner profile exists?<br/>MongoDB profiles"}
  S6 -->|No| S7["7. Create profile<br/>name, age, grade, language<br/>FastAPI, Pydantic, Motor"]
  S7 --> S8["8. Choose that profile<br/>React"]
  S6 -->|Yes| S8
  S8 --> S9["9. Return a profile token<br/>for this learner only<br/>python-jose JWT"]
  S9 --> S10{"10. What next?"}
  S10 -->|Ask a question| Chat["Ask a question<br/>continues in the next diagram"]
  S10 -->|Practice| Quiz["Practice<br/>continues in the next diagram"]
  S10 -->|See progress| Progress["See progress<br/>continues in the next diagram"]
  S10 -->|Add a textbook| Upload["Add a textbook<br/>continues in the next diagram"]
```

Registration stores a bcrypt password hash in `users`. Sign-in returns an access token and a refresh token. The browser keeps both and asks for a new access token before the old one expires. Choosing a profile calls `POST /profiles/{id}/access` and stores the profile token. Chat and quiz requests send that profile token.

---

## 2. Ask a question

This continues the **Ask a question** branch. One PDF must already be in the knowledge base, or step 8 has no textbook text to attach.

```mermaid
flowchart TD
  C1["1. Learner types a question<br/>React chat page"] --> C2["2. Start a thread when needed<br/>Axios POST /chat/sessions<br/>FastAPI, profile JWT"]
  C2 --> C3["3. Send the message<br/>Axios POST /chat/id/message<br/>FastAPI"]
  C3 --> C4["4. Save the learner message<br/>Motor, MongoDB messages"]
  C4 --> C5["5. Load the last 10 turns<br/>Motor, MongoDB messages"]
  C5 --> C6["6. Turn the question into a vector<br/>sentence-transformers MiniLM<br/>384 numbers"]
  C6 --> C7["7. Find similar textbook chunks<br/>MongoDB Atlas vector search<br/>index vector_index"]
  C7 --> C8["8. Keep the top 5 chunks<br/>with score at least 0.3<br/>Python chat service"]
  C8 --> C9["9. Build the prompt<br/>profile, chunks, history, question<br/>Python"]
  C9 --> C10["10. Write the reply<br/>Ollama, gemma3:31B-cloud"]
  C10 --> C11{"11. Stream the reply?<br/>Server-Sent Events"}
  C11 -->|Yes| C12["Send tokens as they are produced<br/>FastAPI streaming response"]
  C11 -->|No| C13["Return the full reply<br/>JSON"]
  C12 --> C14["12. Save the tutor message<br/>and the chunk ids used<br/>Motor, MongoDB messages"]
  C13 --> C14
  C14 --> C15["13. Show the reply<br/>react-markdown"]
  C15 --> C16["14. Name the thread from the<br/>first question<br/>React"]
```

Step 9 puts four things in the prompt:

1. The learner's name, age, grade, and preferred language. Gemma is told to answer in that language, in simple steps, with an everyday example.
2. The textbook chunks kept in step 8, trimmed to about 1,500 tokens.
3. The recent messages from step 5.
4. The new question.

If step 8 keeps nothing, Gemma still answers, but the prompt has no textbook passage to follow.

---

## 3. Practice

This continues the **Practice** branch. A quiz is created on a schedule, or the learner builds one from a chapter. Both paths end on the same answer screen.

```mermaid
flowchart TD
  Q0["Learner opens Quizzes<br/>React, React Router, Axios"] --> Q1{"How is the quiz created?"}

  Q1 -->|Nightly job| Q2["1a. At midnight, load every profile<br/>APScheduler, Motor"]
  Q2 --> Q3{"Quiz already stored for today?<br/>MongoDB quizzes"}
  Q3 -->|Yes| Q4["Skip this profile"]
  Q3 -->|No| Q5["1b. Read recent chats<br/>Motor, MongoDB messages"]
  Q5 --> Q6["1c. Write 5 questions from those chats<br/>Ollama, gemma3:31B-cloud<br/>or a general STEM quiz if there are no chats"]

  Q1 -->|Learner presses generate| Q7["2a. Pick a subject<br/>React"]
  Q7 --> Q8["2b. List chapters for that subject<br/>Axios GET /quizzes/chapters<br/>FastAPI, MongoDB knowledge_base"]
  Q8 --> Q9["2c. Pick one chapter PDF<br/>React"]
  Q9 --> Q10["2d. Load that chapter's chunks<br/>POST /quizzes/generate<br/>Motor"]
  Q10 --> Q11["2e. Write questions that stay on those chunks<br/>Ollama, gemma3:31B-cloud<br/>Pydantic checks the JSON"]

  Q6 --> Q12["3. Save the quiz as pending<br/>Motor, MongoDB quizzes"]
  Q11 --> Q12
  Q12 --> Q13["4. Open the quiz<br/>React QuizTakePage<br/>Axios GET /quizzes/id"]
  Q13 --> Q14["5. Submit the chosen options<br/>Axios POST /quizzes/id/submit<br/>FastAPI"]
  Q14 --> Q15["6. Compare each choice<br/>with the stored correct option<br/>Python"]
  Q15 --> Q16["7. Mark the quiz completed<br/>store the score, add XP<br/>Motor, MongoDB quizzes and profiles"]
  Q16 --> Q17["8. Update the streak<br/>when today's quiz is finished<br/>MongoDB profiles"]
```

The midnight job also runs once about a minute after the server starts, unless `SKIP_STARTUP_QUIZ` is set. A quiz has 5 to 10 multiple-choice questions. Each question stores the correct option. The learner's choice is written onto the question at submit time.

---

## 4. See progress

This continues the **See progress** branch. XP and the streak were written when a quiz was submitted. This page reads them and draws the level.

```mermaid
flowchart TD
  P1["1. Open Progress from chat<br/>React Router /progress<br/>profile JWT still required"] --> P2["2. Read the active profile<br/>React ProfileContext<br/>name, avatar, XP, streak"]
  P2 --> P3["3. Compute the level in the browser<br/>level = XP / 100 + 1<br/>bar shows XP toward the next level"]
  P3 --> P4["4. Show the streak counter<br/>React, days on the profile"]
  P4 --> P5["5. Show achievement badges<br/>fixed list in the page<br/>unlocked or locked"]
  P5 --> P6["6. Request the leaderboard<br/>Axios GET /leaderboard<br/>scope family or global"]
  P6 --> P7{"7. Leaderboard response ok?"}
  P7 -->|Yes| P8["Show name, streak, and XP<br/>for each rank<br/>React"]
  P7 -->|No| P9["Show placeholder rows<br/>so the page still renders<br/>React"]
```

---

## 5. Add a textbook

This continues the **Add a textbook** branch. Chat and chapter quizzes can use a chapter only after this flow stores it. One PDF is one chapter. The parent or teacher uses the master token, not the learner token.

```mermaid
flowchart TD
  U1["1. Open Admin and choose a PDF<br/>React, AdminLayout"] --> U2["2. Add subject, language, and tags<br/>React form"]
  U2 --> U3["3. Upload the file<br/>Axios multipart POST /admin/upload<br/>FastAPI, master JWT"]
  U3 --> U4{"4. File is a non-empty PDF?<br/>FastAPI"}
  U4 -->|No| U5["Stop and return an error<br/>HTTP 400"]
  U4 -->|Yes| U6["5. Read the text on each page<br/>PyMuPDF"]
  U6 --> U7["6. Split the text<br/>about 500 tokens, 50-token overlap<br/>tiktoken"]
  U7 --> U8["7. Embed every chunk<br/>sentence-transformers MiniLM<br/>384 numbers"]
  U8 --> U9["8. Save each chunk<br/>text, subject, language, tags,<br/>file name, order, vector<br/>Motor, MongoDB knowledge_base"]
  U9 --> U10["9. List the file or try a search<br/>React, Axios<br/>same Atlas vector index as chat"]
  U10 --> U11["10. Delete removes every chunk<br/>with that file name<br/>Axios DELETE, Motor"]
```

Search from the admin screen uses the same vector index as the tutor. It is a way to check that a chapter can be found before a learner asks about it.

---

## 6. Where each step writes

```mermaid
flowchart LR
  subgraph Actions
    A1["Register / sign in<br/>FastAPI, bcrypt, JWT"]
    A2["Create or edit a profile<br/>FastAPI, Pydantic, Motor"]
    A3["Upload a PDF<br/>PyMuPDF, tiktoken, MiniLM"]
    A4["Send a chat message<br/>MiniLM, Atlas, Ollama"]
    A5["Generate or submit a quiz<br/>APScheduler, Ollama, Motor"]
  end

  subgraph Collections["MongoDB database: digimasterji"]
    users["users"]
    profiles["profiles"]
    kb["knowledge_base"]
    conv["conversations"]
    msg["messages"]
    quizzes["quizzes"]
  end

  A1 --> users
  A2 --> profiles
  A3 --> kb
  A4 --> conv
  A4 --> msg
  A4 -.->|"read similar chunks"| kb
  A5 --> quizzes
  A5 -->|"add XP and streak"| profiles
  A5 -.->|"read chapter text"| kb
```

| Collection | What one record holds |
| --- | --- |
| `users` | Parent or teacher account and password hash |
| `profiles` | Learner name, age, grade, language, XP, streak, badges |
| `knowledge_base` | One textbook chunk, its labels, and its 384-number vector |
| `conversations` | One chat thread: title, subject, message count |
| `messages` | One turn: who spoke, the text, and which chunks were used |
| `quizzes` | Questions, correct answers, status, score, XP, and date |

Atlas needs a vector index named `vector_index` on `knowledge_base.vector_embedding`. Without that index, step 7 of the chat flow cannot find textbook pages.
