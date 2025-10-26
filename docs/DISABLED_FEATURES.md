# Disabled Features Documentation

This document explains features that are currently disabled in production due to incomplete implementation.

## Feature Toggle System

Rami uses a feature toggle system located in `src/config/features.js` to control which features are visible to users.

### How to Enable/Disable Features

Edit `src/config/features.js`:

```javascript
export const FEATURES = {
  storyboard: false,  // Set to true to enable
  prompts: false,     // Set to true to enable
  quiz: true,
};
```

---

## Currently Disabled Features

### 1. 📖 Storyboard View

**Status**: 🚧 Work in Progress
**Location**: `src/components/StoryboardView.jsx`
**Tab**: Storyboard (LayoutGrid icon)

#### What It Does
Storyboard View arranges your concepts in a visual narrative flow, showing how ideas connect sequentially. Think of it like a comic strip or film storyboard for your reading content.

#### Key Features (Planned)
- **Sequential Layout**: Concepts arranged left-to-right in story order
- **Visual Cards**: Each concept displayed as a card with preview
- **Narrative Flow**: Shows cause-effect and temporal relationships
- **Drag & Reorder**: Manually adjust the story sequence
- **Timeline View**: Optional timeline showing when concepts appear in text

#### Why It's Disabled
- Layout algorithm needs to be completed
- Card interaction logic (drag & drop) not implemented
- Timeline generation from concepts needs work
- Visual design needs refinement

#### What Works
- ✅ Basic component structure exists
- ✅ Imports and integration ready

#### What's Missing
- ❌ Layout calculation logic
- ❌ Drag and drop handlers
- ❌ Timeline visualization
- ❌ Card preview generation
- ❌ Narrative flow detection

#### To Enable
1. Complete layout algorithm in `StoryboardView.jsx`
2. Implement drag handlers
3. Add timeline component
4. Set `FEATURES.storyboard = true` in `features.js`

---

### 2. ⚙️ Prompt Chain Editor

**Status**: 🚧 Work in Progress
**Location**: `src/components/PromptChainEditor.jsx`
**Tab**: Prompts (FileText icon)

#### What It Does
Prompt Chain Editor allows you to create custom AI prompt workflows for advanced content analysis. You can chain multiple prompts together, with each step feeding into the next.

#### Key Features (Planned)
- **Visual Prompt Builder**: Drag-and-drop prompt chain creation
- **Template Library**: Pre-built prompt chains for common tasks
- **Variable System**: Pass data between prompt steps
- **Custom Personas**: Create your own AI personas beyond the 5 defaults
- **Save & Share**: Export/import prompt chains
- **Testing Sandbox**: Test chains before applying to readings

#### Example Use Cases
- **Deep Analysis Chain**:
  1. Summarize → 2. Extract key arguments → 3. Find weaknesses → 4. Generate counterpoints

- **Research Chain**:
  1. Extract claims → 2. Identify sources → 3. Check consistency → 4. Generate bibliography

- **Learning Chain**:
  1. Extract concepts → 2. Create definitions → 3. Generate quiz questions → 4. Make flashcards

#### Why It's Disabled
- Prompt execution pipeline not implemented
- Storage system for custom chains needs work
- Variable passing between steps not implemented
- UI for chain builder incomplete
- Integration with AI model needs refinement

#### What Works
- ✅ Basic component structure exists
- ✅ Imports and integration ready
- ✅ Tab navigation works

#### What's Missing
- ❌ Visual prompt builder UI
- ❌ Prompt execution engine
- ❌ Variable/data passing system
- ❌ Template storage (IndexedDB or Chrome storage)
- ❌ Chain testing framework
- ❌ Import/export functionality
- ❌ Error handling for failed chains

#### To Enable
1. Build prompt execution pipeline in `PromptChainEditor.jsx`
2. Implement storage for custom chains
3. Create variable passing system
4. Build visual chain editor UI
5. Set `FEATURES.prompts = true` in `features.js`

---

## Feature Roadmap

### Phase 1: Storyboard (Estimated: 2-3 weeks)
- [ ] Complete layout algorithm
- [ ] Implement drag & drop
- [ ] Add timeline visualization
- [ ] Design and style cards
- [ ] Test with various content types

### Phase 2: Prompt Chain Editor (Estimated: 3-4 weeks)
- [ ] Design prompt execution pipeline
- [ ] Build visual chain editor
- [ ] Implement variable system
- [ ] Create storage layer
- [ ] Add template library
- [ ] Build testing sandbox

### Phase 3: Polish & Launch
- [ ] User testing for both features
- [ ] Performance optimization
- [ ] Documentation and tutorials
- [ ] Enable in production

---

## How Users See This

### Current Production (Disabled)
Users see 3 tabs:
- 📚 Readings
- 🧠 Mindmap (with React Flow, Mermaid, Hybrid modes)
- 🎓 Quiz

### When Enabled
Users will see 5 tabs:
- 📚 Readings
- 🧠 Mindmap
- 📖 Storyboard ← NEW
- ⚙️ Prompts ← NEW
- 🎓 Quiz

---

## For Developers

### Testing Disabled Features

To test work-in-progress features locally:

1. Enable the feature in `src/config/features.js`
2. Run `npm run build`
3. Reload extension in Chrome
4. Navigate to Dashboard → Tab should appear

### Adding New Features

To add a new toggleable feature:

1. Add to `src/config/features.js`:
```javascript
export const FEATURES = {
  myNewFeature: false,
};

export const FEATURE_INFO = {
  myNewFeature: {
    name: 'My Feature',
    description: '...',
    status: 'Work in Progress',
    reason: '...',
  },
};
```

2. Update `Dashboard.jsx` tabs array:
```javascript
const allTabs = [
  { id: 'my-feature', label: 'My Feature', icon: <Icon />, enabled: FEATURES.myNewFeature },
];
```

3. Add conditional render:
```javascript
{FEATURES.myNewFeature && activeTab === 'my-feature' && (
  <MyFeatureComponent />
)}
```

---

## Questions?

- **Why not remove the code entirely?**
  - Components are partially built and will be finished soon
  - Easier to enable/disable than constantly merge

- **Can users enable them?**
  - No, requires rebuilding the extension
  - Feature flags are build-time, not runtime

- **When will they be ready?**
  - See roadmap above
  - Storyboard: ~2-3 weeks
  - Prompts: ~3-4 weeks

---

Last Updated: 2025-10-26
