"""Face-local compositing; no camera access or media persistence."""
import cv2
import numpy as np

OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,
      400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]


def blend_face(rgb, generated, matrix, points):
    """Blend only valid generated pixels, leaving the rest of the frame exact.

    A bounded uniform colour correction uses the upper face, avoiding the
    previous spatial transfer of original mouth/beard shading into the swap.
    Feathering goes inward from the tracked oval and generated crop boundary.
    """
    h,w=rgb.shape[:2]
    oval=points[OVAL]
    radius=max(3,int(np.ptp(oval[:,0])*.025))
    low=np.floor(oval.min(0)).astype(int)-2
    high=np.ceil(oval.max(0)).astype(int)+3
    x0,y0=np.maximum(low,[0,0]);x1,y1=np.minimum(high,[w,h])
    if x1<=x0 or y1<=y0:
        return rgb.copy()
    local=points-np.array([x0,y0],np.float32)
    shape=(int(y1-y0),int(x1-x0))
    mask=np.zeros(shape,np.uint8)
    cv2.fillConvexPoly(mask,cv2.convexHull(local[OVAL].astype(np.int32)),1)
    inverse=cv2.invertAffineTransform(matrix)
    inverse[:,2]-=[x0,y0]
    warped=cv2.warpAffine(generated,inverse,(shape[1],shape[0]))
    support=cv2.warpAffine(np.ones(generated.shape[:2],np.float32),inverse,
                           (shape[1],shape[0]),borderMode=cv2.BORDER_CONSTANT)
    mask[support<.999]=0
    # A zero border makes distance-to-boundary defined even at image edges.
    distance=cv2.distanceTransform(np.pad(mask,1),cv2.DIST_L2,3)[1:-1,1:-1]
    alpha=np.clip(distance/max(1,radius*4),0,1)[...,None]
    target=rgb[y0:y1,x0:x1]
    upper=(mask>0)&(np.arange(shape[0])[:,None]<local[1,1])&(alpha[...,0]>.95)
    if np.count_nonzero(upper)>=32:
        delta=np.median(target[upper],axis=0)-np.median(warped[upper],axis=0)
        warped=np.clip(warped.astype(np.float32)+np.clip(delta,-24,24)*.5,0,255)
    # Match illumination near the seam only; the fully replaced interior does
    # not inherit the original mouth or facial-hair shading.
    sigma=max(1,radius*2*64/max(shape))
    target_light=cv2.resize(target.astype(np.float32),(64,64),interpolation=cv2.INTER_AREA)
    generated_light=cv2.resize(warped.astype(np.float32),(64,64),interpolation=cv2.INTER_AREA)
    correction=cv2.GaussianBlur(target_light,(0,0),sigma)-cv2.GaussianBlur(generated_light,(0,0),sigma)
    correction=cv2.resize(correction,(shape[1],shape[0]))
    warped=np.clip(warped+correction*.6*(1-alpha),0,255)
    result=rgb.copy()
    result[y0:y1,x0:x1]=np.clip(warped*alpha+target*(1-alpha),0,255).astype(np.uint8)
    return result
