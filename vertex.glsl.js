vertexShader = `
varying vec3 v2_uv;
varying vec2 real_uv;
uniform float uTime;
void main() {
    vec3 delta = vec3(0.0, 0.0, 0.0);//normal * (sin(uTime * 0.5) + sin(uTime * 0.3 + 2.0) + sin(uTime)) / 3.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + delta, 1.0);
    v2_uv = position;
    real_uv = uv;
}
`