export const ParticleVertexShader = `
uniform float time;
uniform float pixelRatio;
uniform vec3 colorA;
uniform vec3 colorB;

attribute float aScale;
attribute float aSpin;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 transformed = position;
  float dist = length(transformed.xz);
  float pulse = sin(time * 0.65 + aSpin + dist * 0.035) * 0.18;
  transformed.y += pulse;

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = aScale * pixelRatio * (72.0 / -mvPosition.z);

  float mixValue = smoothstep(0.0, 42.0, dist);
  vColor = mix(colorA, colorB, mixValue);
  vAlpha = 1.0 - smoothstep(24.0, 58.0, dist);
}
`;

export const ParticleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  float glow = smoothstep(0.5, 0.0, d);
  float core = smoothstep(0.18, 0.0, d);
  float alpha = clamp((glow * 0.18 + core * 0.32) * vAlpha, 0.0, 0.46);
  gl_FragColor = vec4(vColor, alpha);
}
`;

export const HologramVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const HologramFragShader = `
uniform float time;
uniform vec3 accent;
uniform vec3 secondary;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float shimmer = sin(uv.x * 20.0 + time * 1.4) * 0.03;
  uv.y += shimmer;

  float scan = step(0.05, mod(uv.y * 80.0 + time * 2.0, 1.0));
  vec2 centered = abs(vUv - vec2(0.5));
  float edge = 1.0 - smoothstep(0.33, 0.5, max(centered.x, centered.y));
  float rim = smoothstep(0.48, 0.34, max(centered.x, centered.y));
  float glow = pow(edge, 2.0);

  vec3 color = mix(secondary, accent, 0.72 + shimmer);
  float alpha = 0.18 + glow * 0.55 + rim * 0.2;
  color *= mix(0.55, 1.0, scan);

  gl_FragColor = vec4(color, alpha);
}
`;

export const WormholeVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const WormholeFragShader = `
uniform float time;
uniform vec3 accent;
uniform vec3 secondary;

varying vec2 vUv;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float swirl = sin(angle * 8.0 - time * 2.4 + dist * 12.0);
  float rings = sin(dist * 28.0 - time * 3.2 + swirl);
  float core = 1.0 - smoothstep(0.0, 0.34, dist);
  float outer = 1.0 - smoothstep(0.72, 1.0, dist);
  float edge = smoothstep(0.62, 0.92, dist) * outer;
  vec3 color = mix(accent, secondary, 0.5 + 0.5 * sin(time + dist * 5.0 + swirl));
  color += vec3(core * 0.7);
  color *= 0.55 + rings * 0.22 + edge * 1.45;
  float alpha = clamp((core * 0.65 + edge + outer * 0.35) * (1.0 - smoothstep(0.96, 1.0, dist)), 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

export const ImpulseVertexShader = `
uniform float time;
attribute float lineDistance;
varying float vPulse;

void main() {
  vPulse = smoothstep(0.0, 0.1, abs(fract(lineDistance * 0.15 - time * 0.85) - 0.5));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const ImpulseFragmentShader = `
uniform vec3 accent;
varying float vPulse;

void main() {
  float intensity = 1.0 - vPulse;
  gl_FragColor = vec4(accent, 0.18 + intensity * 0.75);
}
`;
