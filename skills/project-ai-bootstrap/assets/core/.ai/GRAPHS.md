# Work and Improvement Graphs

Graph Engineering connects feedback loops with explicit authority, cadence, evidence, and frozen anchors. It is more than a diagram of task order.

## Work graph

```mermaid
flowchart LR
    U["User goal"] --> P["Planning and scope"]
    P --> D["Domain and architecture"]
    D --> S["Specification and task graph"]
    S --> I["Implementation and TDD"]
    I --> R["Code review"]
    R --> Q["Integration verification"]
    Q --> M["Documentation sync"]
    M --> G{"Release approval"}
    G -->|approved| X["Deployment adapter"]
    G -->|held| S

    A1["Anchor: user decisions and scope"] -.-> P
    A2["Anchor: AC and held-out tests"] -.-> Q
    A3["Anchor: security and release policy"] -.-> G
```

Every active node has inputs, outputs, owner, acceptance criteria, evidence, and terminal states. Parallelize only independent work that does not compete for the same mutable surface.

## Improvement graph

```mermaid
flowchart TD
    O["Operational evidence"] --> H["Harness improvement candidate"]
    Q["Quality evidence"] --> H
    D["Documentation drift"] --> H
    H --> E["One-variable experiment"]
    E --> V["Held-out evaluation"]
    V --> G{"Governance approval"}
    G -->|better without regression| C["Keep change"]
    G -->|regression or unclear| B["Roll back"]
    C --> O
    C --> Q
    C --> D

    A1["Frozen: user judgment and product scope"] -.-> G
    A2["Frozen: security and real outcomes"] -.-> V
```

## Ownership and cadence

| Loop | Default owner | Cadence | Optimization metric | Counter-metric | Anchor or veto |
|---|---|---|---|---|---|
| Planning | Human product owner | Before a feature | Specification completeness | Scope growth | Product sources and explicit decisions |
| Implementation | Development agent | Per work item | AC pass rate | Regressions and change size | Tests and architecture rules |
| Review | Independent review perspective | Per change | Valid defects found | False positives and needless refactors | Original specification and diff |
| Documentation | Implementer | When behavior changes | Code-doc consistency | Documentation volume | Actual behavior and ADRs |
| Release | Human operator | Per release | Deployment success | Incidents and rollback | Human approval and operating checks |
| Harness improvement | Human governor | After repeated failure | Held-out success rate | Cost, time, and regressions | Frozen evaluation and rollback |

Replace default owners and metrics with project-specific values. Fast loops must not redefine targets owned by slower or human-governed loops.
