# MCQMCP Research Agenda

This document frames MCQMCP's research agenda around critical challenges. Each section begins with a critique, then derives research questions and potential approaches.

---

## 0. Data Context: Where Human Data Comes From

Before diving into research questions, we must understand the data context. Human response data—the ground truth for everything—comes from messy, uncontrolled real-world usage.

### Data Sources

| Source | Description | What We Control | What We Don't Control |
|--------|-------------|-----------------|----------------------|
| **Integrated clones** | Users of claudetabs, other Claude UIs | Item delivery, response capture | Who uses it, when, why, how seriously |
| **Direct API users** | Developers building custom integrations | Data schema | User population, context |
| **Research studies** | Controlled data collection | Participant selection, conditions | Ecological validity, scale |
| **Partner deployments** | EdTech, corporate training, courses | Data sharing agreements | User demographics, instructional context |

### What We Know About Each Response

**Captured automatically:**
- Item ID, selected option, correctness
- Response latency (render to click)
- Timestamp
- User ID (opaque, from clone)
- Session ID
- Clone/integration ID

**Not captured (unless clone provides):**
- Who the learner is (demographics, prior knowledge)
- Why they're using it (practice, assessment, curiosity)
- What happened before (tutoring interaction, instruction)
- How seriously they're engaging (motivated vs clicking randomly)
- Environmental context (distracted, time pressure, cheating)

### Implications for Research

**Selection bias**: Early users of LLM tutoring tools are not representative of all learners. They're likely more tech-savvy, more motivated, more educated. Findings may not generalize.

**Motivation variance**: Some responses are from engaged learners; others from people clicking through. This adds noise and may bias statistics (low-motivation responses look like low-ability).

**Context blindness**: We see the response but not what led to it. Did the learner just study this topic? Are they guessing? Did the LLM tutor just explain this exact concept?

**Demographic gaps**: Without demographic data, we can't do DIF analysis or ensure fairness. We're reliant on clones collecting and sharing this.

**Longitudinal limits**: Users may switch clones, clear sessions, or use multiple devices. Tracking learning over time is fragmented.

### Research Questions About Data Context

**RQ0.1**: How representative are early MCQMCP users of target learner populations?
- Method: Compare demographics (if available) with population benchmarks
- Method: Partner with diverse deployments to broaden sample

**RQ0.2**: Can we infer response quality/engagement from behavioral signals?
- Hypothesis: Very fast responses (< 2s) or patterned responses (all A's) indicate low engagement
- Method: Correlate behavioral flags with item statistics; filter or weight accordingly

**RQ0.3**: How much does instructional context affect item difficulty?
- Hypothesis: Items are easier immediately after relevant tutoring
- Method: Compare item statistics across contexts (post-tutoring vs cold)

**RQ0.4**: What incentivizes clones to collect and share demographic data?
- Challenge: Privacy concerns, friction, no direct benefit to clone
- Method: Design opt-in flows; demonstrate value of fairness analysis

**RQ0.5**: Can we link responses across sessions/devices for longitudinal analysis?
- Challenge: Privacy, user consent, technical complexity
- Method: Opt-in persistent user IDs; probabilistic matching

### Data Quality Strategies

1. **Response filtering**: Develop heuristics to flag low-quality responses (too fast, patterned, etc.)
2. **Weighting**: Weight responses by engagement indicators when computing statistics
3. **Context capture**: Encourage clones to pass context (e.g., "post-tutoring", "cold assessment")
4. **Controlled studies**: Supplement observational data with controlled research studies
5. **Diverse partnerships**: Actively seek deployments in varied contexts to broaden sample
6. **Demographic incentives**: Provide fairness reports to clones that collect demographic data

### The Fundamental Tension

We want:
- **Scale**: Millions of responses for stable psychometrics
- **Quality**: Engaged, representative, contextualized responses
- **Privacy**: Minimal data collection, user control

These trade off. More scale often means less control. More context means more privacy risk. The research agenda must navigate this.

---

## 1. Synthetic Calibration Validity

### The Critique

The core bet of MCQMCP is that LLM "personas" can predict human item difficulty. This is unproven and potentially flawed:

- **LLMs aren't humans**. They have different knowledge distributions, don't experience cognitive load the same way, and may find different things "confusing."
- **Difficulty is multidimensional**. An item can be hard because of content knowledge, reading comprehension, distractor plausibility, or cognitive complexity. Personas may capture some dimensions but not others.
- **Training data contamination**. If an item (or similar content) appeared in training data, the LLM may "know" the answer regardless of persona instructions.
- **Persona validity is circular**. We define a "novice" persona based on assumptions about what novices know—but those assumptions may be wrong.
- **Domain dependence**. Synthetic calibration might work for factual recall but fail for procedural knowledge, reasoning, or judgment.

### Research Questions

**RQ1.1**: What is the correlation between synthetic difficulty (% of personas answering correctly) and human difficulty (% of humans answering correctly)?
- Hypothesis: r > 0.6 for factual domains, lower for reasoning-heavy domains
- Method: Collect human responses on items with synthetic calibration; compute correlation

**RQ1.2**: Which persona designs best predict human difficulty?
- Variables: Ability level descriptions, domain expertise framing, persona count, temperature settings
- Method: Systematic comparison of persona configurations against human ground truth

**RQ1.3**: For which item types does synthetic calibration fail?
- Hypothesis: Items requiring real-world experience, cultural knowledge, or metacognition will show poor synthetic-human correlation
- Method: Categorize items by cognitive demand; analyze correlation by category

**RQ1.4**: Can we detect when synthetic calibration is unreliable?
- Hypothesis: High variance across personas, or persona responses inconsistent with stated ability level, may flag unreliable items
- Method: Develop reliability indicators; validate against human data

**RQ1.5**: How much human data is needed to validate/adjust synthetic estimates?
- Hypothesis: 30-50 human responses sufficient to detect gross miscalibration
- Method: Learning curves showing synthetic-human correlation vs human sample size

**RQ1.6**: Can synthetic calibration be improved with calibration adjustment models?
- Hypothesis: Systematic bias (e.g., synthetic always 10% easier) can be corrected
- Method: Fit adjustment models on validation data; test on held-out items

### Approaches

1. **Validation study**: Generate items → synthetic calibration → collect human data → compare
2. **Persona ablation**: Systematically vary persona design, measure prediction quality
3. **Domain comparison**: Run same methodology across multiple domains, compare results
4. **Failure analysis**: Deep dive on items where synthetic ≠ human, identify patterns

---

## 2. Item Generation Quality

### The Critique

LLM-generated items may be superficially correct but pedagogically poor:

- **Trivial or obvious items**. LLMs may generate items that test surface recall rather than understanding.
- **Implausible distractors**. Wrong answers may be obviously wrong, reducing measurement quality.
- **Ambiguous stems**. Items may have multiple defensible correct answers.
- **Factual errors**. The "correct" answer may actually be wrong.
- **Lack of authenticity**. Items may feel artificial, not reflecting how experts actually think about the domain.
- **Homogeneity**. Generated items may cluster around similar formats or content, lacking variety.
- **Bias propagation**. LLM biases may produce items that disadvantage certain groups.

### Research Questions

**RQ2.1**: What is the expert acceptance rate for LLM-generated items?
- Method: Generate items; have domain experts rate accept/reject/revise; compute rates

**RQ2.2**: What are the most common failure modes in generated items?
- Method: Qualitative analysis of rejected items; develop taxonomy of failures

**RQ2.3**: How does item quality vary with prompt engineering?
- Variables: Few-shot examples, rubrics, iterative refinement, domain specification detail
- Method: Controlled comparison of generation approaches

**RQ2.4**: Can LLMs reliably evaluate their own generated items?
- Hypothesis: LLM self-critique catches some but not all errors
- Method: Compare LLM quality ratings with expert ratings

**RQ2.5**: How does distractor quality affect item psychometrics?
- Hypothesis: Items with implausible distractors show poor discrimination
- Method: Correlate distractor plausibility ratings with discrimination indices

**RQ2.6**: Do generated items exhibit bias (DIF)?
- Method: Collect demographic data with responses; run DIF analysis on generated vs human-authored items

### Approaches

1. **Expert review study**: Systematic expert evaluation of generated items
2. **Comparative study**: Generated items vs professionally authored items on psychometric properties
3. **Prompt optimization**: Iterative refinement of generation prompts based on failure analysis
4. **Automated quality metrics**: Develop computable proxies for item quality

---

## 3. Construct Validity

### The Critique

MCQ performance may not reflect meaningful learning:

- **Recognition vs recall**. MCQ tests recognition; real competence often requires recall or production.
- **Test-taking skills**. Savvy test-takers can eliminate options without domain knowledge.
- **Surface vs deep learning**. Learners may memorize facts without understanding.
- **Transfer**. Performing well on MCQs doesn't guarantee ability to apply knowledge in new contexts.
- **The proxy problem**. We claim to measure "learning" but actually measure "MCQ performance"—these may diverge.

### Research Questions

**RQ3.1**: What is the correlation between MCQ performance and constructed response performance on the same content?
- Hypothesis: Moderate correlation (r ~ 0.5-0.7), not unity
- Method: Administer both formats; compare scores

**RQ3.2**: Does MCQ performance predict transfer to novel problems?
- Method: MCQ assessment → transfer task (apply knowledge in new context) → correlation

**RQ3.3**: Does MCQ performance predict retention over time?
- Method: Immediate MCQ → delayed MCQ (1 week, 1 month) → retention curves

**RQ3.4**: Can item design improve construct validity?
- Hypothesis: Application items, scenario-based items, and items requiring reasoning show better transfer prediction
- Method: Compare item types on transfer correlation

**RQ3.5**: What do think-aloud protocols reveal about how learners answer MCQs?
- Method: Have learners verbalize reasoning while answering; code for understanding vs guessing vs elimination

**RQ3.6**: How do MCQ results compare with expert judgment of learner competence?
- Method: MCQ assessment + expert interview/evaluation → compare classifications

### Approaches

1. **Multi-method studies**: Compare MCQ with other assessment formats
2. **Transfer studies**: Measure whether MCQ performance predicts real-world application
3. **Cognitive interviews**: Understand what learners actually do when answering
4. **Longitudinal studies**: Track retention and transfer over time

---

## 4. Gaming and Goodhart's Law

### The Critique

If LLM providers optimize for MCQMCP benchmarks, measurement validity degrades:

- **Teaching to the test**. LLMs may learn to produce MCQ performance without producing understanding.
- **Item exposure**. If items leak into training data, benchmarks become meaningless.
- **Narrow optimization**. Providers optimize for measured outcomes at the expense of unmeasured (but important) outcomes.
- **Strategic behavior**. Providers may find shortcuts that inflate scores without improving learning.

### Research Questions

**RQ4.1**: Do LLM tutoring interactions differ when providers know assessment items?
- Method: Compare tutoring behavior with known vs unknown assessment content

**RQ4.2**: Can we detect when items have been compromised (exposed to training data)?
- Hypothesis: Compromised items show anomalously high performance or changed psychometrics
- Method: Monitor item statistics over time; develop anomaly detection

**RQ4.3**: Does optimizing for MCQ performance transfer to other learning outcomes?
- Method: Providers optimize for MCQ benchmark → measure transfer/retention/application

**RQ4.4**: What item refresh rate prevents gaming?
- Hypothesis: Continuous generation of new items prevents overfitting
- Method: Vary refresh rate; monitor benchmark validity

**RQ4.5**: Can process measures (tutoring interaction patterns) complement outcome measures (MCQ performance)?
- Hypothesis: Combining what happens during tutoring with final assessment improves validity
- Method: Develop process metrics; test incremental validity over MCQ alone

### Approaches

1. **Benchmark rotation**: Continuously refresh items; monitor for gaming
2. **Multi-measure benchmarks**: Combine MCQ with transfer, retention, process measures
3. **Adversarial testing**: Red team attempts to game the benchmark; identify vulnerabilities
4. **Secure item pools**: Keep subset of items hidden; use for validation

---

## 5. Fairness and Bias

### The Critique

MCQMCP could perpetuate or amplify inequities:

- **Item bias**. Generated items may disadvantage certain demographic groups.
- **Persona bias**. If personas are biased, synthetic calibration inherits that bias.
- **Access bias**. Who has access to LLM tutoring with MCQMCP integration?
- **Cultural assumptions**. Items may assume cultural knowledge not shared by all learners.
- **Language bias**. Non-native speakers may be disadvantaged by linguistic complexity.

### Research Questions

**RQ5.1**: Do LLM-generated items exhibit differential item functioning (DIF)?
- Method: Collect demographic data; run DIF analysis by gender, race, language background

**RQ5.2**: Do synthetic personas exhibit demographic biases in their responses?
- Method: Analyze persona response patterns for demographic-correlated differences

**RQ5.3**: Does item linguistic complexity predict DIF?
- Hypothesis: Complex language creates construct-irrelevant difficulty for non-native speakers
- Method: Correlate readability metrics with DIF statistics

**RQ5.4**: Can item generation prompts reduce bias?
- Method: Compare bias metrics across different generation approaches (e.g., explicit fairness instructions)

**RQ5.5**: How do we balance standardization with cultural relevance?
- Tension: Standardized items enable comparison but may not fit all contexts
- Method: Qualitative study of item perception across cultural groups

### Approaches

1. **DIF monitoring**: Routine analysis of item fairness
2. **Diverse validation samples**: Ensure human validation data is demographically representative
3. **Fairness-aware generation**: Develop prompts that explicitly address bias
4. **Localization studies**: Adapt items for different cultural contexts; compare

---

## 6. Measurement Precision and Efficiency

### The Critique

Practical constraints limit measurement quality:

- **Sparse data**. Many items, few responses each—statistics may be unstable.
- **Cold start**. New items have no data; synthetic calibration is unvalidated.
- **Assessment length**. Learners won't answer 100 questions; efficiency matters.
- **Ability range**. Fixed assessments may be too hard for novices or too easy for experts.

### Research Questions

**RQ6.1**: How many responses are needed for stable item statistics?
- Method: Learning curves for p-value, discrimination stability vs sample size

**RQ6.2**: What is the efficiency gain of adaptive vs fixed assessment?
- Hypothesis: CAT requires 40-60% fewer items for same precision
- Method: Simulation study + empirical comparison

**RQ6.3**: How accurate is ability estimation with limited items?
- Method: Compare ability estimates from 10, 20, 30 items with full-length criterion

**RQ6.4**: Can synthetic calibration reduce cold start problems?
- Method: Compare new item performance with synthetic-only vs synthetic+human calibration

**RQ6.5**: What is the optimal balance between measurement precision and learner burden?
- Method: User studies on acceptable assessment length; precision tradeoffs

### Approaches

1. **Simulation studies**: Model measurement precision under various conditions
2. **Empirical efficiency studies**: Compare adaptive vs fixed in real usage
3. **User experience research**: Understand learner tolerance for assessment

---

## 7. Learning Effectiveness Claims

### The Critique

Claiming that LLM X produces "better learning" than LLM Y is fraught:

- **Confounds everywhere**. Learner differences, content differences, time on task, motivation—hard to isolate LLM effect.
- **Hawthorne effects**. Being in a study changes behavior.
- **Short-term vs long-term**. Immediate post-test gains may not persist.
- **Effect sizes are small**. Educational interventions typically show d = 0.2-0.4; detecting differences requires large samples.
- **Generalization**. Results in one domain/population may not generalize.

### Research Questions

**RQ7.1**: What experimental designs can isolate LLM tutoring effects?
- Options: Random assignment, within-subject crossover, regression discontinuity
- Method: Methodological research on study design

**RQ7.2**: What sample sizes are needed to detect meaningful differences between providers?
- Method: Power analysis for expected effect sizes

**RQ7.3**: Do learning effects persist beyond immediate post-test?
- Method: Delayed post-tests at 1 week, 1 month, 3 months

**RQ7.4**: What moderates LLM tutoring effectiveness?
- Variables: Learner prior knowledge, domain, learning objective type, interaction style
- Method: Moderation analyses in benchmark data

**RQ7.5**: Can we develop more sensitive measures of learning?
- Hypothesis: Process measures, microgenetic analysis, or learning curves may detect effects missed by pre/post
- Method: Compare sensitivity of different measurement approaches

### Approaches

1. **Methodological rigor**: Pre-registration, randomization, blinding where possible
2. **Meta-analytic thinking**: Accumulate evidence across studies
3. **Longitudinal tracking**: Follow learners over time, not just immediate outcomes
4. **Heterogeneity analysis**: Understand for whom and under what conditions effects occur

---

## 8. Scalability and Sustainability

### The Critique

The vision requires scale that may not be achievable:

- **Cost of LLM calls**. Synthetic calibration and generation require many API calls.
- **Human validation bottleneck**. If every item needs expert review, scale is limited.
- **Data chicken-and-egg**. Need integrations to get data; need data to demonstrate value.
- **Maintenance burden**. Item banks require ongoing curation as knowledge evolves.

### Research Questions

**RQ8.1**: What is the cost per calibrated item (LLM calls + human review)?
- Method: Track costs through pipeline; optimize bottlenecks

**RQ8.2**: Can human review be reduced without sacrificing quality?
- Hypothesis: Automated filters + sampling can reduce review burden
- Method: Compare full review vs filtered review on quality metrics

**RQ8.3**: What is the minimum viable data for useful psychometrics?
- Method: Determine thresholds for actionable item statistics

**RQ8.4**: How do we incentivize early adopters before network effects kick in?
- Method: Value proposition research; early adopter case studies

**RQ8.5**: What is the item shelf life? How often do items need refresh?
- Method: Track item statistics over time; detect staleness

### Approaches

1. **Cost modeling**: Understand economics at scale
2. **Automation research**: Reduce human-in-the-loop requirements
3. **Partnership strategy**: Identify high-value early integrations
4. **Sustainability planning**: Business model for long-term operation

---

## Research Priorities

Given limited resources, prioritize research that:

1. **Validates core assumptions** (synthetic calibration, item generation quality)
2. **Addresses fatal flaws** (if synthetic calibration doesn't work, the vision fails)
3. **Enables next phases** (Phase N research unblocks Phase N+1)
4. **Produces publishable findings** (builds credibility, attracts collaborators)

### Suggested Sequence

| Priority | Research Area | Rationale |
|----------|---------------|-----------|
| 1 | Synthetic calibration validity (RQ1.1-1.3) | Core assumption; must validate early |
| 2 | Item generation quality (RQ2.1-2.2) | Pipeline depends on generation working |
| 3 | Construct validity (RQ3.1-3.2) | Credibility requires validity evidence |
| 4 | Measurement efficiency (RQ6.1-6.2) | Practical deployment needs |
| 5 | Fairness (RQ5.1-5.2) | Ethical requirement |
| 6 | Learning effectiveness (RQ7.1-7.2) | Benchmark design |
| 7 | Gaming/Goodhart (RQ4.1-4.2) | Important once benchmarks exist |
| 8 | Scalability (RQ8.1-8.2) | Operational concerns |

---

## Collaboration Opportunities

This research agenda exceeds what one team can do. Potential collaborators:

- **Psychometricians**: IRT, DIF, validity frameworks
- **Learning scientists**: Transfer, retention, instructional design
- **NLP researchers**: LLM evaluation, prompt engineering, bias
- **EdTech companies**: Real-world deployment, user data
- **Assessment organizations**: Item development expertise, benchmarking experience

---

*Research is not a detour from building—it's how we build something that works.*
