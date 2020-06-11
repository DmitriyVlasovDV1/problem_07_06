uniform sampler2D texHeight;
uniform float maxHeight;
uniform float time;
varying vec2 vUv;

void main(void) {
    vUv = uv;
    vec4 v = projectionMatrix * modelViewMatrix * 
                  vec4(position.x, position.y, position.z + texture2D(texHeight, vUv).x * maxHeight, 1.0);
    gl_Position = v + vec4(sin(time), 0.0, 0.0, 0.0);
}