"""Prevent fast synthetic probes from being reported as validated live engines."""
import unittest
import hashlib
from pathlib import Path
import tempfile
from unittest.mock import patch
import model
from report import summarize


class AcceptanceTests(unittest.TestCase):
    def test_fast_processing_cannot_approve_realism(self):
        report = summarize([30, 31, 32])
        self.assertEqual(report['processing_throughput_24fps'], 'PASS')
        self.assertEqual(report['overall_acceptance'], 'NOT ACCEPTED')
        for gate in ['appearance_realism', 'natural_expressions',
                     'natural_hand_occlusion', 'video_call_receiver']:
            self.assertEqual(report[gate], 'NOT TESTED')

    def test_durations_count_completed_work_not_display_refresh(self):
        report = summarize([100, 200, 300])
        self.assertEqual(report['completed_fps'], 5)
        self.assertEqual(report['completed_frames'], 3)
        self.assertEqual(report['processing_throughput_24fps'], 'FAIL')

    def test_invalid_timings_cannot_create_acceptance(self):
        for samples in [[], [0], [-1], [float('inf')], [float('nan')]]:
            with self.subTest(samples=samples), self.assertRaises(ValueError):
                summarize(samples)


class ModelIntegrityTests(unittest.TestCase):
    def test_same_size_corrupt_tensor_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            tensor = root / 'test.safetensors'
            tensor.write_bytes(b'good')
            expected = hashlib.sha256(b'good').hexdigest()
            with patch.object(model, 'MODEL_DIR', root), patch.object(model, 'TENSORS', {'test.safetensors': expected}):
                model.verify_tensors()
                tensor.write_bytes(b'evil')
                with self.assertRaises(ValueError):
                    model.verify_tensors()


if __name__ == '__main__':
    unittest.main()
