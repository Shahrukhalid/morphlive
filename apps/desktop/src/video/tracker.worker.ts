import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
let tracker: FaceLandmarker | undefined;
self.onmessage = async event => {
  if (event.data.type === 'init') {
    try {
      const fileset = await FilesetResolver.forVisionTasks(event.data.base + 'wasm');
      tracker = await FaceLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: event.data.base + 'models/face_landmarker.task', delegate: 'CPU' }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true });
      self.postMessage({ type: 'ready' });
    } catch (error) { self.postMessage({ type: 'error', message: 'Tracking unavailable: ' + (error instanceof Error ? error.message : 'model initialization failed') + '. Original and privacy modes remain available.' }); }
  } else if (event.data.type === 'frame') {
    const { bitmap, timestamp } = event.data;
    try {
      const result = tracker?.detectForVideo(bitmap, timestamp);
      self.postMessage({ type: 'result', timestamp, points: result?.faceLandmarks[0] || [], blendshapes: result?.faceBlendshapes[0]?.categories || [] });
    } catch { self.postMessage({ type: 'error', message: 'Face tracker failed. Restart the camera to retry.' }); }
    finally { bitmap.close(); }
  }
};
