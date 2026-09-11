# AutoDev decision record

This document records decisions that are evidenced by the repository history and implementation. Dates come from commit metadata. The repository does not contain a named stakeholder register, so stakeholder references use the roles visible from the work: **project maintainer/developer**, **end user**, and **external platform providers** (GitHub and OpenAI). Where the exact meeting participants or rationale were not recorded, that limitation is stated instead of inferred as fact.

## Decision log

| Date | Decision | Stakeholders | Outcome and evidence |
| --- | --- | --- | --- |
| 2026-09-05 | Establish a full-stack application with a Next.js client, Spring Boot server, and PostgreSQL infrastructure. | Project maintainer/developer; end user | Foundation created in `b7629a4`; separate `client/`, `server/`, and Docker Compose database layers. |
| 2026-09-05 | Use Docker Compose with `pgvector/pgvector:pg16` for local persistence and vector search. | Project maintainer/developer; operations concern | `docker-compose.yaml` exposes PostgreSQL on host port 5433, initializes extensions, and persists data in `autodev_pg_data`. |
| 2026-09-06 | Use GitHub OAuth2 and server-side HTTP sessions instead of application-managed bearer tokens. | Project maintainer/developer; GitHub; end user | Implemented in `fe46fe7`; authenticated `/api/**` routes use the `AUTODEV_SESSION` cookie with HTTP-only and SameSite=Lax settings. |
| 2026-09-06 | Persist GitHub access tokens encrypted at rest. | Project maintainer/developer; GitHub; end user | `fe46fe7` added token encryption configuration and user persistence; the token-encryption fix was recorded in `18318a4`. |
| 2026-09-06 | Require ownership checks on repository and chat operations. | Project maintainer/developer; end user | `RepoService` and `ChatService` resolve resources through user-scoped repository queries before reading, indexing, or chatting. |
| 2026-09-07 | Index repository source asynchronously and expose progress states. | Project maintainer/developer; end user | `dbab08a` added `IndexingService`, `INDEXING`, `READY`, and `FAILED` state handling, plus a dedicated executor. |
| 2026-09-07 | Filter files by supported language/path and maximum size before embedding. | Project maintainer/developer; cost and quality concerns | `CodeFileFilter` excludes generated/dependency directories, lock files, hidden files, unsupported extensions, and files over 102,400 bytes. |
| 2026-09-07 | Use repository metadata, file metadata, chunk metadata, and a repository filter for retrieval. | Project maintainer/developer; end user | `CodeChunker` stores `repoId`, `filePath`, `language`, and `chunkIndex`; `CodeContextRetriever` applies `repoId` and retrieves eight chunks. |
| 2026-09-08 | Use Spring AI with OpenAI embeddings and `gpt-4o-mini` for RAG chat. | Project maintainer/developer; OpenAI; end user | `7d94ef8` added the chat pipeline, prompt builder, citation mapper, and Spring MVC streaming integration. |
| 2026-09-08 | Stream answers with Server-Sent Events and persist the final assistant message. | Project maintainer/developer; end user | `ChatController` returns `text/event-stream`; `ChatStreamHandler` emits tokens and stores citations with the assistant message. |
| 2026-09-11 | Refine the dashboard, chat interface, settings, and overview pages. | Project maintainer/developer; end user | `8b5319f` added the current dashboard and chat UI surfaces without changing the server-side RAG boundary. |
| 2026-09-11 | Do not publish unmeasured latency, throughput, error-rate, utilization, or retrieval-quality claims. | Project maintainer/developer; documentation users | No benchmark harness or labeled retrieval dataset is present. `README.md` records implementation constants and marks missing measurements explicitly. |

## Trade-off analysis

### Application architecture

| Choice | Alternative considered | Trade-off | Decision |
| --- | --- | --- | --- |
| Next.js + React frontend with Spring Boot API | A single server-rendered application or a different SPA backend | Two runtimes add local setup, but provide a typed interactive UI and a clear API boundary for SSE and OAuth callbacks. | Retained because the repository already separates client and server responsibilities. |
| Spring MVC + `SseEmitter` | Spring WebFlux/reactive end-to-end streaming | WebFlux may improve concurrency for many long-lived streams, but introduces a broader reactive programming model. The current flow is a conventional MVC application with short-lived model streams. | Use MVC and `SseEmitter`; this is the implemented integration. |
| PostgreSQL + `pgvector` | Separate vector database | A separate vector service could scale independently, but adds deployment, credentials, and consistency overhead. PostgreSQL keeps relational and vector state in one local operational footprint. | Use PostgreSQL with `pgvector` for the current project scope. |
| HNSW cosine search | Exact search or another approximate index | Exact search is simpler but becomes more expensive as the document set grows; HNSW provides approximate nearest-neighbor search with a standard cosine metric. | Use HNSW and cosine distance as configured in `application.properties`. |
| GitHub OAuth2 | Local username/password or custom token login | Local credentials create password lifecycle and security responsibilities; OAuth2 delegates identity to GitHub and aligns access with repositories the user owns. | Use GitHub OAuth2 with a server session. |
| Server session cookie | Stateless JWTs | JWTs simplify horizontal request handling but require token lifecycle/revocation decisions and client-side storage concerns. A session cookie supports server-side invalidation and is already supported by Spring Security. | Use `AUTODEV_SESSION`, HTTP-only, SameSite=Lax, seven-day timeout. |
| Dedicated indexing executor | Run indexing on request threads or use a separate job platform | Request-thread indexing would block HTTP requests; a job platform would add infrastructure. A bounded executor is a smaller solution for the current workload. | Use 2 core threads, 4 maximum threads, and queue capacity 50. |
| Re-index by deleting repository vectors first | Incremental diff-based indexing | Incremental indexing can reduce work but requires reliable commit/diff tracking and stale-vector cleanup. Full replacement is simpler and guarantees that removed files do not remain searchable. | Delete vectors for the repository, then rebuild its index. |
| Chunk by Spring AI token splitter | Parser-specific AST chunking | AST chunking may preserve semantic units better across languages, but requires language-specific parsers and more maintenance. Token splitting supports many file types with one implementation. | Use a configured 800-character target translated to a minimum 50-token splitter size. |
| OpenAI managed embeddings and generation | Self-hosted models | Self-hosting reduces external dependency exposure but increases hardware, deployment, and model-operations requirements. | Use OpenAI models supplied through environment configuration. |
| Repository-scoped top-k retrieval | Global retrieval or large unconstrained context | Global retrieval risks cross-repository context leakage; larger contexts increase cost and noise. | Use `topK=8` with a required `repoId` filter. |

### Quality and measurement trade-offs

The implementation favors traceability and safe documentation over unsupported claims. Repository filtering, file-path headers, metadata, and citations are quality controls, but they are not equivalent to measured accuracy improvements. Because no labeled query set, baseline retriever, or evaluation script exists, the project does not claim values for accuracy, context relevance, hit rate@k, or MRR.

## Challenges and resolutions

| Challenge | Root cause | Implemented resolution | Post-fix validation |
| --- | --- | --- | --- |
| Sensitive configuration needed to work across local environments without committing secrets. | Database, OAuth, encryption, and OpenAI values differ by environment. | Move configuration to environment-backed Spring properties and require the database password in Compose; record the change in `18318a4`. | Configuration files reference environment variables rather than literal credentials. Secret values are not part of the committed implementation. |
| Long-running repository indexing could block API requests. | GitHub tree/file reads and embedding calls are network-bound and can involve many files. | Mark indexing asynchronous and run it on a bounded `indexingExecutor`; return `202 Accepted` and expose progress status. | `RepoController` starts `indexAsync` after persisting `INDEXING`; `IndexingService` writes progress and terminal `READY`/`FAILED` states. |
| Dependency/generated files would pollute the index and increase embedding cost. | Repositories contain `node_modules`, build artifacts, lock files, generated output, and files outside the supported language set. | Add path, filename, extension, hidden-file, and size filters in `CodeFileFilter`. | The filter explicitly excludes configured directories and lock files and rejects files larger than 102,400 bytes. |
| Re-indexing could leave stale vectors for deleted or changed files. | A new indexing pass does not automatically remove documents that are absent from the current tree. | Delete existing vectors using the repository metadata filter before building the new index. | `IndexingService.deleteExistingVectors` applies the same `repoId` filter used by retrieval. |
| Retrieved context could cross repository boundaries. | A vector store may contain documents from many repositories. | Add `repoId` to every chunk and require an equality filter in `CodeContextRetriever`. | Retrieval constructs a `FilterExpressionBuilder.eq("repoId", repositoryId.toString())` expression for every question. |
| Users could chat before a repository was usable. | Indexing is asynchronous, so repository state changes after the start request. | Require `IndexStatus.READY` before session creation and before streaming a message. | `ChatService.createSession` and `streamReply` reject non-ready repositories with a bad-request error. |
| Model responses need to be visible before generation completes. | Waiting for the entire completion increases perceived latency. | Use Spring MVC SSE and a browser-side stream parser; persist the completed assistant message and citations. | `ChatController` produces `text/event-stream`, and the client contains `lib/stream-chat.ts` for incremental events. |
| GitHub indexing requests could be too aggressive. | A repository index can issue many tree and file requests. | Add a configurable 50 ms delay between indexing API calls and interrupt-safe handling. | `GitHubRateLimiter` is invoked for each processed file and restores the interrupted flag before raising an error. |
| Documentation requirements requested metrics that the repository does not measure. | No committed load-test harness, monitoring output, or retrieval ground-truth dataset exists. | Document only source-verified constants and explicitly label latency, throughput, resource, and RAG-quality values as not measured. | `README.md` contains a benchmark-status section and does not fabricate before/after retrieval numbers. |

