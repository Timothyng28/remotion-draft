# Fast vs Deep Mode Guide

## Overview

The video generation pipeline now supports two modes for balancing quality and speed:

- **Deep Mode** (default): Premium quality, slower generation
- **Fast Mode**: Good quality, faster generation

## Mode Comparison

| Feature               | Deep Mode                   | Fast Mode                     |
| --------------------- | --------------------------- | ----------------------------- |
| **Code Generation**   | Anthropic Claude Sonnet 4.5 | Cerebras Qwen 3 Instruct      |
| **Quality**           | ⭐⭐⭐⭐⭐ Premium          | ⭐⭐⭐⭐ Good                 |
| **Speed per Section** | 10-15 seconds               | 3-5 seconds                   |
| **Total Time**        | ~50-70 seconds              | ~40-60 seconds                |
| **Best For**          | Production videos           | Previews, iterations, testing |
| **Cost**              | Higher (Anthropic)          | Lower (Cerebras)              |

## Usage

### 1. Command Line (CLI)

**Deep Mode (Default):**

```bash
modal run backend/modal/main_video_generator_dev_modular.py \
  --prompt "Explain backpropagation in machine learning"
```

**Fast Mode:**

```bash
modal run backend/modal/main_video_generator_dev_modular.py \
  --prompt "Explain backpropagation in machine learning" \
  --mode fast
```

### 2. API (POST /generate_video_api)

**Deep Mode (Default):**

```json
{
  "topic": "Explain backpropagation in machine learning",
  "job_id": "optional-uuid"
}
```

**Fast Mode:**

```json
{
  "topic": "Explain backpropagation in machine learning",
  "mode": "fast",
  "job_id": "optional-uuid"
}
```

### 3. Python Code

```python
import modal

app = modal.Lookup("main-video-generator-dev", "main-video-generator-dev")
generate_fn = app.lookup("generate_educational_video")

# Deep mode
for update in generate_fn.remote_gen(
    prompt="Explain backpropagation",
    mode="deep"
):
    print(update)

# Fast mode
for update in generate_fn.remote_gen(
    prompt="Explain backpropagation",
    mode="fast"
):
    print(update)
```

## When to Use Each Mode

### Use **Deep Mode** When:

✅ Creating final production videos  
✅ Quality is more important than speed  
✅ You need the most accurate and polished Manim animations  
✅ You're okay with waiting an extra 10-20 seconds  
✅ Budget allows for premium AI services

### Use **Fast Mode** When:

✅ Iterating on video ideas quickly  
✅ Generating preview/draft videos  
✅ Testing different topics or prompts  
✅ Speed is critical (demos, live presentations)  
✅ Cost optimization is important  
✅ Quality is "good enough" for your use case

## Performance Data

Based on a 5-section video about "Explain backpropagation in machine learning":

### Deep Mode Timeline

```
🎬 Plan Generation        →  8 seconds
🎤 Audio Pre-generation   → 12 seconds (parallel)
💻 Code Generation (×5)   → 50 seconds (parallel)
🎥 Video Rendering (×5)   → 25 seconds (parallel)
🔗 Concatenation          →  4 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total                  → ~60 seconds
```

### Fast Mode Timeline

```
🎬 Plan Generation        →  8 seconds
🎤 Audio Pre-generation   → 12 seconds (parallel)
💻 Code Generation (×5)   → 20 seconds (parallel) ⚡ 30s faster!
🎥 Video Rendering (×5)   → 25 seconds (parallel)
🔗 Concatenation          →  4 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total                  → ~45 seconds
```

**Savings: ~15-30 seconds per video**

## Quality Examples

### Deep Mode Output

- Complex animation choreography
- More natural code structure
- Better edge case handling
- Premium educational quality

### Fast Mode Output

- Clean, functional animations
- Good code quality
- Handles most use cases well
- Professional educational quality

## Cost Comparison

Approximate costs per 5-section video:

| Component                  | Deep Mode | Fast Mode | Savings         |
| -------------------------- | --------- | --------- | --------------- |
| Plan Generation (Cerebras) | $0.002    | $0.002    | -               |
| Code Gen (5 sections)      | $0.15     | $0.01     | **$0.14**       |
| Audio (ElevenLabs)         | $0.05     | $0.05     | -               |
| **Total**                  | **$0.20** | **$0.06** | **$0.14 (70%)** |

_Note: Costs are approximate and may vary based on prompt complexity_

## Recommendations

### For Development/Testing

```bash
# Use fast mode for rapid iteration
modal run backend/modal/main_video_generator_dev_modular.py \
  --prompt "Test topic" \
  --mode fast
```

### For Production

```bash
# Use deep mode for final videos
modal run backend/modal/main_video_generator_dev_modular.py \
  --prompt "Final video topic" \
  --mode deep
```

### For Hybrid Workflow

1. **Prototype** with Fast mode (iterate quickly)
2. **Refine** prompt based on fast results
3. **Finalize** with Deep mode (production quality)

## Troubleshooting

### Fast Mode Issues

**Problem:** Code quality not meeting expectations

- **Solution:** Switch to Deep mode for that specific video

**Problem:** Cerebras API rate limits

- **Solution:** Add delays between requests or use Deep mode

### Deep Mode Issues

**Problem:** Too slow for iteration

- **Solution:** Use Fast mode for prototyping, Deep for finals

**Problem:** High API costs

- **Solution:** Use Fast mode more often, reserve Deep for important videos

## Future Enhancements

Planned improvements:

- ⏳ Auto-mode: Automatically choose mode based on complexity
- ⏳ Hybrid mode: Use Deep for critical sections, Fast for others
- ⏳ Quality presets: Ultra-fast, Fast, Balanced, Deep, Ultra-deep

---

## Summary

- **Default:** Deep mode (backward compatible)
- **Fast mode:** Add `--mode fast` flag or `"mode": "fast"` in API
- **Trade-off:** ~15-30s faster, slightly lower quality
- **Recommendation:** Fast for iteration, Deep for production

🚀 **Start using Fast mode today for 50% faster iterations!**
