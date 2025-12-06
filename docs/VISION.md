# MCQMCP Vision

## The Problem

Large language models are increasingly used for learning—tutoring, explaining concepts, answering questions. But we have no standardized way to measure whether these interactions actually produce learning.

Current LLM evaluation relies on:
- **Static benchmarks** (MMLU, HumanEval) — measures what the model knows, not what humans learn from it
- **Preference ratings** — "which response is better?" doesn't mean "which produces more learning"
- **Engagement metrics** — time spent and satisfaction ≠ knowledge gained

Missing: **Does interacting with this LLM make humans measurably smarter?**

## The Vision

MCQMCP is infrastructure for measuring human learning in the LLM era.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Any LLM ──→ MCQMCP ──→ Standardized Assessment ──→ Measured Learning │
│                                                                         │
│   Claude, GPT, Gemini, open models... all comparable on same items      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

By providing a common measurement layer:
- Different LLM providers can be compared on learning outcomes
- Creates incentive to optimize for actual learning, not just engagement
- Enables research on what makes AI tutoring effective

## Three Pillars

### 1. Scalable Item Generation

Traditional assessment development is slow and expensive: subject matter experts write items, pilot test them, analyze statistics, revise. This limits assessment to high-stakes, well-funded contexts.

MCQMCP inverts this:

```
Domain Specification
        │
        ▼
┌───────────────────┐
│  LLM generates    │
│  items at scale   │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  LLM "personas"   │  ← Simulated learners at different ability levels
│  answer items     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Synthetic item   │  ← Estimated difficulty, discrimination
│  statistics       │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│  Human responses  │  ← Validate and refine synthetic stats
│  calibrate items  │
└───────────────────┘
```

**The bet**: LLM-generated items with synthetic calibration, validated against human data, can produce useful item banks at a fraction of traditional cost.

**Research needed**:
- Do synthetic difficulty estimates correlate with human difficulty?
- Which persona designs best predict human response patterns?
- How much human data is needed to validate synthetic calibration?
- What domains work well? Which don't?

### 2. Standardized Measurement Protocol

MCQMCP defines how LLMs request and deliver assessments:

- **MCP tools** for item retrieval and response logging
- **`:::mcq` protocol** for rendering items in any UI
- **Consistent data capture** across all integrations

This standardization means:
- A learner using Claude gets the same items as one using GPT
- Response data is comparable across providers
- Psychometric analysis applies uniformly

### 3. Psychometric Infrastructure

Raw responses become meaningful measurement through psychometrics:

**Item-level**:
- Difficulty (p-value)
- Discrimination (point-biserial, IRT a-parameter)
- Distractor effectiveness
- Differential item functioning (fairness across groups)

**Test-level**:
- Reliability (internal consistency)
- Standard error of measurement
- Test information functions
- Classification accuracy

**Learner-level**:
- Ability estimates with confidence intervals
- Growth trajectories
- Knowledge gap diagnosis
- Mastery classification

MCQMCP computes these automatically as response data accumulates, surfacing item quality issues and enabling sophisticated adaptive algorithms.

## Use Cases

### For Learners
Practice and assess knowledge through natural chat. Progress persists across sessions. Adaptive difficulty matches your level.

### For Educators / Course Designers
Create validated item banks for your domain. See how learners perform. Identify where instruction needs improvement.

### For Learning Engineers
Access response-level data for analysis. Compute psychometric statistics. Validate item quality. Run calibration studies.

### For LLM Providers
Integrate standardized assessment. Benchmark tutoring effectiveness against competitors. Demonstrate learning outcomes, not just user satisfaction.

### For Researchers
Study what makes AI tutoring effective. Compare pedagogical approaches with controlled measurement. Investigate synthetic calibration validity.

## The Feedback Loop

MCQMCP creates a virtuous cycle:

```
Better items ──→ Better measurement ──→ Better LLM tutoring ──→ Better learning
     ↑                                                               │
     └───────────────────────────────────────────────────────────────┘
                         Data informs improvement
```

As more humans respond to items:
- Synthetic calibration improves (we learn what works)
- Item generation gets better (we learn what makes good items)
- LLM providers get clearer signal on what produces learning
- Assessment quality compounds over time

## What MCQMCP Is Not

**Not a tutoring system**. MCQMCP provides measurement infrastructure. The tutoring happens in Claude, GPT, or whatever LLM the learner uses.

**Not a test publisher**. MCQMCP is open infrastructure. Anyone can create item banks, integrate with any LLM, access their own data.

**Not high-stakes certification** (yet). Initial focus is low-stakes practice and formative assessment. High-stakes use requires additional security, proctoring, and validation work.

## Challenges & Open Questions

### Synthetic Calibration Validity
Will LLM personas predict human difficulty? This is empirical—we need to test it. Early research suggests promise for factual domains; less clear for nuanced reasoning.

### Goodhart's Law
If LLM providers optimize for MCQMCP benchmarks, they might teach to the test rather than teach understanding. Mitigations:
- Continuously generate new items
- Include transfer/application items
- Measure retention, not just immediate performance
- Keep some items secure

### Beyond MCQ
Multiple choice is tractable but limited. Some constructs require constructed response, performance tasks, or portfolio assessment. MCQMCP starts with MCQ but the architecture should accommodate expansion.

### Construct Validity
MCQ performance is a proxy for understanding. We should validate against:
- Transfer to novel problems
- Retention over time
- Real-world application
- Other assessment formats

### Independence & Trust
For benchmarks to be credible:
- Item banks shouldn't be in LLM training data
- Methodology should be transparent
- Governance should be neutral

## Roadmap

### Phase 1: Foundation
- MCP server with core tools
- Item bank storage and retrieval
- Response logging
- Basic statistics (p-value, discrimination)

### Phase 2: Psychometrics
- IRT calibration pipeline
- Reliability analysis
- Adaptive item selection
- Fixed forms with equating

### Phase 3: Generation Pipeline
- LLM item generation from specs
- Persona-based synthetic calibration
- Human validation workflows
- Synthetic-human comparison analytics

### Phase 4: Benchmarking
- Cross-provider comparison framework
- Learning gain measurement
- Public benchmark reporting
- Research partnerships

## The Opportunity

We're at an inflection point. LLMs are becoming primary learning tools for millions. Yet we're flying blind—no standardized measurement of whether they work.

MCQMCP can be the infrastructure that makes human learning measurable in the LLM era. Not by replacing traditional assessment, but by bringing psychometric rigor to the new contexts where learning happens.

The question isn't whether AI will be used for learning. It's whether we'll measure what humans actually learn.

---

*MCQMCP: Measure what matters.*
