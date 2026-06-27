import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Image, Billboard, Line, Html, useTexture } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import '../styles/space.css';

// Space Mode — the flagship 3D "constellation" board.
// No idle float / auto-camera: the PLAYER controls movement. Drag pans the world
// like walking a character across a map (things shift the opposite way, new ones
// come into view); tap a node to travel to it. The whole cast is laid out — drag
// to explore it. Falls back to Classic without WebGL.
// NOTE: travel-on-select animation + dynamic-gradient compass land in the next pass.

const POSTER_W = 'https://image.tmdb.org/t/p/w342';
const PROFILE_W = 'https://image.tmdb.org/t/p/w185';
const SPACING = 1.35;     // world units between candidates in the strip
const PAN_FACTOR = 0.016; // screen px -> world units while dragging
const PAN_Y_LIMIT = 1.6;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

// Rounded-rectangle movie poster.
function MovieCard({ url, scale = [1.6, 2.4], opacity = 1 }) {
  if (!url) {
    return (
      <mesh>
        <planeGeometry args={scale} />
        <meshBasicMaterial color="#15151c" transparent opacity={opacity} />
      </mesh>
    );
  }
  return <Image url={url} scale={scale} radius={0.1} transparent opacity={opacity} />;
}

// Round, face-centered headshot: square-crop from the top of the portrait + circle mask.
function RoundHead({ url, radius = 0.36 }) {
  const tex = useTexture(url);
  useMemo(() => {
    const img = tex.image;
    const aspect = img && img.height ? img.width / img.height : 0.667;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.center.set(0, 0);
    tex.repeat.set(1, aspect);
    tex.offset.set(0, Math.max(0, 1 - aspect - 0.04));
    tex.needsUpdate = true;
  }, [tex]);
  return (
    <group>
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[radius * 1.1, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
      </mesh>
      <mesh>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function InitialsHead({ label, radius = 0.36 }) {
  return (
    <group>
      <mesh>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color="#26262f" />
      </mesh>
      <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="space-bubble-initials">{(label || '?').slice(0, 1)}</div>
      </Html>
    </group>
  );
}

function Bubble({ item, kind, position, onPick }) {
  const [hovered, setHovered] = useState(false);
  const isActor = kind === 'actors';
  const url = isActor
    ? (item.profile_path ? PROFILE_W + item.profile_path : null)
    : (item.poster_path ? POSTER_W + item.poster_path : null);
  const label = isActor ? item.name : item.title;
  const labelY = isActor ? -0.58 : -0.8;

  return (
    <group position={position}>
      <Billboard>
        <group
          scale={hovered ? 1.12 : 1}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
          onClick={(e) => { e.stopPropagation(); onPick(item); }}
        >
          {isActor ? (
            url ? <RoundHead url={url} /> : <InitialsHead label={label} />
          ) : (
            <MovieCard url={url} scale={[0.74, 1.11]} />
          )}
          <Html center position={[0, labelY, 0]} distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
            <div className="space-bubble-label">{label}</div>
          </Html>
        </group>
      </Billboard>
    </group>
  );
}

// Candidates in a horizontal strip below the current film — drag to explore.
function stripPositions(n) {
  return Array.from({ length: n }, (_, i) => [(i - (n - 1) / 2) * SPACING, -1.7, 0]);
}

// The pannable world: lerps toward the player-driven pan target. No idle motion.
function World({ pan, panX, children }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, pan.tx, 0.16);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, pan.ty, 0.16);
  });
  // expose clamp range via closure (panX) — used by the drag handler
  void panX;
  return <group ref={ref}>{children}</group>;
}

function Scene({ currentMovie, targetMovie, items, kind, onPickActor, onPickFilm, pan, panX }) {
  const positions = useMemo(() => stripPositions(items.length), [items.length]);
  const anchor = [0, -0.45, 0]; // bottom of the current movie card
  return (
    <World pan={pan} panX={panX}>
      <Float />
      <MovieGroup currentMovie={currentMovie} targetMovie={targetMovie} />
      {items.map((it, i) => (
        <group key={it.id ?? i}>
          <Line points={[anchor, positions[i]]} color="#ffffff" lineWidth={0.8} transparent opacity={0.18} />
          <Bubble item={it} kind={kind} position={positions[i]} onPick={kind === 'actors' ? onPickActor : onPickFilm} />
        </group>
      ))}
    </World>
  );
}

// (kept as a no-op placeholder so the scene tree is stable; idle motion removed per design)
function Float() { return null; }

function MovieGroup({ currentMovie, targetMovie }) {
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={1.5} />
      <Stars radius={90} depth={50} count={1800} factor={3} saturation={0} fade speed={0.25} />
      <group position={[0, 0.75, 0]}>
        <MovieCard url={currentMovie?.poster_path ? POSTER_W + currentMovie.poster_path : null} scale={[1.6, 2.4]} />
      </group>
      <group position={[0, 3.0, -4]}>
        <MovieCard url={targetMovie?.poster_path ? POSTER_W + targetMovie.poster_path : null} scale={[0.95, 1.42]} opacity={0.5} />
      </group>
    </>
  );
}

export default function SpaceBoard({
  currentMovie, targetMovie, cast, selectedActor, filmography,
  movesRemaining, actorLoading, handleActorSelect, handleFilmographySelect,
  gameDispatch, onSwitchToClassic,
}) {
  const webgl = useMemo(hasWebGL, []);
  const showFilms = !!selectedActor && filmography.length > 0;
  const items = showFilms ? filmography : (cast || []);
  const kind = showFilms ? 'films' : 'actors';

  // Player-driven pan target (drag to walk the map). No idle/auto motion.
  const pan = useRef({ tx: 0, ty: 0 }).current;
  const panX = Math.max(0, ((items.length - 1) / 2) * SPACING + 0.4);

  // Re-center when the level changes (new movie / actor).
  useEffect(() => {
    pan.tx = 0; pan.ty = 0;
  }, [currentMovie?.id, selectedActor?.id, showFilms, pan]);

  const bind = useDrag(({ first, movement: [mx, my], memo }) => {
    if (first) memo = { x: pan.tx, y: pan.ty };
    pan.tx = THREE.MathUtils.clamp(memo.x - mx * PAN_FACTOR, -panX, panX);
    pan.ty = THREE.MathUtils.clamp(memo.y + my * PAN_FACTOR, -PAN_Y_LIMIT, PAN_Y_LIMIT);
    return memo;
  }, { filterTaps: true, pointer: { touch: true } });

  if (!webgl) {
    return (
      <div className="space-fallback">
        <p>Your device doesn’t support 3D Space mode.</p>
        <button className="space-classic-btn" onClick={onSwitchToClassic}>Use Classic mode →</button>
      </div>
    );
  }

  return (
    <div className="space-board" {...bind()} style={{ touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 0.2, 6], fov: 62 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <Scene
            currentMovie={currentMovie}
            targetMovie={targetMovie}
            items={items}
            kind={kind}
            onPickActor={handleActorSelect}
            onPickFilm={handleFilmographySelect}
            pan={pan}
            panX={panX}
          />
        </Suspense>
      </Canvas>

      <div className="space-hud" aria-live="polite">
        <div className="space-hud-top">
          <div className="space-hud-pair">
            <span className="space-hud-cur">{currentMovie?.title}</span>
            <span className="space-hud-arrow">→</span>
            <span className="space-hud-target">{targetMovie?.title}</span>
          </div>
          <button className="space-classic-btn" onClick={onSwitchToClassic}>Classic</button>
        </div>
        <div className="space-hud-prompt">
          {showFilms ? (
            <>
              <span>Pick a film from <b>{selectedActor.name}</b></span>
              <button className="space-back-btn" onClick={() => gameDispatch({ type: 'DESELECT_ACTOR' })}>← back</button>
            </>
          ) : (
            <span>{actorLoading ? 'Travelling…' : 'Drag to explore · tap to travel'}</span>
          )}
        </div>
        <div className="space-hud-moves"><b>{movesRemaining}</b> moves left</div>
      </div>
    </div>
  );
}
