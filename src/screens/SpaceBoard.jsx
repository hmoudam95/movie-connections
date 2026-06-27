import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Image, Billboard, Html, useTexture } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import '../styles/space.css';

// Space Mode — the flagship 3D "constellation" board.
// Candidates scatter like trees in a forest (random left/right/middle + depth);
// you walk DOWN through them by scrolling (player-driven, no idle motion).
// The current film + target stay anchored but COLLAPSE into a small top section
// as you scroll down — strings emanate from that section to each candidate — and
// grow back to full size when you scroll up. Tiny horizontal sway only. Tap to
// travel. Falls back to Classic without WebGL.

const POSTER_W = 'https://image.tmdb.org/t/p/w342';
const PROFILE_W = 'https://image.tmdb.org/t/p/w185';
const SPACING_Y = 0.95;
const HEAD_R = 0.36;
const PAN_X_LIMIT = HEAD_R;
const PAN_X_FACTOR = 0.005;
const PAN_Y_FACTOR = 0.013;
const COL_TOP = -0.1;
const COMPACT_AT = 1.2; // scroll distance over which the header fully compacts

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

// deterministic pseudo-random in [0,1)
function rnd(s) { const x = Math.sin(s * 12.9898) * 43758.5453; return x - Math.floor(x); }

// Forest scatter: each candidate gets a stable random x (within the lane) + depth.
function forestPositions(n) {
  return Array.from({ length: n }, (_, i) => {
    const x = (rnd(i * 1.37 + 0.1) - 0.5) * 1.1;
    const y = COL_TOP - i * SPACING_Y - (rnd(i * 2.71 + 0.3) - 0.5) * 0.16;
    const z = (rnd(i * 3.31 + 0.7) - 0.5) * 0.5;
    return [x, y, z];
  });
}

function MovieCard({ url, scale = [1.05, 1.58], opacity = 1 }) {
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

function RoundHead({ url, radius = HEAD_R }) {
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

function InitialsHead({ label, radius = HEAD_R }) {
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
            <MovieCard url={url} scale={[0.62, 0.93]} />
          )}
          <Html position={[isActor ? 0.46 : 0.4, 0, 0]} distanceFactor={9} occlude={false} style={{ pointerEvents: 'none' }}>
            <div className="space-bubble-label space-bubble-label--right">{label}</div>
          </Html>
        </group>
      </Billboard>
    </group>
  );
}

// Collapsing header: current film + target shrink toward a compact top section as
// you scroll down (compactT from the live scroll), and grow back when you scroll up.
function Header({ currentMovie, targetMovie, shared }) {
  const curRef = useRef();
  const tgtRef = useRef();
  const L = THREE.MathUtils.lerp;
  useFrame(() => {
    const t = THREE.MathUtils.clamp(shared.scrollY / COMPACT_AT, 0, 1);
    if (curRef.current) {
      curRef.current.scale.setScalar(L(1, 0.42, t));
      curRef.current.position.set(L(0, -0.62, t), L(1.3, 2.0, t), 0.7);
    }
    if (tgtRef.current) {
      tgtRef.current.scale.setScalar(L(1, 0.62, t));
      tgtRef.current.position.set(L(0, 0.62, t), L(3.0, 2.04, t), 0.5);
    }
    // anchor where the strings originate (bottom of the section)
    shared.anchor.set(0, L(0.45, 1.62, t), 0.4);
  });
  return (
    <>
      <group ref={tgtRef}>
        <MovieCard url={targetMovie?.poster_path ? POSTER_W + targetMovie.poster_path : null} scale={[0.5, 0.75]} opacity={0.55} />
      </group>
      <group ref={curRef}>
        <MovieCard url={currentMovie?.poster_path ? POSTER_W + currentMovie.poster_path : null} scale={[1.05, 1.58]} />
      </group>
    </>
  );
}

const DEFAULT_GLOW = [0.37, 0.89, 0.6];

// Compass color from a candidate's distance-to-target vs. the current film's.
// closer = green, lateral = amber, farther = red, unknown/dead-end = grey.
function routeColor(dist, dCur) {
  if (dist == null || dist < 0) return [0.46, 0.46, 0.52];   // unknown / dead end
  if (dist === 0) return [0.3, 1.0, 0.55];                   // this IS the target
  if (dCur == null || dCur < 0) return [0.4, 0.9, 0.62];     // no reference yet
  if (dist < dCur) return [0.4, 0.9, 0.62];                  // closer → green
  if (dist === dCur) return [0.93, 0.8, 0.34];               // lateral → amber
  return [0.94, 0.4, 0.4];                                   // farther → red
}

// Dynamic strings from the (moving) header anchor to every candidate, each line
// colored by its route quality (green→red), dimmer at the anchor end.
function Connectors({ bases, shared, routeColors }) {
  const ref = useRef();
  const positions = useMemo(() => new Float32Array(bases.length * 6), [bases.length]);
  const colors = useMemo(() => new Float32Array(bases.length * 6), [bases.length]);
  useFrame(() => {
    const a = shared.anchor;
    for (let i = 0; i < bases.length; i++) {
      positions[i * 6 + 0] = a.x;
      positions[i * 6 + 1] = a.y;
      positions[i * 6 + 2] = a.z;
      positions[i * 6 + 3] = bases[i][0] + shared.scrollX;
      positions[i * 6 + 4] = bases[i][1] + shared.scrollY;
      positions[i * 6 + 5] = bases[i][2];
      const c = (routeColors && routeColors[i]) || DEFAULT_GLOW;
      colors[i * 6 + 0] = c[0] * 0.4; colors[i * 6 + 1] = c[1] * 0.4; colors[i * 6 + 2] = c[2] * 0.4;
      colors[i * 6 + 3] = c[0]; colors[i * 6 + 4] = c[1]; colors[i * 6 + 5] = c[2];
    }
    if (ref.current) {
      ref.current.geometry.attributes.position.needsUpdate = true;
      ref.current.geometry.attributes.color.needsUpdate = true;
    }
  });
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={bases.length * 2} />
        <bufferAttribute attach="attributes-color" array={colors} itemSize={3} count={bases.length * 2} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

function ScrollColumn({ items, kind, bases, onPickActor, onPickFilm, pan, shared }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, pan.ty, 0.16);
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, pan.tx, 0.16);
    shared.scrollX = ref.current.position.x;
    shared.scrollY = ref.current.position.y;
  });
  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <Bubble key={it.id ?? i} item={it} kind={kind} position={bases[i]} onPick={kind === 'actors' ? onPickActor : onPickFilm} />
      ))}
    </group>
  );
}

function Scene({ currentMovie, targetMovie, items, kind, bases, onPickActor, onPickFilm, pan, shared, routeColors }) {
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={1.5} />
      <Stars radius={90} depth={50} count={1600} factor={3} saturation={0} fade speed={0.2} />
      <Header currentMovie={currentMovie} targetMovie={targetMovie} shared={shared} />
      {/* strings only after a selection (films view) — keeps browsing clean */}
      {kind === 'films' && <Connectors bases={bases} shared={shared} routeColors={routeColors} />}
      <ScrollColumn items={items} kind={kind} bases={bases} onPickActor={onPickActor} onPickFilm={onPickFilm} pan={pan} shared={shared} />
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
  const bases = useMemo(() => forestPositions(items.length), [items.length]);

  const pan = useRef({ tx: 0, ty: 0 }).current;
  const shared = useRef({ anchor: new THREE.Vector3(0, 0.45, 0.4), scrollX: 0, scrollY: 0 }).current;
  const scrollMax = Math.max(0, (items.length - 1) * SPACING_Y - 1.4);
  const [routeColors, setRouteColors] = useState(null);

  useEffect(() => { pan.tx = 0; pan.ty = 0; }, [currentMovie?.id, selectedActor?.id, showFilms, pan]);

  // Compass: when viewing an actor's films, fetch each film's distance-to-target
  // and color the route strings (green closer → red farther → grey dead end).
  useEffect(() => {
    if (kind !== 'films' || !items.length || !targetMovie?.id || !currentMovie?.id) {
      setRouteColors(null);
      return;
    }
    let alive = true;
    const filmIds = items.slice(0, 36).map((f) => f.id);
    const base = process.env.REACT_APP_API_BASE_URL || '';
    const url = `${base}/api/distances?toMovieId=${targetMovie.id}&ids=${[currentMovie.id, ...filmIds].join(',')}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data || !data.dist) return;
        const dCur = data.dist[String(currentMovie.id)];
        setRouteColors(items.map((f) => routeColor(data.dist[String(f.id)], dCur)));
      })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, selectedActor?.id, currentMovie?.id, targetMovie?.id]);

  const bind = useDrag(({ first, movement: [mx, my], memo }) => {
    if (first) memo = { x: pan.tx, y: pan.ty };
    pan.tx = THREE.MathUtils.clamp(memo.x + mx * PAN_X_FACTOR, -PAN_X_LIMIT, PAN_X_LIMIT);
    pan.ty = THREE.MathUtils.clamp(memo.y - my * PAN_Y_FACTOR, 0, scrollMax);
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
      <Canvas camera={{ position: [0, 0.4, 6], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <Scene
            currentMovie={currentMovie}
            targetMovie={targetMovie}
            items={items}
            kind={kind}
            bases={bases}
            onPickActor={handleActorSelect}
            onPickFilm={handleFilmographySelect}
            pan={pan}
            shared={shared}
            routeColors={routeColors}
          />
        </Suspense>
      </Canvas>

      <div className="space-rails" aria-hidden="true" />

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
            <span>{actorLoading ? 'Travelling…' : 'Scroll down · tap to travel'}</span>
          )}
        </div>
        <div className="space-hud-moves"><b>{movesRemaining}</b> moves left</div>
      </div>
    </div>
  );
}
