# Model service on an Apple Silicon Mac

The Mac can provide inference while the application and database stay on the
existing PC. The model runs natively with llama.cpp/Metal. No media library or
private configuration needs to be copied to the Mac; selected frames are sent
to the configured model endpoint over the trusted local network.

On the Mac, install Homebrew if necessary using its official instructions,
then install the native server:

```sh
brew install llama.cpp
```

Copy `scripts/start-video-model-macos.sh` to the Mac and run:

```sh
VIDEO_MODEL_BIND_HOST=0.0.0.0 bash start-video-model-macos.sh
```

The first start downloads approximately 5.8 GB of public model weights and
verifies both SHA-256 checksums. Files remain in the user's cache directory.
The server stays in the foreground; stop it with Ctrl+C. Its default binding
without the variable is loopback only. LAN binding is intended for a trusted
home network, without port forwarding. macOS may request firewall permission.
Private instructions and category names remain in the application's local
configuration and database. They must not be added to the script or Git.

In a second Mac terminal, check readiness and find its Wi-Fi address:

```sh
curl --fail http://127.0.0.1:8080/health
ipconfig getifaddr en0
```

After readiness is confirmed, set these entries in the PC's ignored
`.env.docker.local`, replacing the example address with the Mac's address:

```dotenv
LOCAL_VIDEO_ANALYSIS_URL=http://192.168.1.50:8080
LOCAL_VIDEO_ANALYSIS_MODEL_ID=qwen3-vl-8b-q4km-5bcaa9cc-macos-v1
```

Recreate app and worker using the normal local Compose command with
`--no-deps app jobs-worker`; never rerun seeding. Changing the model identity
prevents caches and partial jobs from mixing the 4B and 8B model results.
Remove the two entries and recreate both services to return to the PC model.
The application sends requests to one endpoint at a time; this does not pool
the two machines' memory or implement a simultaneous benchmark.

For an initial comparison, keep the judgments, prompt, interval selection,
image resolution and confidence threshold fixed, then compare run metrics and
completion times. Use stored original images for a later controlled replay
benchmark; the current run button captures a fresh set of images from each
unchanged source. The Mac service has not been hardware-tested by this setup.

Sources:
- [Official Qwen model](https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct-GGUF)
- [llama.cpp installation](https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md)
- [Homebrew installation](https://brew.sh/)
