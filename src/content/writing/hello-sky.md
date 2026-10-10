---
title: Hello, sky — a sample post
description: A placeholder that shows what a post looks like here — math, code, quotes. Replace or delete it.
date: 2026-10-11
tags: [meta, sample]
sample: true
---

This is a **sample post**. It exists to show the format; write your own in `src/content/writing/` and delete this file.

## Math renders natively

Bayes' theorem, which quietly runs a lot of this site's soul:

$$
P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}
$$

Inline works too: the Gaussian density is $f(x) = \tfrac{1}{\sqrt{2\pi}\sigma} e^{-(x-\mu)^2 / 2\sigma^2}$.

## So does code

```python
import numpy as np

def golden_ratio(n: int = 40) -> float:
    a, b = 1, 1
    for _ in range(n):
        a, b = b, a + b
    return b / a   # → 1.618033988749895
```

> The universe is a book written in the language of mathematics. — attributed to Galileo

That's it. Go write something true.
