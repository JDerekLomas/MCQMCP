# MCQMCP R&D Roadmap

A phased plan for building measurement infrastructure for human learning in the LLM era.

## Phase 1: MCP Foundation

**Goal**: Working MCP server that any Claude interface can integrate.

### 1.1 Core MCP Server
- [ ] HTTP+SSE transport implementation
- [ ] Tool registration and execution framework
- [ ] Authentication (API keys for clones, user ID passthrough)
- [ ] Basic rate limiting

### 1.2 Item Bank Storage
- [ ] Postgres schema for items, banks, metadata
- [ ] CRUD operations for banks and items
- [ ] Item schema (stem, options, correct answer, feedback, tags)
- [ ] Difficulty and topic tagging

### 1.3 MCP Tools
- [ ] `assessment_get_item` - fetch item by topic/difficulty
- [ ] `assessment_list_topics` - enumerate available topics
- [ ] `assessment_list_banks` - enumerate available banks
- [ ] `assessment_log_response` - record user answer

### 1.4 Response Logging
- [ ] Response schema (item_id, user_id, selected, correct, latency_ms, timestamp)
- [ ] Session tracking
- [ ] Basic query API for clone developers

### 1.5 Reference Integration
- [ ] Integrate with claudetabs as proof of concept
- [ ] Document `:::mcq` protocol for other integrators
- [ ] Sample MCQCard component

**Milestone**: A developer can connect their Claude UI to MCQMCP, serve items, and log responses.

---

## Phase 2: Classical Psychometrics

**Goal**: Automated item statistics from response data.

### 2.1 Item Statistics
- [ ] P-value (difficulty index) computation
- [ ] Point-biserial correlation (discrimination)
- [ ] Distractor analysis (response distribution per option)
- [ ] Response time statistics (mean, median, distribution)
- [ ] Flag items with poor statistics

### 2.2 Analytics API
- [ ] `GET /analytics/items/{item_id}` - item performance metrics
- [ ] `GET /analytics/banks/{bank_id}` - aggregate bank statistics
- [ ] `GET /analytics/responses` - filtered export
- [ ] Incremental stat updates vs batch recomputation

### 2.3 User Progress
- [ ] Per-user response history
- [ ] Topic mastery estimates (% correct by topic)
- [ ] Learning curves (performance over time)
- [ ] `GET /users/{user_id}/progress` endpoint

### 2.4 Dashboard (Optional)
- [ ] Web UI for viewing item statistics
- [ ] User progress visualization
- [ ] Bank overview

**Milestone**: Learning engineers can access item statistics and user progress data via API.

**Research Questions**:
- What thresholds indicate problematic items? (e.g., p < 0.2 or p > 0.95, rpbis < 0.15)
- How many responses needed for stable estimates?

---

## Phase 3: Fixed Forms & Reliability

**Goal**: Support structured assessments with psychometric rigor.

### 3.1 Form Management
- [ ] Form schema (ordered list of item IDs, metadata)
- [ ] `assessment_get_form` tool - serve complete form
- [ ] Form versioning
- [ ] Anchor item designation (for equating)

### 3.2 Form-Level Statistics
- [ ] Cronbach's alpha / KR-20 (internal consistency)
- [ ] Standard error of measurement
- [ ] Score distributions
- [ ] Item-total correlations within form

### 3.3 Scoring
- [ ] Raw score computation
- [ ] Percent correct
- [ ] Standard scores (z-scores, T-scores)
- [ ] Mastery classification (cut scores)

### 3.4 Form Equivalence
- [ ] Common-item equating (anchor design)
- [ ] Score comparability across forms
- [ ] Equating documentation

**Milestone**: Educators can create fixed forms and get reliability estimates.

**Research Questions**:
- What's minimum sample size for stable alpha?
- How many anchor items needed for equating?

---

## Phase 4: IRT Calibration

**Goal**: Item Response Theory parameters for adaptive testing and ability estimation.

### 4.1 IRT Model Implementation
- [ ] 1PL (Rasch) model calibration
- [ ] 2PL model calibration
- [ ] 3PL model calibration (with guessing parameter)
- [ ] Model fit statistics

### 4.2 Calibration Pipeline
- [ ] Batch calibration job
- [ ] Minimum response thresholds (e.g., 200+ per item)
- [ ] Parameter storage (a, b, c per item)
- [ ] Calibration history/versioning

### 4.3 Ability Estimation
- [ ] Maximum likelihood estimation (MLE)
- [ ] Expected a posteriori (EAP)
- [ ] Standard error of ability estimate
- [ ] `GET /scores/{user_id}/ability` endpoint

### 4.4 Test Information
- [ ] Item information functions
- [ ] Test information function
- [ ] Conditional SEM across ability range

**Milestone**: Items have IRT parameters; users get ability estimates with confidence intervals.

**Research Questions**:
- Which model (1PL, 2PL, 3PL) fits best for LLM-tutoring contexts?
- How to handle sparse data (many items, few responses each)?

---

## Phase 5: Adaptive Assessment

**Goal**: Serve items optimally based on learner ability.

### 5.1 Simple Adaptive
- [ ] Difficulty adjustment based on recent performance
- [ ] `adaptive: true` parameter for `assessment_get_item`
- [ ] Running ability estimate during session

### 5.2 Full CAT (Computerized Adaptive Testing)
- [ ] Maximum information item selection
- [ ] Content balancing constraints
- [ ] Exposure control (prevent overuse of items)
- [ ] Stopping rules (SEM threshold, item count)

### 5.3 Adaptive API
- [ ] `assessment_start_adaptive_session` - initialize CAT
- [ ] `assessment_get_next_item` - optimal item selection
- [ ] `assessment_end_adaptive_session` - final ability estimate

**Milestone**: Learners get personalized item selection that efficiently estimates their ability.

**Research Questions**:
- What's the efficiency gain of CAT vs fixed form? (items needed for same precision)
- How to balance measurement efficiency vs content coverage?

---

## Phase 6: Synthetic Calibration

**Goal**: Use LLM personas to estimate item statistics before human data.

### 6.1 Persona Design
- [ ] Define ability levels (novice, intermediate, advanced, expert)
- [ ] Persona prompt templates
- [ ] Domain-specific persona variants
- [ ] Persona response generation pipeline

### 6.2 Synthetic Response Generation
- [ ] Run personas against item bank
- [ ] Multiple runs for stability
- [ ] Response logging (synthetic flag)
- [ ] Cost management (batch API, caching)

### 6.3 Synthetic Statistics
- [ ] Compute p-value, discrimination from synthetic data
- [ ] Compare across persona configurations
- [ ] Confidence estimates based on variance

### 6.4 Validation Framework
- [ ] Synthetic vs human correlation analysis
- [ ] Per-domain validation studies
- [ ] Calibration adjustment models
- [ ] Reporting: "synthetic (unvalidated)" vs "human-validated"

**Milestone**: New items get estimated statistics immediately; estimates improve as human data arrives.

**Research Questions**:
- Which persona designs best predict human difficulty?
- How does synthetic-human correlation vary by domain?
- Can we predict which items will have poor synthetic calibration?
- What's the minimum human data needed to validate synthetic estimates?

---

## Phase 7: Item Generation Pipeline

**Goal**: Generate high-quality items from domain specifications.

### 7.1 Domain Specification Format
- [ ] Schema for domain/topic definitions
- [ ] Learning objectives / competency mapping
- [ ] Difficulty level specifications
- [ ] Example items as few-shot prompts

### 7.2 Item Generation
- [ ] LLM prompt engineering for item generation
- [ ] Structured output (stem, options, correct, rationale)
- [ ] Distractor quality criteria
- [ ] Code snippet generation for technical domains

### 7.3 Quality Filters
- [ ] Automated checks (format, length, option count)
- [ ] Duplicate/similarity detection
- [ ] Correct answer validation (LLM verification)
- [ ] Distractor plausibility scoring

### 7.4 Human Review Workflow
- [ ] Review queue for generated items
- [ ] Accept/reject/edit interface
- [ ] Feedback loop to improve generation

### 7.5 Pipeline Orchestration
- [ ] Domain spec → generation → synthetic cal → review → bank
- [ ] Batch generation jobs
- [ ] Progress tracking and reporting

**Milestone**: Specify a domain, generate hundreds of calibrated items with minimal human effort.

**Research Questions**:
- What makes a good domain specification?
- How to generate plausible distractors consistently?
- What's the human review acceptance rate?
- How does generation quality vary by domain?

---

## Phase 8: Learning Benchmarks

**Goal**: Standardized measurement of learning outcomes across LLM providers.

### 8.1 Benchmark Design
- [ ] Pre/post test methodology
- [ ] Learning gain metrics (raw gain, normalized gain, effect size)
- [ ] Control conditions (no tutoring, static content)
- [ ] Construct definitions (what are we measuring?)

### 8.2 Provider Integration
- [ ] Integration guides for LLM providers
- [ ] Standardized tutoring task protocols
- [ ] Response attribution (which provider, which session)
- [ ] Data sharing agreements

### 8.3 Analysis & Reporting
- [ ] Cross-provider comparison methodology
- [ ] Statistical tests for differences
- [ ] Effect size reporting
- [ ] Confidence intervals and sample size requirements

### 8.4 Public Benchmark
- [ ] Benchmark website/dashboard
- [ ] Methodology documentation
- [ ] Leaderboard (with caveats)
- [ ] Raw data access for researchers

**Milestone**: Published benchmark comparing learning outcomes across LLM tutoring systems.

**Research Questions**:
- What tutoring tasks are fair comparisons?
- How to control for learner differences across providers?
- What sample sizes needed for reliable comparisons?
- How to prevent teaching to the test?

---

## Phase 9: Advanced Measurement

**Goal**: Extend beyond basic MCQ to richer assessment.

### 9.1 Item Type Expansion
- [ ] Multiple-select (choose all that apply)
- [ ] Ordering/ranking items
- [ ] Matching items
- [ ] Fill-in-the-blank

### 9.2 Constructed Response
- [ ] Short answer items
- [ ] LLM-based scoring rubrics
- [ ] Scoring consistency analysis
- [ ] Human calibration of LLM scoring

### 9.3 Performance Tasks
- [ ] Multi-step problem scenarios
- [ ] Code execution and evaluation
- [ ] Simulation-based items

### 9.4 Validity Studies
- [ ] Correlation with external criteria
- [ ] Transfer assessment (apply knowledge to new contexts)
- [ ] Retention studies (delayed post-tests)
- [ ] Think-aloud protocols (what are learners actually doing?)

**Milestone**: Assessment types beyond MCQ with validated scoring.

---

## Research Agenda

Ongoing research threads across all phases:

### Synthetic Calibration
- Persona design optimization
- Domain-specific calibration models
- Synthetic-human correlation studies
- Minimum human validation requirements

### Item Generation
- Prompt engineering for item quality
- Distractor generation strategies
- Domain specification languages
- Automated quality metrics

### Learning Measurement
- What predicts learning vs performance?
- Tutoring interaction patterns that drive learning
- Learner characteristics that moderate effectiveness
- Long-term retention effects

### Fairness & Validity
- DIF analysis across demographics
- Construct validity evidence
- Consequential validity (effects of use)
- Bias in synthetic calibration

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Synthetic calibration doesn't predict human difficulty | Start validation early; be transparent about uncertainty |
| LLM providers don't adopt | Focus on value prop (differentiation on learning outcomes) |
| Item security (items leak to training data) | Continuous generation; secure item pools; monitoring |
| Gaming/teaching to the test | Diverse item types; transfer items; process measures |
| Scale/cost of LLM calls | Batch APIs; caching; efficient prompts |
| Psychometric complexity | Partner with measurement experts; use established methods |

---

## Success Metrics

### Phase 1-2
- Number of integrated clones
- Items served per month
- Response logging volume

### Phase 3-5
- Reliability of forms (target α > 0.8)
- Adaptive efficiency (items saved vs fixed form)
- User ability estimate precision

### Phase 6-7
- Synthetic-human correlation (target r > 0.7)
- Item generation acceptance rate (target > 60%)
- Time to calibrated bank (target < 1 week for new domain)

### Phase 8-9
- Provider participation in benchmarks
- Published research using MCQMCP data
- Validity evidence accumulated

---

## Timeline Philosophy

This roadmap is sequenced by dependencies, not calendar time. Each phase builds on the previous. Pace depends on:
- Resources available
- Research findings (some phases may need iteration)
- Partner/user adoption

Phases 1-3 are foundational and should proceed sequentially. Phases 4-5 (IRT, adaptive) and 6-7 (synthetic, generation) can partially parallelize. Phase 8 (benchmarks) requires critical mass of data and integrations.

---

*Building the measurement layer for learning in the age of AI.*
