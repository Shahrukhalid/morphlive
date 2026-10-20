# Whole-frame engine evaluation

An isolated SD-Turbo image-to-image implementation for Apple Silicon. It
regenerates the current input frame, including hair and surroundings, rather
than compositing a generated inner-face patch. It is **not an accepted live
appearance engine**, is not packaged with the app, and cannot be selected in
Studio. There is no camera, microphone, upload, or virtual output in this probe.

The upstream model is a prompt-conditioned image generator, not a trained
identity/expression-preserving video model. Fixed noise does not prove temporal
coherence. High strength can ignore the input; low strength can preserve an
unwanted beard. These are acceptance failures, not reasons to blend the original
face back in or report display refresh as generated FPS.

## Reproduce locally

Use Python 3.11 on Apple Silicon with the existing project native environment
(`native/requirements.txt`). Install these additional research dependencies:

```sh
.venv/bin/python -m pip install -r experiments/fullframe/requirements.txt
.venv/bin/python experiments/fullframe/install.py
.venv/bin/python experiments/fullframe/evaluate.py --size 512 --steps 2 --strength .5
```

Only installation downloads public model files. The fixed repository revision
and three tensor SHA-256 hashes are in `model.py`. Runtime loads local safetensors
only, with Hugging Face offline mode enabled. Weights stay in ignored
`.runtime/experiments/`; no credentials or hosted inference are required.

For a fixed-size Core ML denoiser, retaining the MPS encoder/decoder:

```sh
.venv/bin/python experiments/fullframe/convert.py --size 512
.venv/bin/python experiments/fullframe/evaluate.py --backend coreml --size 512
```

For the faster, lossy MIT-licensed tiny autoencoder, install it explicitly with
`install.py --tiny`, then add `--vae tiny` to evaluation. It has a separate pinned
revision and SHA-256 in `model.py`; inference never downloads it automatically.
Changing the decoder can materially change the generated appearance and texture.

Conversion records a prediction comparison against PyTorch. This is a numerical
probe, not a visual-quality certificate. Converted graphs remain ignored.

## Acceptance

`evaluate.py` uses only the existing fictional male reference, with synthetic
affine motion for repeatable timing. It saves a fictional input/output contact
sheet and an aggregate JSON record under ignored `artifacts/fullframe/`.
It does not accept private-media paths. It runs one frame at a time, encodes the
prompt once, resets seed 17 for each input, and does not blend prior output frames.

Timing includes preprocessing inside the engine, completed denoising, decoding,
device synchronization, and conversion to RGB. It excludes model/prompt loading,
camera capture, transport, and the video-call receiver. Warmups are excluded.
The benchmark reports the reciprocal of mean completed-frame duration, not
render/display/virtual-camera refresh rate.

At least 24 completed FPS is necessary. Convincing full appearance, preserved
natural expressions, hand occlusion, low receiver delay, and a received moving
call feed must also pass separately. Synthetic still-image motion cannot pass
those gates. Overall acceptance stays NOT ACCEPTED even when processing passes.
No production default should change based on this probe alone.

## Observed results — Apple M5 / 16 GB

All probes below used the fictional input and seed 17. They are short processing
measurements, not live-camera or video-call tests. The two-step, strength .5
configuration executes one denoising step; four steps at .75 executes three.

- MPS, full autoencoder, 512 square: three measured frames after one warmup,
  mean 1372.77 ms, p95 1429.42 ms, **0.73 completed FPS**.
- Core ML denoiser + MPS tiny autoencoder, 512 square: twelve measured frames
  after two warmups, mean 160.81 ms, p95 317.66 ms, **6.22 completed FPS**.
- Same accelerated path, four steps / strength .75, 512 square: twelve measured
  frames after two warmups, mean 415.73 ms, p95 1046.83 ms, **2.41 completed FPS**.
- Core ML + tiny autoencoder, 256 square: twelve measured frames after two
  warmups, mean 174.27 ms, p95 427.37 ms, **5.74 completed FPS**. Lower resolution
  did not improve throughput in this probe; do not infer that it will.

The converted 512 denoiser's random-input comparison with CPU PyTorch produced
mean absolute error .0005803, maximum .006754. At 256 these were .001359 and
.013682. This checks one numerical input per graph, not general equivalence.
Core ML Tools 9.0 warned that PyTorch 2.9.1 is outside its tested version range.

Visual inspection: whole-frame/head contours do change, but smooth/painterly
skin, artificial eye details and poor requested hairstyle adherence fail realistic
appearance acceptance. Stronger translation worsened texture. Natural motion,
hand occlusion and call reception remain NOT TESTED. **This candidate is rejected
for live-app integration.** Generated sheets and raw timing records stay local.
The reporting JSON keeps quality gates NOT TESTED because it cannot automate the
manual visual decision recorded here.

Run reporting regression checks without model dependencies:

```sh
python -m unittest discover -s experiments/fullframe -p 'test_*.py'
```

## Sources and licensing

- [SD-Turbo model documentation](https://huggingface.co/stabilityai/sd-turbo):
  separate Stability AI model terms; MorphLive's MIT license does not license
  these weights. The card lists imperfect photorealism and face-generation
  limitations. This experiment does not redistribute weights.
- [Diffusers Apple Silicon support](https://huggingface.co/docs/diffusers/optimization/mps).
- [Mac whole-frame diffusion investigation](https://github.com/ochyai/streamdiffusion-mac):
  motivated testing Core ML; its performance is not this Mac's measured result.
- [Apple Core ML conversion documentation](https://apple.github.io/coremltools/docs-guides/source/convert-pytorch-workflow.html).
- [Tiny AutoEncoder](https://huggingface.co/madebyollin/taesd): optional MIT
  autoencoder with a compatible latent interface; not a realism guarantee.

The wrapper, evaluation and adapter here are project code; no external camera
application, demo saving controls, or network inference server is imported.
