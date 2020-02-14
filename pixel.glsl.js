noise = `
//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}
float rand(vec2 seed) {
    return fract(sin(dot(seed, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 position) {
    vec2 blockPosition = floor(position);

    float topLeftValue     = rand(blockPosition);
    float topRightValue    = rand(blockPosition + vec2(1.0, 0.0));
    float bottomLeftValue  = rand(blockPosition + vec2(0.0, 1.0));
    float bottomRightValue = rand(blockPosition + vec2(1.0, 1.0));

    vec2 computedValue = smoothstep(0.0, 1.0, fract(position));

    return mix(topLeftValue, topRightValue, computedValue.x)
        + (bottomLeftValue  - topLeftValue)  * computedValue.y * (1.0 - computedValue.x)
        + (bottomRightValue - topRightValue) * computedValue.x * computedValue.y;
}
float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`

pixelShader = `
#define EPSILON 0.1

varying vec3 v2_uv;
varying vec2 real_uv;
uniform float uTime;
uniform sampler2D map;
#define M_PI 3.14159265358979323846

`
+ noise +
`
void main() {
    float alpha = 0.0;
    for ( int i = 0; i < 2; ++i ) {
        vec2 position1 = vec2((v2_uv.x + v2_uv.z)* (0.3+ float(i) / 10.0), (v2_uv.y + (v2_uv.x + v2_uv.z)* 0.1)* (0.3+ float(i) / 10.0) - uTime * float(i));
        alpha += snoise(position1) / 2.0;
    }

    gl_FragColor = vec4(texture2D(map, real_uv / 40.0).xyz * (fract(alpha) - smoothstep(0.1, 1.3, v2_uv.y/40.0)), 1.0);
}
`;

pixelUnlitShader = `
#define EPSILON 0.1

varying vec3 v2_uv;
varying vec2 real_uv;
uniform float uTime;
uniform sampler2D map;
void main() {
    gl_FragColor = texture2D(map, real_uv / 40.0);
}
`;

pixelShaderVoronoy = (blue)=>(`
varying vec3 v2_uv;
varying vec2 real_uv;
#define POINTS_SZ 8
uniform vec2 u_points[POINTS_SZ];
uniform vec3 u_normals[POINTS_SZ];
uniform float uTime;
uniform sampler2D map;
void main() {
  float min_distance = 1.0;
  vec3 normal = vec3(0.0, 0.0, 0.0);
  vec2 point = vec2(0.0, 0.0);
  for (int i = 0; i < POINTS_SZ; i++) {
      float current_distance = distance(v2_uv.xy, u_points[i]);
      if (current_distance < min_distance) {
          min_distance = current_distance;
          normal = u_normals[i];
          point = u_points[i];
      }
  }
  vec2 up = normalize(normal.xy);

  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);//texture2D(map, up * (v2_uv.y - point.y) + vec2(up.x, -up.y) * (v2_uv.x - point.x));
  //gl_FragColor *= clamp(0.1, 1.0, dot(normalize(normal), vec3(0.0, 0.0, 1.0)));
//   if (min_distance < 0.01) {
//       gl_FragColor.rgb = vec3(1.0);
//   }

  int number_of_near_points = 0;

  for (int i = 0; i < POINTS_SZ; i++) {
      if (distance(v2_uv.xy, u_points[i]) < min_distance + 0.0015) {
          number_of_near_points++;
      }
  }

  if (number_of_near_points > 1) {
      gl_FragColor = ${blue ? 'vec4(0.7 * sin(uTime) + 0.1 * cos(2.0 * uTime), 3.0 + 0.6 * sin(uTime), 0.2 * sin(3.0 * uTime), 1.0) * 0.6' : 'vec4(3.0 + 0.6 * sin(uTime), 0.7 * sin(uTime) + 0.1 * cos(2.0 * uTime), 0.2 * sin(3.0 * uTime), 1.0) * 0.6'};
  }
}

`)