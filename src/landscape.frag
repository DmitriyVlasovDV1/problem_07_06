#include <common>
#define GRASS (vec4(0.0, 1.0, 0.0, 1.0))
#define STONE (vec4(1.0, 0.0, 1.0, 1.0))
#define DIRT (vec4(0.0, 1.0, 1.0, 1.0))
#define SAND (vec4(1.0, 1.0, 0.0, 1.0))
#define LAVA (vec4(1.0, 0.0, 0.0, 1.0))
#define ROAD (vec4(0.0, 0.0, 1.0, 1.0))

#define DELTA_GRASS (length(GRASS - material))
#define DELTA_STONE (length(STONE - material))
#define DELTA_DIRT (length(DIRT - material))
#define DELTA_SAND (length(SAND - material))
#define DELTA_LAVA (length(LAVA - material))
#define DELTA_ROAD (length(ROAD - material))



uniform sampler2D texMaterials;
uniform sampler2D texGrass;
uniform sampler2D texStone;
uniform sampler2D texDirt;
uniform sampler2D texSand;
uniform sampler2D texLava;
uniform sampler2D texRoad;
uniform float texSclae;
uniform float lightCoeff;

varying vec2 vUv;

void main() {

  vec4 material = texture2D(texMaterials, vUv);

  float res = min(DELTA_GRASS, 
              min(DELTA_STONE,
              min(DELTA_LAVA,
              min(DELTA_ROAD, 
              min(DELTA_DIRT, 
                  DELTA_SAND)))));

  if (res == DELTA_GRASS) {
    gl_FragColor = texture2D(texGrass, vUv * texSclae) * lightCoeff;
  } else if (res == DELTA_STONE) {
    gl_FragColor = texture2D(texStone, vUv * texSclae) * lightCoeff;
  } else if (res == DELTA_DIRT) {
    gl_FragColor = texture2D(texDirt, vUv * texSclae) * lightCoeff;
  } else if (res == DELTA_SAND) {
    gl_FragColor = texture2D(texSand, vUv * texSclae) * lightCoeff;
  } else if (res == DELTA_ROAD) {
    gl_FragColor = texture2D(texRoad, vUv * texSclae) * lightCoeff;
  } else if (res == DELTA_LAVA) {
    gl_FragColor = texture2D(texLava, vUv * texSclae) * lightCoeff;
  } else {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0) * lightCoeff;
  }
}