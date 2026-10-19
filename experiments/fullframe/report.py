"""Measured processing throughput is necessary, never sufficient for acceptance."""
import math
from statistics import fmean

def summarize(samples_ms):
    values = [float(value) for value in samples_ms]
    if not values or any(not math.isfinite(value) or value <= 0 for value in values):
        raise ValueError('Measurements must be positive finite completed-frame durations')
    mean = fmean(values)
    ordered = sorted(values)
    index = .95 * (len(ordered) - 1)
    lower = math.floor(index)
    p95 = ordered[lower] + (ordered[math.ceil(index)] - ordered[lower]) * (index - lower)
    fps = 1000 / mean
    return {
        'completed_frames': len(values),
        'mean_ms': round(mean, 2),
        'p95_ms': round(p95, 2),
        'completed_fps': round(fps, 2),
        'processing_throughput_24fps': 'PASS' if fps >= 24 else 'FAIL',
        'appearance_realism': 'NOT TESTED',
        'natural_expressions': 'NOT TESTED',
        'natural_hand_occlusion': 'NOT TESTED',
        'video_call_receiver': 'NOT TESTED',
        'overall_acceptance': 'NOT ACCEPTED',
    }

