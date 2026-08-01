import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import {
  AtmosphereFragmentShader,
  AtmosphereVertexShader,
  HologramFragShader,
  HologramVertexShader,
  ImpulseFragmentShader,
  ImpulseVertexShader,
  ParticleFragmentShader,
  ParticleVertexShader,
  WormholeFragShader,
  WormholeVertexShader
} from "./shaders.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 767px)").matches;
const colors = {
  bg: new THREE.Color("#030712"),
  accent: new THREE.Color("#6EE7B7"),
  secondary: new THREE.Color("#818CF8"),
  highlight: new THREE.Color("#F472B6"),
  surface: new THREE.Color("#0F172A")
};

const skillGroups = [
  { title: "Languages", items: ["Go", "Java", "SQL", "Bash"] },
  { title: "Databases", items: ["PostgreSQL", "Cassandra", "Redis", "Yugabyte", "Oracle", "MySQL", "MongoDB"] },
  { title: "Cloud / DevOps", items: ["AWS", "Docker", "Kubernetes", "CI/CD", "Harness", "Rancher"] },
  { title: "Architecture", items: ["Microservices", "Event-Driven Systems", "Caching", "API Design", "System Design"] }
];

let renderer;
let scene;
let camera;
let composer;
let controls;
let clock;
let animationId = 0;
let visible = true;
let galaxy;
let starLayers = [];
let nebulae = [];
let planets = [];
let heroSphere;
let pointLight;
let island;
let skillGraph;
let ribbon;
let projectPanels = [];
let portal;
let portalParticles;
let torusKnot;
let educationRing;
let asteroidBelt;
let spaceAudio;
let raycaster;
let pointer;
let hoveredNode = null;
let expandedPanel = null;
let scrollProgress = 0;
let mouseTarget = new THREE.Vector2();
let mouseCurrent = new THREE.Vector2();
let cameraPath;

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loading");
  initCommonUi();
  initSpaceAudio();

  if (window.AOS) {
    window.AOS.init({ duration: 700, once: true, offset: 70 });
  }

  if (isMobile) {
    revealHeroHeadline();
    setTimeout(finishPreloader, 1200);
    return;
  }

  initThreeExperience();
});

function initCommonUi() {
  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const nav = document.querySelector(".glass-nav");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  navToggle?.addEventListener("click", () => {
    const open = navLinks?.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      const target = hash && hash.length > 1 ? document.querySelector(hash) : null;
      if (target) {
        event.preventDefault();
        const navHeight = nav?.getBoundingClientRect().height || 74;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;
        window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion ? "auto" : "smooth" });
        history.pushState(null, "", hash);
      }
      navLinks?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { threshold: 0.42 });

  sections.forEach((section) => observer.observe(section));

  const updateNav = () => {
    nav?.classList.toggle("scrolled", window.scrollY > 80);
  };
  updateNav();
  window.addEventListener("scroll", updateNav, { passive: true });
}

function initSpaceAudio() {
  const toggle = document.querySelector(".space-audio-toggle");
  if (!toggle) return;

  // Initialize the HTML5 Audio element for hum_sound.mp3
  spaceAudio = new Audio("hum_sound.mp3");
  spaceAudio.loop = true;
  spaceAudio.volume = 0; // Start at 0, fade in smoothly

  let isFading = false;
  let fadeInterval = null;
  const targetVolume = 0.35; // A pleasant, non-obtrusive background level

  const fadeIn = () => {
    if (isFading) clearInterval(fadeInterval);
    isFading = true;
    let vol = spaceAudio.volume;
    fadeInterval = setInterval(() => {
      vol = Math.min(targetVolume, vol + 0.05);
      spaceAudio.volume = vol;
      if (vol >= targetVolume) {
        clearInterval(fadeInterval);
        isFading = false;
      }
    }, 100);
  };

  const fadeOut = () => {
    if (isFading) clearInterval(fadeInterval);
    isFading = true;
    let vol = spaceAudio.volume;
    fadeInterval = setInterval(() => {
      vol = Math.max(0, vol - 0.05);
      spaceAudio.volume = vol;
      if (vol <= 0) {
        clearInterval(fadeInterval);
        spaceAudio.pause();
        isFading = false;
      }
    }, 100);
  };

  const playAudio = async () => {
    try {
      await spaceAudio.play();
      fadeIn();
      updateToggleState(true);
      removeInteractionListeners();
    } catch (err) {
      console.log("Audio play blocked, waiting for user interaction:", err);
    }
  };

  const pauseAudio = () => {
    fadeOut();
    updateToggleState(false);
  };

  const updateToggleState = (isPlaying) => {
    toggle.setAttribute("aria-pressed", String(isPlaying));
    toggle.setAttribute("aria-label", isPlaying ? "Mute deep space ambient hum" : "Play deep space ambient hum");
    const icon = toggle.querySelector("i");
    icon?.classList.toggle("fa-volume-low", isPlaying);
    icon?.classList.toggle("fa-volume-xmark", !isPlaying);
  };

  // Toggle button click handler
  toggle.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent event bubbling from triggering window autoplay
    removeInteractionListeners(); // User interacted directly, remove fallback listeners
    if (spaceAudio.paused) {
      playAudio();
    } else {
      pauseAudio();
    }
  });

  // Fallback autoplay triggers
  const tryAutoplay = async () => {
    // If already playing or user has interacted, skip
    if (!spaceAudio.paused || toggle.getAttribute("aria-pressed") === "true") {
      removeInteractionListeners();
      return;
    }
    try {
      await spaceAudio.play();
      fadeIn();
      updateToggleState(true);
      removeInteractionListeners();
    } catch (err) {
      // expected if blocked by browser policy
    }
  };

  const removeInteractionListeners = () => {
    window.removeEventListener("click", tryAutoplay);
    window.removeEventListener("touchstart", tryAutoplay);
    window.removeEventListener("keydown", tryAutoplay);
  };

  // Try playing immediately in case browser has relaxed policies
  tryAutoplay();

  // Otherwise, play on first user interaction
  window.addEventListener("click", tryAutoplay);
  window.addEventListener("touchstart", tryAutoplay);
  window.addEventListener("keydown", tryAutoplay);
}

function initThreeExperience() {
  const canvas = document.getElementById("webgl");
  if (!canvas) return;

  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = colors.bg;
  scene.fog = new THREE.FogExp2("#030712", 0.014);

  camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 260);
  camera.position.set(0, 0.4, 12);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.38, 0.16, 0.64));

  controls = new OrbitControls(camera, canvas);
  controls.enabled = false;

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2(4, 4);

  cameraPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.4, 12),
    new THREE.Vector3(0.2, 0.2, 5),
    new THREE.Vector3(-2.6, 1.3, -6),
    new THREE.Vector3(2.8, 0.4, -17),
    new THREE.Vector3(-1.4, 1.1, -29),
    new THREE.Vector3(1.7, 0.5, -41),
    new THREE.Vector3(-0.4, 0.8, -53)
  ]);

  addLights();
  createGalaxy();
  createDeepSpaceDetails();
  createHeroSphere();
  createIsland();
  createSkillGraph();
  createExperienceRibbon();
  createProjectPanels();
  createEducationScene();
  createContactPortal();
  createAmbientText();
  setupInteraction();
  setupScroll();
  simulateLoading();
  animate();
}

function addLights() {
  scene.add(new THREE.AmbientLight("#9EA8FF", 0.2));
  const sun = new THREE.DirectionalLight("#FFF4E0", 2.2);
  sun.position.set(-10, 4, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  scene.add(sun);
  pointLight = new THREE.PointLight("#9FB8FF", 2.1, 38);
  pointLight.position.set(2, 1, 5);
  scene.add(pointLight);

  const mint = new THREE.PointLight("#6EE7B7", 3.5, 24);
  mint.position.set(-4, -1, -14);
  scene.add(mint);
}

function createGalaxy() {
  const count = 150000;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const spins = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const radius = Math.pow(Math.random(), 0.55) * 54;
    const branch = (i % 7) / 7 * Math.PI * 2;
    const spin = radius * 0.18;
    const angle = branch + spin + (Math.random() - 0.5) * 0.8;
    const randomness = Math.pow(Math.random(), 2) * 3.2;

    positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * randomness;
    positions[i3 + 1] = (Math.random() - 0.5) * 5.6 - 0.5;
    positions[i3 + 2] = -4 - Math.abs(Math.sin(angle) * radius) - Math.random() * 26 + (Math.random() - 0.5) * randomness;
    scales[i] = 0.75 + Math.random() * 1.7;
    spins[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aSpin", new THREE.BufferAttribute(spins, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: ParticleVertexShader,
    fragmentShader: ParticleFragmentShader,
    uniforms: {
      time: { value: 0 },
      pixelRatio: { value: Math.min(window.devicePixelRatio, 1.8) },
      colorA: { value: colors.accent },
      colorB: { value: colors.secondary }
    }
  });

  galaxy = new THREE.Points(geometry, material);
  scene.add(galaxy);
}

function createDeepSpaceDetails() {
  createStarLayer(9000, 70, 0.018, "#E2E8F0", 0.74);
  createStarLayer(3200, 95, 0.026, "#B7C4FF", 0.46);
  createStarLayer(1400, 120, 0.038, "#6EE7B7", 0.22);

  const nebulaTextureA = createNebulaTexture(["rgba(110,231,183,0.45)", "rgba(129,140,248,0.22)", "rgba(3,7,18,0)"]);
  const nebulaTextureB = createNebulaTexture(["rgba(244,114,182,0.28)", "rgba(129,140,248,0.3)", "rgba(3,7,18,0)"]);
  [
    { map: nebulaTextureA, position: [-7, 2.8, -17], scale: [13, 8, 1], rotation: 0.35 },
    { map: nebulaTextureB, position: [8, -1.3, -32], scale: [15, 9, 1], rotation: -0.5 },
    { map: nebulaTextureA, position: [-8, -2.1, -48], scale: [12, 7, 1], rotation: 0.8 }
  ].forEach((config) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: config.map,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    }));
    sprite.position.set(...config.position);
    sprite.scale.set(...config.scale);
    sprite.material.rotation = config.rotation;
    scene.add(sprite);
    nebulae.push(sprite);
  });

  planets.push(createPlanet({
    radius: 0.62,
    position: [-4.7, 1.25, -10],
    base: "#3B82F6",
    land: "#6EE7B7",
    atmosphere: "#818CF8",
    ring: false
  }));
  planets.push(createSaturn({
    radius: 1.08,
    position: [3.9, 0.6, -12.8]
  }));
  planets.push(createPlanet({
    radius: 0.86,
    position: [5.6, -0.8, -24],
    base: "#C084FC",
    land: "#F472B6",
    atmosphere: "#F472B6",
    ring: true
  }));
  planets.push(createPlanet({
    radius: 0.52,
    position: [-5.2, 0.8, -34],
    base: "#94A3B8",
    land: "#475569",
    atmosphere: "#6EE7B7",
    ring: false
  }));
  asteroidBelt = createAsteroidBelt();
}

function createStarLayer(count, spread, size, color, opacity) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * spread;
    positions[i3 + 1] = (Math.random() - 0.5) * spread * 0.42;
    positions[i3 + 2] = -6 - Math.random() * spread;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(stars);
  starLayers.push(stars);
}

function createHeroSphere() {
  const geometry = new THREE.SphereGeometry(1.15, 64, 64);
  const heroMaps = createPlanetMaps("#143A33", "#6EE7B7", "#0F172A");
  const material = new THREE.MeshStandardMaterial({
    map: heroMaps.color,
    bumpMap: heroMaps.bump,
    bumpScale: 0.08,
    roughnessMap: heroMaps.roughness,
    color: "#BFFFE8",
    emissive: "#6EE7B7",
    emissiveIntensity: 0.08,
    roughness: 0.78,
    metalness: 0.05
  });
  heroSphere = new THREE.Mesh(geometry, material);
  heroSphere.scale.setScalar(0.95);
  heroSphere.position.set(4.45, -0.22, 1.25);
  scene.add(heroSphere);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: colors.accent },
        intensity: { value: 0.5 }
      },
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
  );
  heroSphere.add(atmosphere);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.016, 12, 180),
    new THREE.MeshBasicMaterial({ color: "#818CF8", transparent: true, opacity: 0.38 })
  );
  ring.rotation.x = Math.PI * 0.52;
  heroSphere.add(ring);
}

function createPlanet({ radius, position, base, land, atmosphere, ring }) {
  const planet = new THREE.Group();
  planet.position.set(...position);
  planet.rotation.z = THREE.MathUtils.degToRad(15 + Math.random() * 10);
  const maps = createPlanetMaps(base, land, "#0B1020");
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    new THREE.MeshStandardMaterial({
      map: maps.color,
      bumpMap: maps.bump,
      bumpScale: radius * 0.09,
      roughnessMap: maps.roughness,
      roughness: 0.78,
      metalness: 0.02
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  planet.add(body);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.09, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: new THREE.Color(atmosphere) },
        intensity: { value: 0.6 }
      },
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
  );
  planet.add(glow);

  if (ring) {
    const ringTexture = createSaturnRingTexture();
    const planetRing = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.25, radius * 2.05, 160, 8),
      new THREE.MeshStandardMaterial({
        map: ringTexture,
        alphaMap: ringTexture,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        roughness: 0.74
      })
    );
    planetRing.rotation.x = Math.PI * 0.62;
    planetRing.rotation.z = Math.PI * 0.12;
    planetRing.castShadow = true;
    planetRing.receiveShadow = true;
    planet.add(planetRing);
  }

  if (!ring && radius > 0.55) {
    planet.userData.moon = createMoonOrbit(radius, body);
  }

  scene.add(planet);
  return planet;
}

function createMoonOrbit(radius, parentBody) {
  const orbit = new THREE.Group();
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.16, 24, 24),
    new THREE.MeshStandardMaterial({ color: "#C8C5B7", roughness: 0.92, bumpMap: createPlanetMaps("#888", "#CCC", "#333").bump, bumpScale: 0.01 })
  );
  moon.position.set(radius * 2.4, radius * 0.22, 0);
  moon.castShadow = true;
  moon.receiveShadow = true;
  orbit.add(moon);
  parentBody.parent.add(orbit);
  return orbit;
}

function createSaturn({ radius, position }) {
  const saturn = new THREE.Group();
  saturn.position.set(...position);
  saturn.rotation.set(-0.12, 0.2, -0.08);

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.MeshStandardMaterial({
      map: createGasGiantTexture(),
      bumpMap: createGasGiantTexture(true),
      bumpScale: 0.045,
      roughness: 0.72,
      metalness: 0.01
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  saturn.add(body);

  const ringTexture = createSaturnRingTexture();
  const rings = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.34, radius * 2.38, 256, 10),
    new THREE.MeshStandardMaterial({
      map: ringTexture,
      alphaMap: ringTexture,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      roughness: 0.68,
      metalness: 0.06
    })
  );
  rings.rotation.x = Math.PI * 0.54;
  rings.rotation.z = Math.PI * 0.08;
  rings.castShadow = true;
  rings.receiveShadow = true;
  saturn.add(rings);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.035, 64, 64),
    new THREE.MeshBasicMaterial({ color: "#F8D99B", transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.BackSide })
  );
  saturn.add(atmosphere);
  scene.add(saturn);
  return saturn;
}

function createGasGiantTexture(monochrome = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const bands = monochrome ? ["#111827", "#334155", "#64748B"] : ["#8D6742", "#D6AF72", "#F3D8A0", "#AF7C45", "#EDD3A5"];
  for (let y = 0; y < canvas.height; y += 1) {
    const wave = Math.sin(y * 0.07) * 18 + Math.sin(y * 0.021) * 34;
    const color = bands[Math.abs(Math.floor((y + wave) / 34)) % bands.length];
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, y, canvas.width, 1);
  }
  for (let i = 0; i < 220; i += 1) {
    ctx.globalAlpha = 0.025 + Math.random() * 0.045;
    ctx.fillStyle = i % 2 ? "#ffffff" : "#3B281B";
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, Math.random() * 512, 40 + Math.random() * 220, 1 + Math.random() * 6, Math.random() * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 1;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function createSaturnRingTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  for (let x = 0; x < canvas.width; x += 1) {
    const t = x / canvas.width;
    const cassini = t > 0.56 && t < 0.62 ? 0.08 : 1;
    const grain = 0.72 + Math.random() * 0.28;
    ctx.fillStyle = `rgba(${Math.floor(226 * grain)}, ${Math.floor(203 * grain)}, ${Math.floor(162 * grain)}, ${Math.min(0.96, (0.22 + Math.sin(t * 64) * 0.1 + Math.random() * 0.28) * cassini)})`;
    ctx.fillRect(x, 0, 1, canvas.height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 1;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function createAsteroidBelt() {
  const count = 850;
  const dummy = new THREE.Object3D();
  const belt = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.035, 0),
    new THREE.MeshStandardMaterial({ color: "#8B7A66", roughness: 0.95, metalness: 0.04 }),
    count
  );
  belt.position.set(0, -0.05, -25);
  belt.userData.seeds = [];
  for (let i = 0; i < count; i += 1) {
    const seed = { angle: Math.random() * Math.PI * 2, radius: 5.5 + Math.random() * 5.8, speed: 0.015 + Math.random() * 0.035, y: (Math.random() - 0.5) * 1.4, scale: 0.45 + Math.random() * 1.9 };
    belt.userData.seeds.push(seed);
    dummy.scale.setScalar(seed.scale);
    dummy.updateMatrix();
    belt.setMatrixAt(i, dummy.matrix);
  }
  scene.add(belt);
  return belt;
}

function createPlanetMaps(base, land, shadow) {
  const width = 1024;
  const height = 512;
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  const roughnessCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = roughnessCanvas.width = width;
  colorCanvas.height = bumpCanvas.height = roughnessCanvas.height = height;
  const colorCtx = colorCanvas.getContext("2d");
  const bumpCtx = bumpCanvas.getContext("2d");
  const roughnessCtx = roughnessCanvas.getContext("2d");
  const latGradient = colorCtx.createLinearGradient(0, 0, 0, height);
  latGradient.addColorStop(0, "#E8F4FF");
  latGradient.addColorStop(0.18, base);
  latGradient.addColorStop(0.5, land);
  latGradient.addColorStop(0.82, base);
  latGradient.addColorStop(1, "#DCEBFF");
  colorCtx.fillStyle = latGradient;
  colorCtx.fillRect(0, 0, width, height);
  bumpCtx.fillStyle = "#707070";
  bumpCtx.fillRect(0, 0, width, height);
  roughnessCtx.fillStyle = "#6A6A6A";
  roughnessCtx.fillRect(0, 0, width, height);

  for (let i = 0; i < 130; i += 1) {
    const latitude = Math.random();
    const polarFade = Math.abs(latitude - 0.5) * 2;
    const x = Math.random() * width;
    const y = latitude * height;
    const w = 36 + Math.random() * 180;
    const h = 6 + Math.random() * 38;
    const alpha = 0.08 + Math.random() * 0.18;
    colorCtx.globalAlpha = alpha;
    colorCtx.fillStyle = i % 5 === 0 || polarFade > 0.74 ? "#E2E8F0" : land;
    colorCtx.beginPath();
    colorCtx.ellipse(x, y, w, h, Math.random() * 0.35, 0, Math.PI * 2);
    colorCtx.fill();

    bumpCtx.globalAlpha = 0.25 + Math.random() * 0.35;
    bumpCtx.fillStyle = i % 3 === 0 ? "#B8B8B8" : "#4C4C4C";
    bumpCtx.beginPath();
    bumpCtx.ellipse(x, y, w * 0.82, h * 0.86, Math.random() * 0.35, 0, Math.PI * 2);
    bumpCtx.fill();

    roughnessCtx.globalAlpha = 0.18 + Math.random() * 0.35;
    roughnessCtx.fillStyle = i % 4 === 0 ? "#ECECEC" : "#383838";
    roughnessCtx.beginPath();
    roughnessCtx.ellipse(x, y, w, h, Math.random() * 0.35, 0, Math.PI * 2);
    roughnessCtx.fill();
  }

  colorCtx.globalAlpha = 0.14;
  colorCtx.fillStyle = "#ffffff";
  for (let y = 0; y < height; y += 22) {
    colorCtx.fillRect(0, y + Math.sin(y * 0.055) * 6, width, 1);
  }
  colorCtx.globalAlpha = bumpCtx.globalAlpha = roughnessCtx.globalAlpha = 1;

  return {
    color: canvasToTexture(colorCanvas, true),
    bump: canvasToTexture(bumpCanvas),
    roughness: canvasToTexture(roughnessCanvas)
  };
}

function canvasToTexture(canvas, color = false) {
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 1;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createNebulaTexture(stops) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 512);

  for (let i = 0; i < 18; i += 1) {
    const x = 170 + Math.random() * 190;
    const y = 170 + Math.random() * 190;
    const r = 80 + Math.random() * 150;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, stops[i % 2]);
    gradient.addColorStop(0.55, stops[1]);
    gradient.addColorStop(1, stops[2]);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createIsland() {
  island = new THREE.Group();
  island.position.set(-2.4, -0.75, -7);
  scene.add(island);

  const baseMaterial = new THREE.MeshStandardMaterial({ color: "#0F172A", roughness: 0.72, metalness: 0.25 });
  const wireMaterial = new THREE.MeshBasicMaterial({ color: "#6EE7B7", wireframe: true, transparent: true, opacity: 0.28 });
  const shapes = [
    new THREE.BoxGeometry(2.2, 0.32, 1.6),
    new THREE.BoxGeometry(1.2, 0.44, 1.1),
    new THREE.ConeGeometry(1.25, 1.5, 6),
    new THREE.ConeGeometry(0.7, 1.15, 5)
  ];

  shapes.forEach((geometry, index) => {
    const mesh = new THREE.Mesh(geometry, baseMaterial);
    mesh.position.set(index === 1 ? 0.35 : 0, index < 2 ? 0 : -0.78, index === 3 ? 0.35 : 0);
    if (index > 1) mesh.rotation.x = Math.PI;
    island.add(mesh);

    const wire = new THREE.Mesh(geometry.clone(), wireMaterial);
    wire.position.copy(mesh.position);
    wire.rotation.copy(mesh.rotation);
    island.add(wire);
  });

  ["Go", "Kafka", "K8s", "Redis", "PostgreSQL", "Docker"].forEach((label, index) => {
    const badge = createBadge(label);
    const angle = index / 6 * Math.PI * 2;
    badge.position.set(Math.cos(angle) * 1.9, 0.8 + Math.sin(index) * 0.15, Math.sin(angle) * 1.45);
    island.add(badge);
  });
}

function createBadge(label) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(15,23,42,0.88)";
  roundRect(ctx, 18, 18, 220, 220, 34);
  ctx.fill();
  ctx.strokeStyle = "rgba(110,231,183,0.75)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#6EE7B7";
  ctx.font = label.length > 6 ? "600 32px Inter" : "700 46px Inter";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), material);
}

function createSkillGraph() {
  skillGraph = new THREE.Group();
  skillGraph.position.set(0, 0.1, -18);
  scene.add(skillGraph);

  const skillPalettes = [
    { base: "#312E81", land: "#A78BFA", atmosphere: "#C084FC", ring: true },
    { base: "#4C1D95", land: "#F472B6", atmosphere: "#F0ABFC", ring: false },
    { base: "#1E1B4B", land: "#818CF8", atmosphere: "#93C5FD", ring: true },
    { base: "#581C87", land: "#C4B5FD", atmosphere: "#F472B6", ring: false }
  ];
  const center = createSkillPlanet({
    radius: 0.42,
    title: "Backend Systems",
    items: ["Go", "Java", "SQL", "Bash", "PostgreSQL", "Cassandra", "Redis", "Yugabyte", "Oracle", "MySQL", "MongoDB", "AWS", "Docker", "Kubernetes", "CI/CD", "Harness", "Rancher", "Microservices", "Event-Driven Systems", "Caching", "API Design", "System Design"],
    base: "#064E3B",
    land: "#6EE7B7",
    atmosphere: "#A7F3D0",
    ring: true
  });
  skillGraph.add(center);
  skillGraph.userData.nodes = [center];

  const linePositions = [];
  const lineDistances = [];
  let distanceSeed = 0;

  skillGroups.forEach((group, index) => {
    const angle = index / skillGroups.length * Math.PI * 2 + Math.PI * 0.25;
    const clusterPosition = new THREE.Vector3(Math.cos(angle) * 2.25, Math.sin(index * 1.7) * 0.45, Math.sin(angle) * 2.25);
    const palette = skillPalettes[index % skillPalettes.length];
    const cluster = createSkillPlanet({ radius: 0.28, title: group.title, items: group.items, ...palette });
    cluster.position.copy(clusterPosition);
    skillGraph.add(cluster);
    skillGraph.userData.nodes.push(cluster);
    pushLine(linePositions, lineDistances, new THREE.Vector3(), clusterPosition, distanceSeed);
    distanceSeed += 1;

    group.items.forEach((item, itemIndex) => {
      const childAngle = itemIndex / group.items.length * Math.PI * 2;
      const childPalette = skillPalettes[(index + itemIndex + 1) % skillPalettes.length];
      const child = createSkillPlanet({ radius: 0.18, title: item, items: [group.title], ...childPalette, ring: itemIndex % 3 === 0 });
      child.position.set(
        clusterPosition.x + Math.cos(childAngle) * 0.72,
        clusterPosition.y + Math.sin(childAngle * 1.3) * 0.42,
        clusterPosition.z + Math.sin(childAngle) * 0.72
      );
      skillGraph.add(child);
      skillGraph.userData.nodes.push(child);
      pushLine(linePositions, lineDistances, clusterPosition, child.position, distanceSeed);
      distanceSeed += 1;
    });
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute("lineDistance", new THREE.Float32BufferAttribute(lineDistances, 1));
  const lineMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: ImpulseVertexShader,
    fragmentShader: ImpulseFragmentShader,
    uniforms: {
      time: { value: 0 },
      accent: { value: colors.accent }
    }
  });
  skillGraph.add(new THREE.LineSegments(lineGeometry, lineMaterial));
}

function createSkillPlanet({ radius, title, items, base, land, atmosphere, ring }) {
  const maps = createPlanetMaps(base, land, "#0B1020");
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 48),
    new THREE.MeshStandardMaterial({
      map: maps.color,
      bumpMap: maps.bump,
      bumpScale: radius * 0.14,
      roughnessMap: maps.roughness,
      roughness: 0.86,
      metalness: 0.04,
      emissive: new THREE.Color(atmosphere),
      emissiveIntensity: 0.14
    })
  );
  planet.castShadow = true;
  planet.receiveShadow = true;
  planet.userData = { title, items, hoverable: true };

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.13, 32, 32),
    new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: new THREE.Color(atmosphere) },
        intensity: { value: 0.48 }
      },
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    })
  );
  planet.add(glow);

  if (ring) {
    const ringTexture = createSaturnRingTexture();
    const planetRing = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.35, radius * 2.05, 128, 4),
      new THREE.MeshStandardMaterial({
        map: ringTexture,
        alphaMap: ringTexture,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide,
        roughness: 0.78
      })
    );
    planetRing.rotation.x = Math.PI * 0.58;
    planetRing.rotation.z = Math.PI * 0.18;
    planet.add(planetRing);
  }

  return planet;
}

function pushLine(positions, distances, a, b, seed) {
  positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  distances.push(seed, seed + a.distanceTo(b));
}

class HelixCurve extends THREE.Curve {
  getPoint(t) {
    const angle = t * Math.PI * 5.5;
    const radius = 1.25;
    return new THREE.Vector3(Math.cos(angle) * radius, (t - 0.5) * 3.4, Math.sin(angle) * radius);
  }
}

function createExperienceRibbon() {
  const group = new THREE.Group();
  group.position.set(0, 0.1, -29);
  scene.add(group);

  const curve = new HelixCurve();
  const geometry = new THREE.TubeGeometry(curve, 220, 0.045, 10, false);
  const material = new THREE.MeshStandardMaterial({ color: "#0F172A", emissive: "#6EE7B7", emissiveIntensity: 0.34, side: THREE.DoubleSide });
  ribbon = new THREE.Mesh(geometry, material);
  ribbon.geometry.setDrawRange(0, 0);
  group.add(ribbon);

  [0.22, 0.74].forEach((t) => {
    const point = curve.getPoint(t);
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 24, 24),
      new THREE.MeshStandardMaterial({ color: "#6EE7B7", emissive: "#6EE7B7", emissiveIntensity: 1.8 })
    );
    node.position.copy(point);
    group.add(node);
  });
}

function createProjectPanels() {
  const positions = [new THREE.Vector3(-1.8, 0.25, -40), new THREE.Vector3(1.8, -0.15, -42)];

  positions.forEach((position, index) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 2, 64, 24),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: HologramVertexShader,
        fragmentShader: HologramFragShader,
        uniforms: {
          time: { value: 0 },
          accent: { value: colors.accent },
          secondary: { value: colors.secondary }
        }
      })
    );
    panel.position.copy(position);
    panel.rotation.y = index === 0 ? 0.18 : -0.18;
    panel.userData = { interactivePanel: true, index, basePosition: position.clone(), baseScale: new THREE.Vector3(1, 1, 1) };
    const label = createProjectPanelLabel(index);
    label.position.z = 0.025;
    panel.add(label);
    scene.add(panel);
    projectPanels.push(panel);
  });
}

function createProjectPanelLabel(index) {
  const projects = [
    {
      title: "Large-scale ETL Pipeline",
      metric: "200M+ records · 99.95% accuracy",
      copy: "Resilient Go microservices pipeline with Redis caching, safe retries, and production-grade migration controls.",
      tags: ["Go", "Redis", "ETL", "Concurrency"]
    },
    {
      title: "Event-driven Sync Services",
      metric: "10M+ events/day · near-zero lag",
      copy: "Kafka and Cassandra-backed workers designed for high-throughput consistency, observability, and fault tolerance.",
      tags: ["Kafka", "Cassandra", "Workers", "SLA"]
    }
  ];
  const project = projects[index];
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 680;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "rgba(15,23,42,0.96)");
  gradient.addColorStop(0.48, "rgba(30,41,59,0.84)");
  gradient.addColorStop(1, "rgba(6,78,59,0.9)");
  ctx.fillStyle = gradient;
  roundRect(ctx, 32, 32, 960, 616, 54);
  ctx.fill();
  ctx.strokeStyle = "rgba(110,231,183,0.82)";
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = "#6EE7B7";
  ctx.font = "700 34px JetBrains Mono, monospace";
  ctx.fillText(project.metric, 86, 122);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 58px Space Grotesk, sans-serif";
  wrapCanvasText(ctx, project.title, 86, 210, 820, 66);
  ctx.fillStyle = "rgba(226,232,240,0.86)";
  ctx.font = "500 34px Inter, sans-serif";
  wrapCanvasText(ctx, project.copy, 86, 360, 830, 46);

  project.tags.forEach((tag, tagIndex) => {
    const x = 86 + (tagIndex % 2) * 330;
    const y = 520 + Math.floor(tagIndex / 2) * 58;
    ctx.fillStyle = "rgba(129,140,248,0.18)";
    roundRect(ctx, x, y, 275, 40, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(129,140,248,0.44)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#C4B5FD";
    ctx.font = "700 24px JetBrains Mono, monospace";
    ctx.fillText(tag, x + 24, y + 28);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 1;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthTest: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(2.72, 1.78), material);
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  words.forEach((word) => {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line.trim(), x, y);
}

function createEducationScene() {
  torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1, 0.3, 128, 16),
    new THREE.MeshBasicMaterial({ color: "#818CF8", wireframe: true, transparent: true, opacity: 0.72 })
  );
  torusKnot.position.set(-1.8, 0.2, -49.5);
  scene.add(torusKnot);

  const count = 5000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const major = 1.8;
    const minor = 0.22 + Math.random() * 0.18;
    positions[i3] = (major + minor * Math.cos(v)) * Math.cos(u);
    positions[i3 + 1] = minor * Math.sin(v);
    positions[i3 + 2] = (major + minor * Math.cos(v)) * Math.sin(u);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  educationRing = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: "#6EE7B7", size: 0.018, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending })
  );
  educationRing.position.copy(torusKnot.position);
  scene.add(educationRing);
}

function createContactPortal() {
  portal = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 128),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: WormholeVertexShader,
      fragmentShader: WormholeFragShader,
      uniforms: {
        time: { value: 0 },
        accent: { value: colors.accent },
        secondary: { value: colors.secondary }
      }
    })
  );
  portal.position.set(1.9, 0.15, -57);
  scene.add(portal);

  const count = 500;
  const dummy = new THREE.Object3D();
  portalParticles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    new THREE.MeshBasicMaterial({ color: "#6EE7B7", transparent: true, opacity: 0.78 }),
    count
  );
  portalParticles.userData.seeds = [];
  for (let i = 0; i < count; i += 1) {
    portalParticles.userData.seeds.push({ angle: Math.random() * Math.PI * 2, radius: 0.25 + Math.random() * 4, speed: 0.2 + Math.random() * 0.9 });
    dummy.updateMatrix();
    portalParticles.setMatrixAt(i, dummy.matrix);
  }
  portalParticles.position.copy(portal.position);
  scene.add(portalParticles);
}

function createAmbientText() {
  const loader = new FontLoader();
  loader.load("https://cdn.jsdelivr.net/npm/three@0.165.0/examples/fonts/helvetiker_regular.typeface.json", (font) => {
    const geometry = new TextGeometry("scale reliability throughput", {
      font,
      size: 0.12,
      depth: 0.004,
      curveSegments: 4
    });
    geometry.center();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: "#475569", transparent: true, opacity: 0.32 })
    );
    mesh.position.set(0, -1.55, -14);
    scene.add(mesh);
  });
}

function setupInteraction() {
  window.addEventListener("mousemove", (event) => {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    mouseTarget.set((x - 0.5) * 0.6, (0.5 - y) * 0.6);
    pointer.set(x * 2 - 1, -(y * 2 - 1));
  }, { passive: true });

  window.addEventListener("click", () => {
    if (!raycaster || !camera) return;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(projectPanels, false);
    if (hits.length) {
      toggleProjectPanel(hits[0].object);
    }
  });

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible && !animationId) animate();
  });
}

function setupScroll() {
  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) {
    revealHeroHeadline();
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger, window.TextPlugin);

  const h1 = document.querySelector(".hero h1");
  if (h1?.dataset.text) {
    window.gsap.to(h1, { duration: 1.55, text: h1.dataset.text, ease: "none", delay: 0.35 });
  }

  window.gsap.to(".hero-overlay", {
    autoAlpha: 0,
    y: -70,
    ease: "none",
    scrollTrigger: { trigger: "#home", start: "top top", end: "bottom 40%", scrub: true }
  });

  window.gsap.to({ value: 0 }, {
    value: 1,
    ease: "none",
    scrollTrigger: {
      trigger: "main",
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => {
        scrollProgress = self.progress;
      }
    }
  });

  window.ScrollTrigger.create({
    trigger: "#experience",
    start: "top 65%",
    end: "bottom 35%",
    scrub: true,
    onUpdate: (self) => {
      if (!ribbon) return;
      ribbon.geometry.setDrawRange(0, Math.floor(ribbon.geometry.index.count * self.progress));
    }
  });
}

function revealHeroHeadline() {
  const h1 = document.querySelector(".hero h1");
  if (h1?.dataset.text) h1.textContent = h1.dataset.text;
}

function toggleProjectPanel(panel) {
  if (!window.gsap || prefersReducedMotion) return;

  if (expandedPanel === panel) {
    projectPanels.forEach((item) => {
      window.gsap.to(item.position, { x: item.userData.basePosition.x, y: item.userData.basePosition.y, z: item.userData.basePosition.z, duration: 0.7, ease: "power3.out" });
      window.gsap.to(item.scale, { x: 1, y: 1, z: 1, duration: 0.7, ease: "power3.out" });
    });
    document.querySelectorAll(".project-card").forEach((card) => card.classList.remove("expanded"));
    expandedPanel = null;
    return;
  }

  expandedPanel = panel;
  projectPanels.forEach((item) => {
    const active = item === panel;
    const target = active ? panel.userData.basePosition.clone().add(new THREE.Vector3(0, 0, 3)) : item.userData.basePosition.clone().add(new THREE.Vector3(0, 0, -2.2));
    window.gsap.to(item.position, { x: target.x, y: target.y, z: target.z, duration: 0.8, ease: "power3.out" });
    window.gsap.to(item.scale, { x: active ? 2.5 : 0.84, y: active ? 2.5 : 0.84, z: active ? 2.5 : 0.84, duration: 0.8, ease: "power3.out" });
  });
  document.querySelectorAll(".project-card").forEach((card, index) => card.classList.toggle("expanded", index === panel.userData.index));
}

function animate() {
  if (!visible) {
    animationId = 0;
    return;
  }
  animationId = requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();

  if (galaxy) {
    galaxy.rotation.y += delta * 0.018;
    galaxy.material.uniforms.time.value = elapsed;
  }

  starLayers.forEach((layer, index) => {
    layer.rotation.y += delta * (0.003 + index * 0.002);
    layer.rotation.x = Math.sin(elapsed * 0.03 + index) * 0.025;
  });

  nebulae.forEach((nebula, index) => {
    nebula.material.opacity = 0.38 + Math.sin(elapsed * 0.22 + index) * 0.08;
  });

  planets.forEach((planet, index) => {
    planet.rotation.y += delta * (0.05 + index * 0.018);
    planet.rotation.x = Math.sin(elapsed * 0.12 + index) * 0.035;
    if (planet.userData.moon) {
      planet.userData.moon.rotation.y += delta * 0.42;
      planet.userData.moon.rotation.z = Math.sin(elapsed * 0.18 + index) * 0.14;
    }
  });

  if (asteroidBelt) {
    const dummy = new THREE.Object3D();
    asteroidBelt.userData.seeds.forEach((seed, index) => {
      const angle = seed.angle + elapsed * seed.speed;
      dummy.position.set(Math.cos(angle) * seed.radius, seed.y + Math.sin(elapsed * 0.4 + index) * 0.04, Math.sin(angle) * seed.radius * 0.42);
      dummy.rotation.set(elapsed * seed.speed * 3, angle, elapsed * seed.speed * 2);
      dummy.scale.setScalar(seed.scale);
      dummy.updateMatrix();
      asteroidBelt.setMatrixAt(index, dummy.matrix);
    });
    asteroidBelt.instanceMatrix.needsUpdate = true;
    asteroidBelt.rotation.y += delta * 0.004;
  }

  if (heroSphere) {
    heroSphere.material.emissiveIntensity = 0.2 + Math.sin(elapsed * 2.2) * 0.04;
    heroSphere.rotation.y += delta * 0.18;
  }

  if (pointLight) {
    pointLight.position.set(Math.cos(elapsed * 0.75) * 3.1, Math.sin(elapsed * 0.9) * 1.2, 3.4 + Math.sin(elapsed * 0.6));
  }

  if (island) {
    island.position.y = -0.75 + Math.sin(elapsed * 0.5) * 0.1;
    island.rotation.y += delta * 0.15;
    island.children.forEach((child) => {
      if (child.isMesh && child.geometry?.type === "PlaneGeometry") {
        child.lookAt(camera.position);
      }
    });
  }

  if (skillGraph) {
    skillGraph.rotation.y = Math.sin(elapsed * 0.22) * 0.16;
    skillGraph.children.forEach((child) => {
      if (child.material?.uniforms?.time) child.material.uniforms.time.value = elapsed;
    });
  }

  projectPanels.forEach((panel, index) => {
    panel.material.uniforms.time.value = elapsed + index;
    panel.position.y += Math.sin(elapsed * 0.85 + index) * 0.0009;
  });

  if (torusKnot) {
    torusKnot.rotation.x += delta * 0.22;
    torusKnot.rotation.y += delta * 0.18;
  }

  if (educationRing) {
    educationRing.rotation.y += delta * 0.1;
  }

  if (portal) {
    portal.material.uniforms.time.value = elapsed;
    portal.rotation.z += delta * 0.09;
  }

  updatePortalParticles(elapsed);
  updateCamera();
  updateRaycast();

  composer.render();
}

function updateCamera() {
  const pathPoint = cameraPath.getPoint(THREE.MathUtils.clamp(scrollProgress, 0, 1));
  mouseCurrent.lerp(mouseTarget, 0.055);
  camera.position.set(pathPoint.x + mouseCurrent.x, pathPoint.y + mouseCurrent.y, pathPoint.z);
  const lookAhead = cameraPath.getPoint(THREE.MathUtils.clamp(scrollProgress + 0.05, 0, 1));
  camera.lookAt(lookAhead.x, lookAhead.y, lookAhead.z - 1.5);
}

function updateRaycast() {
  const tooltip = document.querySelector(".skill-tooltip");
  if (!tooltip || !skillGraph?.userData.nodes) return;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(skillGraph.userData.nodes, false);
  const hit = hits.find((item) => item.object.userData.hoverable);

  if (hoveredNode && (!hit || hit.object !== hoveredNode)) {
    hoveredNode.scale.setScalar(1);
  }

  if (hit) {
    hoveredNode = hit.object;
    hoveredNode.scale.lerp(new THREE.Vector3(1.4, 1.4, 1.4), 0.18);
    tooltip.classList.add("visible");
    tooltip.style.left = `${(pointer.x * 0.5 + 0.5) * window.innerWidth}px`;
    tooltip.style.top = `${(-pointer.y * 0.5 + 0.5) * window.innerHeight}px`;
    tooltip.innerHTML = `<h3>${hoveredNode.userData.title}</h3><p>${hoveredNode.userData.items.join(", ")}</p>`;
  } else {
    hoveredNode = null;
    tooltip.classList.remove("visible");
  }
}

function updatePortalParticles(elapsed) {
  if (!portalParticles) return;
  const dummy = new THREE.Object3D();
  portalParticles.userData.seeds.forEach((seed, index) => {
    const radius = Math.max(0.08, seed.radius - (elapsed * seed.speed % seed.radius));
    const angle = seed.angle + elapsed * (1.6 + seed.speed);
    dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(elapsed + index) * 0.12);
    dummy.scale.setScalar(0.6 + (1.0 - radius / seed.radius) * 1.8);
    dummy.updateMatrix();
    portalParticles.setMatrixAt(index, dummy.matrix);
  });
  portalParticles.instanceMatrix.needsUpdate = true;
}

function onResize() {
  if (!camera || !renderer || !composer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  if (galaxy) {
    galaxy.material.uniforms.pixelRatio.value = Math.min(window.devicePixelRatio, 1.8);
  }
}

function simulateLoading() {
  const bar = document.querySelector(".loader-bar");
  const text = document.querySelector(".loader-text");
  const started = performance.now();
  let progress = 0;

  const tick = () => {
    progress = Math.min(100, progress + 4 + Math.random() * 9);
    if (bar) bar.style.width = `${progress}%`;
    if (text) text.textContent = `${Math.floor(progress)}%`;
    if (progress < 100 || performance.now() - started < 1200) {
      setTimeout(tick, 90);
    } else {
      finishPreloader();
    }
  };

  tick();
}

function finishPreloader() {
  const loader = document.querySelector(".preloader");
  const bar = document.querySelector(".loader-bar");
  const text = document.querySelector(".loader-text");
  if (bar) bar.style.width = "100%";
  if (text) text.textContent = "100%";
  setTimeout(() => {
    loader?.classList.add("hidden");
    document.body.classList.remove("loading");
  }, 260);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
