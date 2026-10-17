# MorphLive engineering rules

Keep all capture and processing local. Never start devices without a user action.
Do not log, record, or upload media or persist device identifiers.
Use bounded queues and stop every track and output during emergency stop.
Keep renderer isolation, sandboxing, and local-only permissions enabled.
Run `npm test`, `npm run build`, and `npm run check:privacy` before committing.
Report hardware and conferencing tests as NOT TESTED until actually observed.
Do not add AI co-author trailers. Use a GitHub noreply commit identity.
Do not publish model weights, private samples, logs, or generated packages.
