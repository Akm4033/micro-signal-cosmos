---
title: "How LLMs Actually Work: Under the Hood of the Transformer Architecture"
description: "A rigorous mathematical and algorithmic explanation of modern decoder-only transformers: self-attention, rotary positional embeddings (RoPE), SwiGLU activations, and decoding heuristics."
slug: "how-llms-actually-work"
publishDate: "2026-11-06T08:00:00Z"
category: "artificial-intelligence"
author: "kai"
tags: ["Transformer Architecture", "Deep Learning", "Mathematics", "Machine Learning", "Neural Networks"]
readingTime: "14 min read"
featured: true
hasAffiliateLinks: true
references:
  - title: "Attention Is All You Need"
    source: "Vaswani et al. (Google Brain / Google Research)"
    url: "https://arxiv.org/abs/1706.03762"
  - title: "RoFormer: Enhanced Transformer with Rotary Position Embedding"
    source: "Su et al. (arXiv:2104.09864)"
  - title: "GLU Variants Improve Transformer"
    source: "Noam Shazeer (Google Research)"
---

Popular accounts of Large Language Models (LLMs) oscillate between magical anthropomorphism and dismissive reductions like *"stochastic parrots."* Both perspectives fail to capture the computational reality of modern autoregressive models.

An LLM is a deterministic, high-dimensional probabilistic distribution function. Given an input sequence of discrete tokens, it projects them into a continuous vector space, routes them through dozens of interleaved attention and feed-forward transformation layers, and computes a probability distribution over a vocabulary of approximately 128,000 candidate tokens.

Here is the exact mathematical and structural blueprint of modern frontier models (such as Llama-3, Mistral, and Claude).

---

## 1. High-Level Transformer Topology: The Modern Decoder Block

Original transformers introduced in 2017 used an encoder-decoder topology for translation. Contemporary generative models use a **Pre-LayerNorm Decoder-Only Architecture**:

```
Input Tokens: ["Distributed", " consensus", " is"]
       |
       v
[Token Embedding Layer] (Vocab Size -> Hidden Dimension d_model)
       |
       v + Rotary Positional Embedding (RoPE)
+-------------------------------------------------------------+
| TRANSFORMER LAYER (Repeated N Times, e.g., 32 to 80 layers) |
|                                                             |
|   Input x                                                   |
|      |                                                      |
|   [RMSNorm]                                                 |
|      v                                                      |
|   [Multi-Head / Grouped-Query Attention (GQA)]              |
|      |                                                      |
|      v + Residual Connection (x + Attention_Out)            |
|      |                                                      |
|   [RMSNorm]                                                 |
|      v                                                      |
|   [SwiGLU Feed-Forward Network (FFN)]                       |
|      |                                                      |
|      v + Residual Connection (x + FFN_Out)                  |
+-------------------------------------------------------------+
       |
       v (Final RMSNorm)
[Output Projection Head] (d_model -> Vocab Size Logits)
       |
       v
Softmax Distribution over Next Token Candidates
```

---

## 2. Scaled Dot-Product Attention Explained Step-by-Step

The central engine of the model is the attention mechanism. It allows every token in a sequence to dynamically weigh and extract contextual information from every preceding token.

Given an input matrix $X \in \mathbb{R}^{T \times d_{\text{model}}}$, we project it into three distinct matrices using learned weight projections:
1. **Query ($Q$)**: What the current token is seeking context on.
2. **Key ($K$)**: What information preceding tokens offer.
3. **Value ($V$)**: The actual contextual information to be extracted.

$$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{Q K^T}{\sqrt{d_k}} + M\right) V$$

```
Query Vector (Token T)      Key Vectors (Tokens 0..T)
   [ 0.42, -0.18, 0.91 ]  x  [ [ 0.12,  0.88, -0.32 ],
                               [ 0.45, -0.15,  0.89 ] ]
                                        |
                                        v Dot-Product Similarity
                                [ Score 0: 0.12, Score 1: 0.95 ]
                                        |
                                        v Scaled by 1/sqrt(d_k) & Softmax
                                [ Weight 0: 0.15, Weight 1: 0.85 ]
                                        |
                                        v Linear Combination of Values
                                Context Vector Output
```

### The Causal Mask ($M$)
Because the model is autoregressive, token $T$ cannot peek at token $T+1$. We add an upper-triangular mask where values above the diagonal are set to $-\infty$, ensuring their Softmax probability resolves to zero.

---

## 3. Position Encoding: Why RoPE (Rotary Position Embedding) Won

Transformers are permutation-invariant: if you shuffle the input words, the basic dot product arithmetic yields identical results. To inject sequence order, early models added absolute sinusoidal position vectors to token embeddings.

Modern models use **Rotary Position Embedding (RoPE)**. Instead of adding a vector, RoPE rotates pairs of coordinates in the complex plane:

$$R_{\Theta, m}^d = \text{diag}\left( R_{\theta_1, m}, R_{\theta_2, m}, \dots, R_{\theta_{d/2}, m} \right)$$

Where each 2D rotation matrix is given by:

$$R_{\theta_i, m} = \begin{pmatrix} \cos(m\theta_i) & -\sin(m\theta_i) \\ \sin(m\theta_i) & \cos(m\theta_i) \end{pmatrix}$$

**Why RoPE is mathematically superior:**
When computing the inner product $(R_m Q)(R_n K)^T$, the absolute position $m$ cancels out into a relative distance $(m - n)$. The attention weight naturally encodes how far apart two tokens are, enabling context windows to scale from 4,000 tokens to 128,000+ tokens via position interpolation techniques.

---

## 4. Feed-Forward Networks: SwiGLU

Following attention, representations pass through a Feed-Forward Network (FFN). Modern LLMs have replaced standard ReLU or GELU activations with **SwiGLU (Swish Gated Linear Unit)**:

$$\text{SwiGLU}(x) = \left( \text{Swish}(x W_{\text{gate}}) \otimes (x W_{\text{up}}) \right) W_{\text{down}}$$

Where $\text{Swish}(z) = z \cdot \sigma(\beta z)$. 

The gating mechanism allows the network to dynamically scale or suppress specific feature dimensions, increasing non-linear expressiveness without increasing the parameter count proportionally.

---

## 5. Decoding Strategies: Sampling from the Distribution

The final layer produces unnormalized scores (logits) across the entire vocabulary. To select the next token:

```
Logits: ["the": 14.2, "a": 12.1, "consensus": 18.9, "dog": 1.2]
                         |
                 Temperature Scaling (Logits / T)
                         |
                      Softmax
                         |
      Probabilities: ["consensus": 72%, "the": 18%, "a": 9%, ...]
```

- **Temperature ($T$)**: Scales logit magnitudes before softmax. Lower temperature ($T \to 0$) sharpens peaks (deterministic greedy decoding); higher temperature flattens distribution (creative, varied outputs).
- **Top-$p$ (Nucleus Sampling)**: Dynamically truncates the candidate list to the smallest set of tokens whose cumulative probability exceeds threshold $p$ (typically 0.9), filtering out low-probability nonsense while retaining natural vocabulary diversity.

To explore interactive transformer weights and inspect layer activations in real-time, developers use [Hugging Face Enterprise](https://huggingface.co/?ref=microsignal_transformer-internals) ★ alongside local GPU serving harnesses.

---

## Summary Takeaways

1. **Tokens are points in high-dimensional geometry**: Self-attention computes dynamic contextual trajectories based on similarity.
2. **RoPE makes relative sequence order mathematically natural**: Complex rotations allow models to generalize beyond their training length.
3. **Inference is pure matrix algebra**: Every single generated character is the deterministic result of billions of multiply-accumulate operations executed across thousands of GPU cores.
