# External video analysis services

Local, staging and production use the same model client. It supports a
vision-capable, Chat Completions-compatible HTTP service with inline JPEG
inputs and structured JSON responses. Examples include a native llama.cpp
server on a Mac or a separately hosted inference service. Provider-specific
native APIs require an adapter and are not selected automatically.

## Server configuration

Place settings in `/root/netflix-secrets/video-analysis.env` on each deployment
host. The file is optional, root-owned, mode `0600`, and shared by app and worker.
Deployments validate its permissions and leave its contents unchanged. Without
an enabled configuration, video analysis remains disabled by default.

Use `ansible/templates/video-analysis.env.example` as the neutral template.
Configure these fields in the host file:

| Setting | Meaning / default |
| --- | --- |
| `VIDEO_ANALYSIS_ENABLED` | `true` enables requests; otherwise disabled |
| `VIDEO_ANALYSIS_URL` | Service root or API root ending in `/v1`; default `http://video-model:8080` |
| `VIDEO_ANALYSIS_MODEL` | Model name in API requests; default `video-category-model` |
| `VIDEO_ANALYSIS_MODEL_ID` | Stable model and quantization revision for stored run identity |
| `VIDEO_ANALYSIS_API_KEY` | Optional bearer credential, supplied only as an HTTP header |
| `VIDEO_ANALYSIS_HEALTH_PATH` | Absolute path on the same origin; default `/health` |
| `VIDEO_ANALYSIS_RESPONSE_FORMAT` | `json_schema` (default), or `json_object` |
| `VIDEO_ANALYSIS_TIMEOUT_MS` | Inference timeout, default 90000; range 1000–300000 |
| `VIDEO_ANALYSIS_HEALTH_TIMEOUT_MS` | Readiness timeout, default 1500; range 100–15000 |

For a reverse proxy at `https://models.example.invalid/inference/v1`, requests
go to `/inference/v1/chat/completions`. A service exposing model listing there
can use `VIDEO_ANALYSIS_HEALTH_PATH=/inference/v1/models`. Health checks use the
same bearer credential and require a successful HTTP response. A llama.cpp
server normally uses `/health`. Model listing availability alone does not
validate the configured model's image or JSON capabilities.

For live configuration, use HTTPS or a trusted private connection to the model
host. Selected video frames, category vocabulary and configured instructions
are sent to that endpoint. Credentials must not be placed in URLs, browser
settings, inventory files or Git. Redirects are rejected for both health and
inference requests. Responses and credentials are not included in errors.
Providers rejecting credentials produce a stable access-denied error.

Only parsed category responses are retained as evaluation diagnostics. The
provider must accept image inputs, the configured JSON response format and
the request's generation parameters. JSON-object mode still validates all
returned categories against the same bounded bilingual schema.

Domain-specific instructions and private category wording belong only in the
host environment file and database, as with local operation.

## Applying a change

After editing the host file, recreate **both app and jobs-worker** with the
deployment's normal Compose invocation and `up -d --no-deps app jobs-worker`.
Do not restart migrations or seeding to change a model endpoint. App needs
outbound access for readiness checks and category translation; worker needs
outbound access for video analysis. They already have outbound-capable
frontend/egress networks in the deployment templates.

App and worker must use identical settings. Changing endpoint, request model,
response format, revision ID or instructions changes run identity and prevents
reuse of incompatible partial analyses. Credential rotation, timeout changes
and health-path changes do not change inference identity. Existing completed
results remain historical snapshots. Providers changing weights behind a
stable model alias require an updated `VIDEO_ANALYSIS_MODEL_ID`.

## Local setup

The local stack retains its internal GPU service by default. In the ignored
`.env.docker.local`, `LOCAL_VIDEO_ANALYSIS_URL`, `LOCAL_VIDEO_ANALYSIS_MODEL`,
`LOCAL_VIDEO_ANALYSIS_MODEL_ID` and `LOCAL_VIDEO_ANALYSIS_HEALTH_PATH` override
the corresponding settings. Additional optional values, including the API key,
timeouts and response format, go in `.env.video-analysis.local`, which is loaded
by both services at runtime. Never copy a private file into an image or Git.

See [Mac setup](../video-model-macos.md) for the native Mac server.
This change prepares live deployments; it does not configure a provider or
deploy to a live host automatically.
