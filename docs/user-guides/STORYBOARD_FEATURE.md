# Storyboard Feature Explained

## What is the Storyboard?

The **Storyboard View** transforms your mindmap concepts into a **linear, narrative sequence** - like slides in a presentation or frames in a storyboard.

Think of it as: **Mindmap (web of ideas) → Storyboard (step-by-step story)**

---

## 🎯 Purpose

### Mindmap is for:
- **Exploring** - seeing all concepts at once
- **Discovering relationships** - how ideas connect
- **Non-linear thinking** - jumping between concepts

### Storyboard is for:
- **Presenting** - sharing ideas in a sequence
- **Learning** - step-by-step progression
- **Planning** - workflows, tutorials, narratives
- **Teaching** - organizing material into lessons

---

## 🎬 How It Works

### 1. **Auto-Generation from Mindmap**
When you have concepts in your mindmap:
```javascript
// Mindmap concepts:
[
  {id: "concept-0", label: "Artificial Intelligence"},
  {id: "concept-1", label: "Machine Learning"},
  {id: "concept-2", label: "Neural Networks"}
]

// Becomes storyboard frames:
[
  {title: "Artificial Intelligence", content: "Exploring: Artificial Intelligence"},
  {title: "Machine Learning", content: "Exploring: Machine Learning"},
  {title: "Neural Networks", content: "Exploring: Neural Networks"}
]
```

### 2. **Frame Structure**
Each frame has:
- **Title** (editable) - The main topic
- **Visual Area** (placeholder) - For diagrams, images, sketches
- **Content** (editable) - Description/notes for this step

### 3. **Navigation**
- **Timeline** at bottom - click any frame
- **Arrows** on right - previous/next
- **Dots** - visual progress indicator
- **Counter** - shows "Frame 3 / 8"

---

## 🎨 UI Components

### Main View
```
┌─────────────────────────────────────────────────┐
│ Storyboard View            3 / 8    [Add Frame] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────┐           │
│  │  Title: Machine Learning  [Edit] [Delete]│   │
│  │                                  │           │
│  │  ┌────────────────────┐          │           │
│  │  │                    │          │           │
│  │  │  Visual Placeholder │          │   ↑      │
│  │  │       🎨           │          │   •      │
│  │  │                    │          │   •      │
│  │  └────────────────────┘          │   ●      │
│  │                                  │   •      │
│  │  ┌────────────────────┐          │   •      │
│  │  │ Content textarea   │          │   ↓      │
│  │  │ Describe this step │          │           │
│  │  └────────────────────┘          │           │
│  └──────────────────────────────────┘           │
│                                                 │
├─────────────────────────────────────────────────┤
│  [Frame 1] → [Frame 2] → [Frame 3] → [Frame 4] │
└─────────────────────────────────────────────────┘
```

### Features on Each Frame:
1. **Editable Title** - click to edit
2. **Visual Placeholder** - ready for images/diagrams
3. **Content Textarea** - add explanations
4. **Edit Button** - toggle edit mode
5. **Delete Button** - remove frame (with confirmation)

---

## 🔄 Workflow Example

### Use Case: Learning Path

**Starting with Mindmap:**
You generate a mindmap about "Web Development" with concepts:
- HTML, CSS, JavaScript, React, APIs, Databases

**Create Storyboard:**
1. Switch to Storyboard tab
2. Frames auto-created from concepts
3. Arrange in learning order:
   - Frame 1: HTML (basics)
   - Frame 2: CSS (styling)
   - Frame 3: JavaScript (interactivity)
   - Frame 4: React (framework)
   - Frame 5: APIs (data)
   - Frame 6: Databases (storage)

4. Add content to each frame:
   - Title: "Step 1: HTML Fundamentals"
   - Content: "Learn tags, structure, semantic HTML..."
   - Visual: (placeholder for HTML diagram)

5. Navigate through with arrows
6. Present to others or use as study guide

---

## 🛠️ Technical Implementation

### File: `src/components/StoryboardView.jsx`

**Key Functions:**

```javascript
// 1. Generate storyboards from mindmap concepts
function generateStoryboards(concepts) {
  return concepts.map((concept, index) => ({
    id: concept.id,
    title: concept.label,
    content: `Exploring: ${concept.label}`,
    visual: null,
  }));
}

// 2. Add new frame
const handleAddFrame = () => {
  const newFrame = {
    id: `frame-${Date.now()}`,
    title: 'New Frame',
    content: '',
    visual: null,
  };
  setStoryboards([...storyboards, newFrame]);
};

// 3. Update frame content
const handleUpdateFrame = (id, updates) => {
  const newStoryboards = storyboards.map(s =>
    s.id === id ? { ...s, ...updates } : s
  );
  setStoryboards(newStoryboards);
};

// 4. Delete frame
const handleRemoveFrame = (id) => {
  const newStoryboards = storyboards.filter(s => s.id !== id);
  setStoryboards(newStoryboards);
};
```

**State Management:**
```javascript
const [storyboards, setStoryboards] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);
```

---

## 💡 Use Cases

### 1. **Learning Path**
Convert a complex topic into sequential steps
- Biology: Cell → DNA → Proteins → etc.
- Programming: Variables → Functions → Objects → etc.

### 2. **Presentation Prep**
Transform research into slide-like frames
- Each frame = one slide
- Add notes in content area
- Visual placeholder for actual slides

### 3. **Process Documentation**
Turn workflow mindmap into step-by-step guide
- Onboarding new employees
- Tutorial creation
- Recipe/procedure documentation

### 4. **Storytelling**
Create narrative from concept map
- Plot points in order
- Character development arc
- Event timeline

### 5. **Project Planning**
Sequential tasks from project overview
- Phase 1, Phase 2, Phase 3...
- Milestones in order
- Dependencies visualized

---

## 🎯 Comparison

| Feature | Mindmap | Storyboard |
|---------|---------|------------|
| **Structure** | Non-linear web | Linear sequence |
| **View** | All at once | One at a time |
| **Navigation** | Click nodes | Next/Previous |
| **Best For** | Brainstorming | Presenting |
| **Editing** | Add connections | Edit frames |
| **Flow** | Network | Timeline |

---

## 🚀 Future Enhancements

Potential improvements:
- [ ] Export storyboard as PDF/slides
- [ ] Add actual images to visual area
- [ ] Drag-and-drop reorder frames
- [ ] Presenter mode (fullscreen)
- [ ] Add transitions/animations
- [ ] Voice notes per frame
- [ ] Collaborative editing
- [ ] Template library

---

## 📊 Data Flow

```
User generates mindmap
    ↓
Concepts extracted: [{id, label, type, connections}]
    ↓
User switches to Storyboard tab
    ↓
generateStoryboards(concepts) called
    ↓
Creates frames: [{id, title, content, visual}]
    ↓
Displays in StoryboardView component
    ↓
User can:
  - Navigate (arrows, timeline, dots)
  - Edit (title, content)
  - Add (new frames)
  - Delete (remove frames)
    ↓
Changes stored in local state
    ↓
Can be exported/shared (future feature)
```

---

## 🎬 Quick Start

1. **Generate a mindmap** from any page
2. **Switch to Storyboard tab** in Dashboard
3. **Frames auto-created** from mindmap concepts
4. **Navigate** using arrows or timeline
5. **Edit** titles and content as needed
6. **Add frames** with "+ Add Frame" button
7. **Delete** unwanted frames with trash icon
8. **Present** using next/previous navigation

---

## 🎨 Design Philosophy

**Linear ≠ Limiting**

The storyboard doesn't replace the mindmap - it **complements** it:

- **Mindmap**: Explore and discover (divergent thinking)
- **Storyboard**: Organize and communicate (convergent thinking)

Think of it as:
- **Mindmap** = Whiteboard brainstorm
- **Storyboard** = Polished presentation

Both are needed at different stages of learning and communication!

---

**The storyboard is perfect for when you need to go from "web of ideas" to "path forward".** 🎯
