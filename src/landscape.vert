uniform sampler2D texHeight;
uniform float maxHeight;
uniform float time;
out vec2 vUv;
out vec3 fragPosition;

void main(void) {
    vUv = uv;
    vec3 newPos = vec3(position.x, position.y,
                       position.z + texture2D(texHeight, vUv).x * maxHeight);
    vec4 v = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
                  
    gl_Position = v;
    fragPosition = vec3(newPos.x, newPos.z, -newPos.y);

}