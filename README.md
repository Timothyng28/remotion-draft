# VideoGraph

<div align="center">

**_Think Visually, Explore Infinitely_**

[![Website](https://img.shields.io/badge/website-videograph.tech-blue)](https://www.videograph.tech)
[![HackPrinceton](https://img.shields.io/badge/HackPrinceton-Fall%202025-orange)](https://devpost.com/software/videograph)

_An AI-powered educational platform that transforms curiosity into interactive, personalized learning journeys through dynamically generated video content._

</div>

---

## 💡 Inspiration

VideoGraph reimagines how people learn complex topics—not through static textbooks or pre-recorded lectures, but as **interactive journeys** that adapt to each person's understanding in real-time. We wanted to empower learners to **explore knowledge organically**, giving them the freedom to ask questions, dive deeper, and have AI create personalized explanations exactly when they need them.

Our goal: educational videos that **respond, adapt, and grow** with you, creating a truly infinite learning experience that feels as natural as a conversation with a teacher.

---

## 🌟 Features

### 🎥 Dynamic Video Generation

- Generate fully animated educational videos from simple text prompts
- **Manim-powered animations** with graphs, vectors, molecules, and more
- **AI-generated voiceovers** perfectly synchronized with visuals
- Real-time rendering progress via Server-Sent Events

### 🌳 Interactive Learning Tree

- Each video becomes a **node** in your personal knowledge graph
- **Ask follow-up questions** to create new branches
- Navigate through your learning journey visually
- Infinite exploration—never hit a dead end

### 🧠 Adaptive Intelligence

- **Context-aware generation** that remembers what you've learned
- **Difficulty adaptation** based on your performance
- **Personalized remediation** when you need extra help
- Smart branching logic (questions → children, topics → siblings)

### 🔍 Semantic Search

- Find concepts by **meaning**, not just keywords
- Vector embedding-powered search (<50ms response time)
- Search "how graphs work" and find "Introduction to Trees"

### 📊 Interactive Quizzes

- **Contextual quizzes** at the end of learning branches
- Instant feedback and comprehension evaluation
- Automatic remediation videos for incorrect answers

### 💾 Cached Sessions

- Explore pre-generated learning paths
- Example topics: Pythagoras Theorem, Photosynthesis, and more
- Visual thumbnails and AI-generated titles for easy navigation

---

## 🏗️ Tech Stack

### Frontend

- **React** + **TypeScript** + **Vite**
- **@xyflow/react** for interactive tree visualization
- **TailwindCSS** for styling
- **Remotion** for video composition

### Backend

- **FastAPI** on **Modal** (serverless compute)
- **Python** for orchestration and processing
- **Manim Community Edition** for animation rendering
- **Google Cloud Storage** for asset caching

### AI & ML

- **Google Gemini** for content generation and code synthesis
- **Cerebras** for fast simple calls
- **Grok (xAI)** for auxiliary tasks
- **Sentence Transformers** for semantic embeddings
- **PyTorch** for ML operations

### Services

- **ElevenLabs** for text-to-speech
- **Docker** for containerization
- Real-time streaming via **SSE** (Server-Sent Events)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (3.10+)
- **Modal** account ([modal.com](https://modal.com))
- API keys for:
  - Google Gemini
  - ElevenLabs
  - Google Cloud Storage

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/videograph.git
cd videograph

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp env.template .env
# Edit .env with your API keys

# Start the development server
npm run dev

# In a separate terminal, deploy the backend
cd ../backend/modal
modal deploy main_video_generator.py
```

For detailed setup instructions, see:

- [QUICK_START.md](./QUICK_START.md)
- [Frontend Setup Guide](./frontend/SETUP.md)

---

## 📖 How It Works

### 1. **Ask a Question**

Type any question or topic you're curious about.

### 2. **AI Generation**

- **Gemini** creates a structured lesson plan
- Generates custom **Manim animation code**
- **ElevenLabs** synthesizes synchronized voiceover
- Multiple sections rendered in parallel on **Modal**

### 3. **Watch & Explore**

- View kinetic, video-essay style animations
- See your learning tree grow in real-time
- Click any node to revisit previous concepts

### 4. **Branch Infinitely**

- Ask follow-up questions at any point
- Take quizzes to test your understanding
- Get personalized help when you need it

### 5. **Search & Navigate**

- Use semantic search to find related concepts
- Browse cached sessions for inspiration
- Export or share your learning journey

---

## 📁 Project Structure

```
videograph/
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/    # UI components (tree, overlays, etc.)
│   │   ├── controllers/   # Video controller logic
│   │   ├── services/      # API clients
│   │   └── remotion/      # Video rendering components
│   └── public/            # Static assets
├── backend/
│   └── modal/             # FastAPI + Modal backend
│       ├── dev/           # Core logic modules
│       │   ├── api_logic.py
│       │   ├── generator_logic.py
│       │   └── reflection_logic.py
│       └── services/      # Shared services
│           ├── llm/       # LLM provider abstractions
│           ├── tts/       # Text-to-speech services
│           └── embeddings.py
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

---

## 🧩 Key Features Explained

### Infinite Branching System

Every user interaction is mapped to a tree structure:

- **Child nodes**: Follow-up questions that dive deeper
- **Sibling nodes**: Related topics at the same level
- **Persistent state**: Tree survives page refreshes
- **Concurrent generation**: Ask multiple questions while videos render

See [CACHED_SESSIONS_GUIDE.md](./CACHED_SESSIONS_GUIDE.md) for details.

### Code Healing Pipeline

AI-generated Manim code can fail unpredictably. Our healing system:

1. **Captures** error traces and render failures
2. **Analyzes** what went wrong (syntax, logic, assets)
3. **Repairs** by sending context back to the LLM
4. **Retries** up to N times with improved prompts
5. **Logs** all failures for continuous improvement

See [MULTI_VARIANT_RETRY_SYSTEM.md](./backend/MULTI_VARIANT_RETRY_SYSTEM.md) for implementation.

### Voice Synthesis Pipeline

- **ElevenLabs** generates natural-sounding narration
- **Timing alignment** syncs voice with visual transitions
- **Dynamic voice selection** based on content type
- Streamed in real-time during rendering

See [TTS_PIPELINE.md](./backend/TTS_PIPELINE.md) and [DYNAMIC_VOICE_ID_IMPLEMENTATION.md](./DYNAMIC_VOICE_ID_IMPLEMENTATION.md).

### Semantic Search

- **Sentence transformers** convert text to 384D vectors
- **Cosine similarity** finds conceptually related nodes
- Embeddings cached for instant retrieval
- Searches entire tree in <50ms

See [SEMANTIC_SEARCH_IMPLEMENTATION.md](./SEMANTIC_SEARCH_IMPLEMENTATION.md).

---

## 🏆 Accomplishments

- ✅ **Unified Learning Experience**: Integrated AI, physics simulations, and video synthesis into one cohesive app
- ✅ **True Infinite Learning**: Users never hit a wall—ask any question, get a video
- ✅ **Production-Ready AI Code**: Robust validation and healing makes LLM-generated code viable
- ✅ **Sub-50ms Semantic Search**: Vector embeddings enable intuitive concept discovery
- ✅ **Serverless at Scale**: Modal handles parallel rendering and bursty workloads efficiently

---

## 🚧 Challenges We Solved

### Dynamic Tree Stitching

Building a procedurally-generated, infinite tree required:

- State machine in `VideoController.tsx` for atomic tree updates
- Queue system for concurrent video generation
- React Context for global state synchronization
- Custom React Flow rendering for visual polish

### Code Healing

Letting AI generate arbitrary Manim code meant handling:

- Unpredictable compilation and runtime errors
- Automated triage and stack trace analysis
- Self-repair via LLM feedback loops (up to N retries)
- Partial rendering for graceful degradation

### Production-Grade Generation

Making AI content reliable at scale involved:

- Structured output schemas (JSON) for predictable responses
- Multi-model orchestration (Gemini, Cerebras, Grok)
- Parallel rendering pipelines on Modal
- Asset caching in Google Cloud Storage

---

## 🔮 Future Roadmap

### Voice Interaction

- 🎤 Speech-to-text input for hands-free learning
- 💬 Real-time dialogue with AI tutor
- 🗣️ Voice cloning for personalized narration

### Content Ecosystem

- 📚 Public tree library for sharing knowledge graphs
- 📋 Tree templates curated by experts
- 🔗 Export to PDF, Notion, or shareable links
- 🔌 Embedding API for third-party platforms

### Enterprise & Education

- 🏫 LMS integration (Canvas, Moodle, Blackboard)
- 📊 Analytics dashboard for teachers
- 📖 Curriculum alignment to learning standards
- 🎓 Bulk generation for entire courses

---

## 📚 Documentation

- [Quick Start Guide](./QUICK_START.md)
- [Frontend Architecture](./frontend/ARCHITECTURE.md)
- [Backend Architecture](./backend/BACKEND_ARCHITECTURE.md)
- [Cached Sessions Guide](./CACHED_SESSIONS_GUIDE.md)
- [Quiz Feature](./QUIZ_FEATURE.md)
- [Thumbnail &amp; Title Generation](./THUMBNAIL_AND_TITLE_FEATURE.md)
- [Voice Selection](./VOICE_SELECTION_IMPLEMENTATION.md)
- [Optimization Summary](./backend/OPTIMIZATION_SUMMARY.md)

## 🙏 Acknowledgments

- **Google Gemini** for powerful content generation
- **Manim Community** for animation framework
- **Modal** for serverless infrastructure
- **ElevenLabs** for natural voice synthesis
- **HackPrinceton** for the opportunity to build and showcase

---

<div align="center">

**VideoGraph** — _Every question deserves an answer. Every answer deserves a video. Every video, made just for you._ ✨

[Website](https://www.videograph.tech) • [Devpost](https://devpost.com/software/videograph) • [GitHub](https://github.com/yourusername/videograph)

</div>
