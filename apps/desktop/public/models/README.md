# Optional face tracking model

Run `npm run model:install` to explicitly download the pinned official Google
MediaPipe Face Landmarker float16 v1 model. It is SHA-256 verified before use.
No automatic model downloads occur at application startup.

SHA-256: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`

Source: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

MediaPipe code is Apache-2.0. Review Google's model terms before redistribution:
https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker

The model is excluded from version control. A local application package built
after installation includes it; do not distribute packages without model review.
Original camera, studio color adjustment, and anonymous avatar fallback work
without a model. Face-attached masks require it.
