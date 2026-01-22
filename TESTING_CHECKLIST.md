# Performance Testing Checklist

## Quick Visual Tests (Do These First!)

### 1. Smooth Scrolling ✓
- [ ] Open the landing page
- [ ] Click on "Features" link in navigation
- [ ] **Expected**: Smooth scroll to features section (not instant jump)
- [ ] Click on "For Students" link
- [ ] **Expected**: Smooth scroll animation
- [ ] Click on "For Lecturers" link
- [ ] **Expected**: Smooth scroll animation

### 2. Client-Side Navigation ✓
- [ ] Click "I'm a Student" button in hero section
- [ ] **Expected**: Instant navigation, NO page reload/flash
- [ ] Go back to landing page
- [ ] Click "I'm a Lecturer" button
- [ ] **Expected**: Instant navigation, NO page reload/flash
- [ ] Go back and test "Get Started as Student" button
- [ ] **Expected**: Instant navigation

### 3. Scroll Performance ✓
- [ ] Scroll up and down the landing page rapidly
- [ ] **Expected**: Smooth 60fps scrolling, no jank or stutter
- [ ] Move mouse around while scrolling
- [ ] **Expected**: No lag or frame drops
- [ ] Hover over navigation links
- [ ] **Expected**: Smooth hover transitions

### 4. Canvas Animation ✓
- [ ] Move mouse across the page
- [ ] **Expected**: Colorful trail effect follows mouse smoothly
- [ ] **Expected**: Trail is lighter/simpler than before (20 trails vs 80)
- [ ] Scroll while moving mouse
- [ ] **Expected**: No performance degradation

### 5. Testimonials Scroll ✓
- [ ] Scroll to testimonials section
- [ ] **Expected**: Smooth horizontal auto-scroll animation
- [ ] Hover over testimonials
- [ ] **Expected**: Animation pauses smoothly
- [ ] Move mouse away
- [ ] **Expected**: Animation resumes smoothly

## Browser DevTools Tests

### Chrome DevTools Performance
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Scroll up and down the page for 5 seconds
5. Stop recording
6. **Check**: FPS should be consistently 60fps
7. **Check**: No long tasks (>50ms)

### Network Tab
1. Open DevTools Network tab
2. Click "I'm a Student" button
3. **Check**: No full page reload (no HTML document request)
4. **Check**: Only necessary resources loaded

### Lighthouse Audit
1. Open DevTools Lighthouse tab
2. Run Performance audit
3. **Target**: Score should be 90+
4. **Check**: No "Eliminate render-blocking resources" warnings
5. **Check**: "First Contentful Paint" < 1.5s

## Mobile Testing (If Possible)

### Touch Scrolling
- [ ] Open on mobile device
- [ ] Scroll with finger
- [ ] **Expected**: Smooth, responsive scrolling
- [ ] **Expected**: No lag or stuttering

### Touch Navigation
- [ ] Tap "I'm a Student" button
- [ ] **Expected**: Instant navigation
- [ ] **Expected**: No delay or page reload

## Tab Visibility Test

### Background Tab Optimization
1. Open landing page
2. Open DevTools Performance Monitor
3. Switch to another tab
4. Wait 10 seconds
5. Switch back
6. **Check**: CPU usage should drop to near 0% when tab not visible
7. **Check**: Animations resume when tab becomes visible

## Font Loading Test

### FOUT/FOIT Check
1. Open DevTools Network tab
2. Throttle to "Slow 3G"
3. Hard refresh (Ctrl+Shift+R)
4. **Expected**: Text visible immediately (fallback font)
5. **Expected**: Smooth transition when custom fonts load
6. **Expected**: NO invisible text period

## Known Issues (Expected Behavior)

### CSS Linter Warnings
- ⚠️ `@tailwind` and `@apply` warnings in index.css are expected (Tailwind directives)
- ⚠️ These do NOT affect functionality

### TypeScript Warnings in canvas.tsx
- ⚠️ Property 'x' and 'y' warnings are pre-existing
- ⚠️ File uses `@ts-ignore` extensively
- ⚠️ These do NOT affect functionality

## Success Criteria

✅ All navigation is instant (no page reloads)
✅ Scrolling is smooth at 60fps
✅ Canvas animation is lightweight and smooth
✅ Fonts load without blocking rendering
✅ Animations pause when tab not visible
✅ No scroll jank during mouse movement
✅ Lighthouse performance score 90+

## If Issues Occur

### Scrolling Not Smooth
- Check browser console for errors
- Verify `scroll-behavior: smooth` in index.css
- Try hard refresh (Ctrl+Shift+R)

### Navigation Reloads Page
- Check that Link components are imported from react-router-dom
- Verify no errors in browser console

### Canvas Performance Issues
- Check that passive listeners are working
- Verify throttling is active (16ms timeout)
- Check that blur event stops rendering

## Browser Compatibility

Tested and optimized for:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Next Steps After Testing

If all tests pass:
1. ✅ Performance optimization complete
2. ✅ Ready for production deployment
3. ✅ Consider running full Lighthouse audit
4. ✅ Test on real mobile devices if available

If issues found:
1. Document specific issues
2. Check browser console for errors
3. Review PERFORMANCE_OPTIMIZATION.md for details
4. Report issues with browser/device info
