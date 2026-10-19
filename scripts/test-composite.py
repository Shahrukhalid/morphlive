"""Numerical compositing checks with synthetic arrays; no models or capture."""
from pathlib import Path
import sys
import unittest
import cv2
import numpy as np

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native/morphlive_engine'))
from composite import blend_face, OVAL


def landmarks():
    points=np.full((478,2),64,dtype=np.float32)
    angles=np.linspace(0,2*np.pi,len(OVAL),endpoint=False)
    points[OVAL]=np.column_stack([64+40*np.cos(angles),64+48*np.sin(angles)])
    return points


class CompositeTests(unittest.TestCase):
    def test_background_is_exact_and_inputs_are_not_mutated(self):
        rgb=np.full((128,128,3),120,np.uint8);source=rgb.copy()
        generated=np.full_like(rgb,200)
        result=blend_face(rgb,generated,np.eye(2,3,dtype=np.float32),landmarks())
        self.assertTrue(np.array_equal(rgb,source))
        self.assertTrue(np.array_equal(result[:12],source[:12]))
        self.assertTrue(np.array_equal(result[:,:20],source[:,:20]))
        self.assertGreater(int(result[64,64,0]),120)
        self.assertEqual(result.dtype,np.uint8)

    def test_occluded_foreground_pixels_are_preserved_exactly(self):
        rgb=np.full((128,128,3),120,np.uint8);rgb[45:65]=[80,110,140]
        generated=np.full_like(rgb,220);visible=np.ones((128,128),np.float32);visible[45:65]=0
        result=blend_face(rgb,generated,np.eye(2,3,dtype=np.float32),landmarks(),visibility=visible)
        self.assertTrue(np.array_equal(result[45:65],rgb[45:65]))
        self.assertGreater(int(result[80,64,0]),120)

    def test_invalid_visibility_is_rejected(self):
        rgb=np.full((128,128,3),120,np.uint8)
        with self.assertRaises(ValueError):
            blend_face(rgb,rgb,np.eye(2,3,dtype=np.float32),landmarks(),np.full((128,128),np.nan))

    def test_uncovered_generated_crop_never_adds_black(self):
        rgb=np.full((128,128,3),120,np.uint8)
        generated=np.full((48,48,3),200,np.uint8)
        result=blend_face(rgb,generated,np.eye(2,3,dtype=np.float32),landmarks())
        self.assertGreaterEqual(int(result.min()),120)
        self.assertTrue(np.array_equal(result[64:],rgb[64:]))

    def test_original_dark_mouth_patch_is_not_copied_into_generated_face(self):
        rgb=np.full((128,128,3),120,np.uint8);rgb[70:85,50:78]=0
        generated=np.full_like(rgb,180)
        result=blend_face(rgb,generated,np.eye(2,3,dtype=np.float32),landmarks())
        self.assertGreater(int(result[76,64,0]),160)
        self.assertLessEqual(abs(int(result[76,64,0])-int(result[55,64,0])),1)


if __name__=='__main__':
    unittest.main()
