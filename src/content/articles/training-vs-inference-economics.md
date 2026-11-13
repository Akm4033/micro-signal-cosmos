---
title: "Training vs. Inference Economics: The True Cost of Running LLMs"
description: "A financial and hardware engineering breakdown of frontier AI models: memory bandwidth limits, KV cache sizing, FP8 quantization, and cloud unit economics."
logo: "chart"
slug: "training-vs-inference-economics"
publishDate: "2026-11-06T08:00:00Z"
category: "artificial-intelligence"
author: "kai"
tags: ["LLM Infrastructure", "GPU Economics", "Inference Optimization", "vLLM", "Hardware"]
readingTime: "13 min read"
featured: false
hasAffiliateLinks: true
references:
  - title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
    source: "Tri Dao et al. (Stanford University / NeurIPS)"
  - title: "vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention"
    source: "UC Berkeley Sky Computing Lab"
  - title: "LLM Inference Unveiled: Survey and Hardware Roofline Analysis"
    source: "arXiv:2402.16363"
---

In the early hype cycle of generative AI, boardroom conversations focused almost entirely on training costs: *"It costs $50 million to train a frontier model."* 

While pre-training a foundation model requires colossal upfront capital, foundation model companies and enterprise teams have realized a brutal operational reality: **Training is a one-time capital expenditure; inference is an unbounded operational tax.** 

For any model that achieves meaningful user traction, total lifetime inference costs outstrip initial training budgets within months. Understanding the hardware mechanics that govern inference throughput—specifically the divide between arithmetic compute (FLOPs) and High Bandwidth Memory (HBM) bandwidth—is the difference between a sustainable AI business and cloud bankruptcy.

---

## 1. The Core Bottleneck: Compute-Bound vs. Memory-Bound

To evaluate LLM efficiency, we apply the **Roofline Model**, which maps the relationship between arithmetic intensity (operations per byte) and theoretical hardware performance.

```
Attainable Performance (FLOP/s)
         ^
Peak     |                      /------------------- (Compute Bound: Matrix Multiplications)
Compute  |                     /
         |                    /  <- Ridge Point
         |                   /
         |                  /
         |                 /
         |                / (Memory Bandwidth Bound: Auto-regressive Token Generation)
         +---------------+-------------------------->
                        Arithmetic Intensity (FLOPs / Byte of Memory Transfer)
```

### Pre-fill (Prompt Processing) is Compute-Bound
When a user submits a 2,000-token prompt, the model processes all 2,000 tokens concurrently. The matrix multiplication layers (`Q = X * W_q`) can saturate tensor cores at high arithmetic intensity. The GPU runs near its theoretical maximum TFLOP rating.

### Decode (Token Generation) is Memory-Bound
During sequential token generation, the model predicts **one token at a time**. To generate a single new token, every single parameter of the 70-billion parameter model must be loaded from GPU High Bandwidth Memory (HBM) into on-chip SRAM registers.

```
Memory Required per Token = Model Size in Bytes + KV Cache Access
```

For an unquantized Llama-3-70B model in 16-bit precision (140GB of weights):
- On an NVIDIA H100 GPU (3.35 TB/s memory bandwidth):
- Maximum theoretical single-stream generation rate: `3,350 GB/s / 140 GB = ~24 tokens per second`.

Even if the H100 has 989 TFLOPs of compute capacity, the GPU execution units sit idle 95% of the time, starved for memory bandwidth.

---

## 2. The KV Cache Exploding Footprint

During auto-regressive generation, computing attention requires the Key and Value representations of all previous tokens. Recomputing them at every step would yield `O(N^2)` computational complexity. Instead, engines cache them in memory: the **Key-Value (KV) Cache**.

```
KV Cache Size (Bytes) = 2 * n_layers * n_heads * d_head * precision_bytes * seq_len * batch_size
```

For Llama-3-70B (80 layers, Grouped-Query Attention with 8 KV heads, head dimension 128) at FP16:

| Context Window Length | KV Cache per User Stream | Memory for 64 Concurrent Users |
|---|---|---|
| **2,048 tokens** | ~670 MB | ~43 GB |
| **8,192 tokens** | ~2.68 GB | ~171 GB |
| **32,768 tokens** | ~10.7 GB | **~685 GB** (Exceeds an entire 8x H100 node!) |

If your inference architecture allocates static contiguous memory blocks for context windows, memory fragmentation quickly exhausts GPU RAM, leading to premature out-of-memory (OOM) crashes.

---

## 3. PagedAttention and vLLM: The Virtual Memory Revolution

In 2023, researchers at UC Berkeley introduced **PagedAttention** (implemented in **vLLM**). Inspired by virtual memory and paging in operating systems, PagedAttention stores the continuous Key and Value vectors of an active request across non-contiguous physical memory blocks.

```
Virtual Token Sequence: [T0, T1, T2] [T3, T4, T5] [T6, T7, T8]
                            |            |            |
Block Table Mapping:      Page #4      Page #1      Page #9
                            |            |            |
Physical GPU HBM Memory:  [Slot 4]     [Slot 1]     [Slot 9] (Zero Internal Fragmentation!)
```

By eliminating memory fragmentation and enabling copy-on-write memory sharing during parallel beam search, vLLM boosts serving throughput by **2x to 4x** on identical GPU hardware.

---

## 4. Quantization: The Economics of Precision

Quantization compresses model weights from 16-bit floating point (FP16/BF16) to lower-bit representations (FP8, INT4, AWQ):

| Precision Format | Bits per Weight | Memory for 70B Model | Minimum GPU Requirement | Quality Retention |
|---|---|---|---|---|
| **BF16 / FP16** | 16 bits | ~140 GB | 2x A100 (80GB) | 100% baseline |
| **FP8 (Native H100)** | 8 bits | ~70 GB | **1x H100 (80GB)** | **> 99.5% accuracy** |
| **INT4 (AWQ / GPTQ)** | 4 bits | ~38 GB | **1x A100 (40GB)** | > 97% on most tasks |

Migrating from FP16 to FP8 on NVIDIA Hopper architectures cuts the required GPU node size in half, cutting hardware expenditure by **50% immediately** with near-zero perceptual loss in output coherence.

---

## 5. Cloud Provider Cost Comparison

When renting on-demand GPUs for training vs. continuous serving, hyperscaler pricing is prohibitive:

| Provider | NVIDIA H100 (80GB SXM5) Hourly Rate | Monthly Cost per GPU (24/7) |
|---|---|---|
| **AWS EC2 (p5.48xlarge)** | ~$12.29 / GPU | ~$8,850 / month |
| **Google Cloud (a3-highgpu)** | ~$11.80 / GPU | ~$8,496 / month |
| **RunPod / Specialized Cloud** | ~$3.19 – $3.89 / GPU | ~$2,450 / month |
| **Lambda Labs** | **~$2.49 – $2.99 / GPU** | **~$1,950 / month** |

Teams running dedicated model inference save over **70% in monthly operational expense** by utilizing dedicated GPU cloud platforms like [Lambda Labs](https://lambdalabs.com/?via=signalinsight_inference-economics) ★ or decentralized GPU clouds rather than traditional enterprise hyperscalers.

---

## Summary Takeaways

1. **Inference is memory-bandwidth bound**: Optimize token throughput by tracking bytes moved across HBM, not raw TFLOPs.
2. **Deploy Grouped-Query Attention (GQA) and FP8**: Compressing the KV cache and weights allows larger concurrent batch sizes without OOM errors.
3. **Use vLLM with PagedAttention**: Eliminate memory fragmentation to triple your requests-per-second on identical hardware nodes.

