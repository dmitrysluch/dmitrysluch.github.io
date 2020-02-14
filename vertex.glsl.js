vertexShader = `
varying vec3 v2_uv;
varying vec2 real_uv;
uniform float uTime;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v2_uv = position;
    real_uv = uv;
}
`