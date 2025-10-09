# Second Brain - Quick Reference Guide

## 🎯 What Changed?

### Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **FPS** | 30-40 FPS | 60 FPS |
| **Hover Lag** | Noticeable stutter | Instant response |
| **Drag Support** | ❌ None | ✅ Full drag-and-drop |
| **Re-renders** | On every hover | Only on data change |
| **Gradient Creation** | 60+/frame | Cached & reused |
| **Physics Checks** | O(n²) all nodes | O(n) nearby only |
| **DOM Reads** | Every mouse move | Cached in ref |
| **HiDPI Support** | ❌ Blurry | ✅ Crisp rendering |

---

## 🚀 Key Features Added

### 1. **Drag & Drop Nodes**
- Click and hold any node to drag it
- Cursor changes to "grab" on hover, "grabbing" when dragging
- Physics simulation pauses for dragged node
- Smooth release with momentum

### 2. **Enhanced Visual Feedback**
- Pulsing glow on hovered nodes
- Connection lines highlight on interaction
- Smooth transitions between states
- Professional Obsidian-like aesthetic

### 3. **Performance Optimizations**
- Ref-based state to prevent re-renders
- Gradient caching with Map
- Distance-based culling for physics
- Hardware acceleration enabled
- High-DPI display support

---

## 💡 How to Use

### Mouse Interactions:
1. **Hover** over a node → See details panel
2. **Click & Drag** a node → Move it around
3. **Click** a session node → Navigate to that session
4. **Release** while dragging → Node settles with physics

### Keyboard Shortcuts:
- Currently no keyboard controls (future enhancement)

---

## 🔧 Configuration

### Physics Constants (in `SecondBrain.tsx`):
```typescript
// Adjust these for different motion feel
const DAMPING = 0.9;              // Higher = slower stop
const REPULSION = 8000;           // Higher = more spacing
const CENTER_ATTRACTION = 0.001;  // Higher = tighter orbit
const MIN_DISTANCE = 120;         // Minimum node separation
const MAX_VELOCITY = 5;           // Speed limit
```

### Visual Constants:
```typescript
// Node sizes
const centralRadius = 80;    // Center node
const sessionRadius = 50;    // Session nodes

// Connection distances
const connectionThreshold = 350;  // Max distance for links
const repulsionRange = MIN_DISTANCE * 3;  // Physics range
```

---

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **No zoom/pan** - Fixed view only (planned feature)
2. **No search** - Can't filter nodes yet (planned feature)
3. **No persistence** - Dragged positions reset on reload
4. **Max ~50 nodes** - Performance degrades beyond this

### Minor Issues:
- Gradient caching could be improved for dynamic positions
- No mobile touch support yet
- No keyboard navigation

---

## 📈 Performance Tips

### For Best Performance:
1. **Keep sessions under 30** - More than 50 may lag
2. **Use modern browser** - Chrome/Edge recommended
3. **Close other tabs** - Free up GPU memory
4. **Update graphics drivers** - Helps with canvas rendering

### Troubleshooting:
- **Still laggy?** Try reducing `MAX_VELOCITY` to 3
- **Nodes too close?** Increase `REPULSION` to 10000
- **Too much motion?** Increase `DAMPING` to 0.95
- **Blurry on HiDPI?** Check that DPR scaling is enabled

---

## 🎨 Customization

### Change Colors:
```typescript
// In render function
const primaryColor = 'rgba(233, 138, 83, 0.6)';   // Orange
const secondaryColor = 'rgba(95, 135, 135, 0.4)'; // Teal

// Node colors
nodeGradient.addColorStop(0, 'rgba(42, 42, 42, 0.95)');
nodeGradient.addColorStop(1, 'rgba(26, 26, 26, 0.9)');
```

### Change Animation Speed:
```typescript
// Pulse speed (in border rendering)
const time = Date.now() * 0.001;  // Change 0.001 to speed up/slow
const pulseIntensity = 0.2 + Math.sin(time * 3) * 0.1;  // Change * 3
```

---

## 📚 Code Structure

### Main Sections:
1. **State & Refs** (lines 30-41)
   - React state for UI updates
   - Refs for animation state

2. **Data Loading** (lines 44-56)
   - Convex query for sessions
   - Ref syncing with state

3. **Initialization** (lines 59-127)
   - Canvas setup
   - Node creation
   - Initial positioning

4. **Physics** (lines 134-226)
   - Force calculations
   - Velocity updates
   - Boundary handling

5. **Rendering** (lines 228-374)
   - Connection drawing
   - Node rendering
   - Visual effects

6. **Events** (lines 381-472)
   - Mouse move/down/up
   - Hover detection
   - Drag handling

7. **UI Components** (lines 493-628)
   - Header
   - Stats panel
   - Hover info card

---

## 🔗 Related Documentation

- **Full Details**: See `SECOND_BRAIN_OPTIMIZATIONS.md`
- **Component Code**: `src/pages/SecondBrain.tsx`
- **Data Queries**: `convex/sessions.ts`
- **UI Components**: `src/components/ui/`

---

## ✨ Tips & Tricks

### Cool Effects to Try:
1. **Drag center node** → All others orbit around it
2. **Hover while dragging** → See connections highlight
3. **Fast release** → Node flies with momentum
4. **Group nodes together** → They push apart organically

### Development Tips:
1. Use React DevTools to monitor re-renders
2. Enable Chrome FPS meter to check performance
3. Test with different session counts
4. Try on different screen sizes

---

## 🎉 What's Next?

### Planned Features:
- [ ] Zoom controls (mouse wheel)
- [ ] Pan/drag canvas background
- [ ] Search and filter nodes
- [ ] Save custom layouts
- [ ] Export as image
- [ ] Mobile touch support
- [ ] Keyboard shortcuts
- [ ] Animation presets
- [ ] Custom themes

### Want to Contribute?
- Check physics constants for your preferred feel
- Suggest visual improvements
- Report any performance issues
- Request new features

---

**Happy Knowledge Graphing! 🧠✨**

*Your Second Brain is now as smooth as your first one!*
