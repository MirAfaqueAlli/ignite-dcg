'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

// const RPM_URL =
//   'https://models.readyplayer.me/69b7af131939de62b6beeac9.glb' +
//   '?morphTargets=ARKit%2COculus+Visemes&textureAtlas=1024&lod=0';
const RPM_URL =
  'https://models.readyplayer.me/69b7f1ee2de3dcd98339ff8f.glb' +
  '?morphTargets=ARKit%2COculus+Visemes&textureAtlas=1024&lod=0';

function setMorph(meshes: THREE.SkinnedMesh[], name: string, value: number) {
  for (const m of meshes) {
    const idx = m.morphTargetDictionary?.[name];
    if (idx !== undefined && m.morphTargetInfluences)
      m.morphTargetInfluences[idx] = THREE.MathUtils.clamp(value, 0, 1);
  }
}

/* ─────────────────────────────────────────────────────── */
function RPMCharacter({
  isSpeakingRef,
  onLoaded,
}: {
  isSpeakingRef: React.RefObject<boolean>;
  onLoaded: () => void;
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null!);
  const meshesRef = useRef<THREE.SkinnedMesh[]>([]);
  const bonesRef = useRef<Record<string, THREE.Object3D>>({});
  const tRef = useRef(0);
  const initRef = useRef(false);
  const poseSetRef = useRef(false);

  /* blink */
  const blinkNext = useRef(3.0);
  const blinkPhase = useRef<'open' | 'close' | 'reopen'>('open');
  const blinkT = useRef(0);

  /* smooth visemes */
  const vis = useRef({ aa: 0, O: 0, PP: 0, FF: 0, jaw: 0, smile: 0.10, brow: 0 });

  useEffect(() => {
    if (initRef.current || !groupRef.current) return;
    initRef.current = true;

    const loader = new GLTFLoader();
    loader.crossOrigin = 'anonymous';

    loader.load(RPM_URL, gltf => {
      const root = gltf.scene;
      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      groupRef.current.add(root);

      const meshes: THREE.SkinnedMesh[] = [];
      const bones: Record<string, THREE.Object3D> = {};
      root.traverse(obj => {
        if ((obj as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(obj as THREE.SkinnedMesh);
        if ((obj as THREE.Bone).isBone) bones[obj.name] = obj;
      });
      meshesRef.current = meshes;
      bonesRef.current = bones;

      /* ── Log all bone names once so we know exactly what's in the model ── */
      console.log('[RPM bones]', Object.keys(bones));


      const setRot = (name: string, x: number, y: number, z: number) => {
        if (bones[name]) bones[name].rotation.set(x, y, z);
      };



      /* Head + Neck — POSITIVE X = look DOWN/forward at camera */
      setRot('Neck', 0.15, 0, 0);
      setRot('Head', 0.10, 0, 0);

      poseSetRef.current = true;

      /* ── Fit camera ── */
      const box = new THREE.Box3().setFromObject(root);
      root.position.y = -box.min.y;
      const h = box.max.y - box.min.y;
      
      // Zoom out slightly by using a larger bounding frame
      const frameHeight = h * 0.66; 
      // Shift our aiming focus higher up her body (pushes the model lower on the screen)
      const focusY = h * 0.76; 
      const fov = 36;
      // Calculate depth, and add +0.05 manually to adjust the zoom
      const dist = ((frameHeight / 2) / Math.tan((fov / 2) * (Math.PI / 180))) + 0.05;
      
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = fov;
      
      // We raise the camera Y-position so she renders lower down with more breathing room at the top
      cam.position.set(0, focusY + 0.10, dist);
      cam.lookAt(0, focusY - 0.05, 0);
      cam.updateProjectionMatrix();

      onLoaded();
    }, undefined, err => console.error('[RPM]', err));

    return () => {
      if (groupRef.current?.children.length)
        groupRef.current.remove(...groupRef.current.children);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* delay start */
  const talkingStartT = useRef(0);

  useFrame((_, delta) => {
    if (!meshesRef.current.length || !poseSetRef.current) return;
    tRef.current += delta;
    const t = tRef.current;
    
    let talking = isSpeakingRef.current ?? false;
    if (talking) {
      if (talkingStartT.current === 0) talkingStartT.current = t;
      // Add slight delay before mouth physically begins moving to match audio spinup
      if (t - talkingStartT.current < 0.25) talking = false;
    } else {
      talkingStartT.current = 0;
    }

    const meshes = meshesRef.current;
    const b = bonesRef.current;

    /* ── Maintain idle pose every frame (prevents any default animation fighting us) ── */
    const lerp = (bone: THREE.Object3D | undefined, axis: 'x' | 'y' | 'z', target: number, a = 0.08) => {
      if (bone) bone.rotation[axis] = THREE.MathUtils.lerp(bone.rotation[axis], target, a);
    };

    /* Arms — bring DOWN to normal relaxed pose at sides */
    // Positive X drops the arm down based on the previous UP screenshot!
    lerp(b['LeftArm'], 'x', 1.25, 0.1);
    lerp(b['LeftArm'], 'y', 0, 0.1);
    lerp(b['LeftArm'], 'z', 0.1, 0.1); // tiny bit of forward/inward relax

    lerp(b['RightArm'], 'x', 1.25, 0.1);
    lerp(b['RightArm'], 'y', 0, 0.1);
    lerp(b['RightArm'], 'z', -0.1, 0.1);

    /* Normal straight forearms with slight inwards natural bend */
    lerp(b['LeftForeArm'], 'x', 0, 0.1);
    lerp(b['LeftForeArm'], 'y', 0, 0.1);
    lerp(b['LeftForeArm'], 'z', 0.1, 0.1);

    lerp(b['RightForeArm'], 'x', 0, 0.1);
    lerp(b['RightForeArm'], 'y', 0, 0.1);
    lerp(b['RightForeArm'], 'z', -0.1, 0.1);

    /* Keep hands straight */
    lerp(b['LeftHand'], 'x', 0, 0.1);
    lerp(b['LeftHand'], 'y', 0, 0.1);
    lerp(b['LeftHand'], 'z', 0, 0.1);

    lerp(b['RightHand'], 'x', 0, 0.1);
    lerp(b['RightHand'], 'y', 0, 0.1);
    lerp(b['RightHand'], 'z', 0, 0.1);
    lerp(b['RightHand'], 'y', 0, 0.1);
    lerp(b['RightHand'], 'z', 0, 0.1);

    /* Subtle breathing on spine */
    const breath = Math.sin(t * (Math.PI / 3)) * 0.008;
    lerp(b['Spine'], 'x', breath, 0.05);
    lerp(b['Spine1'], 'x', breath * 0.6, 0.05);
    lerp(b['Spine2'], 'x', breath * 0.3, 0.05);

    /* Head + Neck — positive X = look forward/down at camera */
    const nk = b['Neck'];
    if (nk) {
      nk.rotation.x = THREE.MathUtils.lerp(nk.rotation.x, 0.15 + Math.sin(t * 0.22) * 0.008, 0.06);
      nk.rotation.y = THREE.MathUtils.lerp(nk.rotation.y, Math.sin(t * 0.34) * 0.04, 0.06);
    }
    const hd = b['Head'];
    if (hd) {
      const nod = talking ? Math.sin(t * 2.1) * 0.022 : 0;
      hd.rotation.x = THREE.MathUtils.lerp(hd.rotation.x, 0.10 + nod + Math.sin(t * 0.29) * 0.006, 0.08);
      hd.rotation.y = THREE.MathUtils.lerp(hd.rotation.y, Math.sin(t * 0.41) * 0.05, 0.07);
      hd.rotation.z = THREE.MathUtils.lerp(hd.rotation.z, Math.sin(t * 0.19) * 0.009, 0.06);
    }

    /* ── Visemes ── */
    const v = vis.current;
    const lv = (k: keyof typeof v, tgt: number, spd = 0.22) => {
      v[k] = THREE.MathUtils.lerp(v[k], tgt, spd);
    };
    if (talking) {
      // Much tighter amplitude so mouth movement looks natural/realistic and not over-exaggerated
      const raw = Math.abs(Math.sin(t * 8.6)) * 0.60 + Math.abs(Math.sin(t * 14.2 + 0.9)) * 0.20;
      const open = THREE.MathUtils.clamp(raw, 0, 1);
      lv('aa', open * 0.8, 0.28);
      lv('O', Math.max(0, Math.sin(t * 6.1)) * 0.25, 0.22);
      lv('PP', Math.max(0, Math.sin(t * 4.0 + 1.3)) * 0.15, 0.20);
      lv('FF', Math.max(0, Math.sin(t * 5.0 + 0.7)) * 0.12, 0.20);
      lv('jaw', open * 0.24, 0.28);
      lv('smile', 0.24, 0.10);
      lv('brow', open * 0.20, 0.12);
    } else {
      lv('aa', 0, 0.18); lv('O', 0, 0.18); lv('PP', 0, 0.18);
      lv('FF', 0, 0.18); lv('jaw', 0, 0.18);
      lv('smile', 0.10, 0.08); lv('brow', 0, 0.10);
    }
    setMorph(meshes, 'viseme_aa', v.aa);
    setMorph(meshes, 'viseme_O', v.O);
    setMorph(meshes, 'viseme_PP', v.PP);
    setMorph(meshes, 'viseme_FF', v.FF);
    setMorph(meshes, 'jawOpen', v.jaw);
    setMorph(meshes, 'mouthOpen', v.jaw * 0.40);
    setMorph(meshes, 'mouthSmile', v.smile);
    setMorph(meshes, 'mouthSmileLeft', v.smile);
    setMorph(meshes, 'mouthSmileRight', v.smile);
    setMorph(meshes, 'browInnerUp', v.brow);

    /* ── Blink ── */
    if (t > blinkNext.current && blinkPhase.current === 'open') {
      blinkPhase.current = 'close'; blinkT.current = 0;
      blinkNext.current = t + 2.0 + Math.random() * 4.0;
    }
    let blinkVal = 0;
    if (blinkPhase.current !== 'open') {
      blinkT.current += delta;
      const half = 0.055;
      if (blinkPhase.current === 'close') {
        blinkVal = Math.min(blinkT.current / half, 1);
        if (blinkT.current >= half) { blinkPhase.current = 'reopen'; blinkT.current = 0; }
      } else {
        blinkVal = 1 - Math.min(blinkT.current / half, 1);
        if (blinkT.current >= half) { blinkPhase.current = 'open'; blinkVal = 0; }
      }
    }
    setMorph(meshes, 'eyeBlinkLeft', blinkVal);
    setMorph(meshes, 'eyeBlinkRight', blinkVal);
    setMorph(meshes, 'EyeBlink_L', blinkVal);
    setMorph(meshes, 'EyeBlink_R', blinkVal);
  });

  return <group ref={groupRef} />;
}

/* ─────────────────────────────────────────────────────────── */
export default function Avatar({ isSpeaking }: { isSpeaking: boolean }) {
  const isSpeakingRef = useRef(isSpeaking);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none opacity-40">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--maroon)', borderTopColor: 'transparent' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--maroon)' }}>
            Loading avatar…
          </span>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 1.2, 3.0], fov: 36, near: 0.05, far: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[1.5, 4, 3]} intensity={1.3} />
        <directionalLight position={[-1, 2, 2]} intensity={0.6} color="#FFE4B0" />
        <pointLight position={[0, 3, 1.5]} intensity={0.5} color="#FFF8F0" />
        <pointLight position={[0, 1.5, -1.5]} intensity={0.2} color="#B0C4FF" />
        <RPMCharacter isSpeakingRef={isSpeakingRef} onLoaded={() => setLoaded(true)} />
      </Canvas>

      {isSpeaking && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-0.5 px-3 py-2 rounded-xl border shadow"
          style={{ background: 'rgba(255,252,248,0.90)', borderColor: 'var(--card-border)' }}>
          {[5, 10, 14, 8, 13, 7, 11, 9, 6, 12].map((h, i) => (
            <span key={i} className="inline-block w-1 rounded-full"
              style={{
                height: h, background: 'var(--maroon)',
                animation: `barAnim 0.5s ease ${i * 0.05}s infinite alternate`,
                transformOrigin: 'bottom'
              }} />
          ))}
          <span className="ml-2 text-[10px] font-semibold" style={{ color: 'var(--maroon)' }}>
            Speaking
          </span>
        </div>
      )}

      <style>{`
        @keyframes barAnim {
          from { transform: scaleY(0.2); opacity: 0.4; }
          to   { transform: scaleY(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
}