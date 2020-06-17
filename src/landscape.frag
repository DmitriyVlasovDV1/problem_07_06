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

in vec3 fragPosition;

struct light {
  vec3 pos;
  vec3 dir;
  float angle;
  vec3 color;
  float intensity;
  float distance;
  int type;
};

uniform light lights[ 11 ];

in vec2 vUv;

void main() {

  vec4 material = texture2D(texMaterials, vUv);

  float res = min(DELTA_GRASS, 
              min(DELTA_STONE,
              min(DELTA_LAVA,
              min(DELTA_ROAD, 
              min(DELTA_DIRT, 
                  DELTA_SAND)))));

  vec4 resTex;

  if (res == DELTA_GRASS) {
    resTex = texture2D(texGrass, vUv * texSclae);
  } else if (res == DELTA_STONE) {
    resTex = texture2D(texStone, vUv * texSclae);
  } else if (res == DELTA_DIRT) {
    resTex = texture2D(texDirt, vUv * texSclae);
  } else if (res == DELTA_SAND) {
    resTex = texture2D(texSand, vUv * texSclae);
  } else if (res == DELTA_ROAD) {
    resTex = texture2D(texRoad, vUv * texSclae);
  } else if (res == DELTA_LAVA) {
    resTex = texture2D(texLava, vUv * texSclae);
  } else {
    resTex = vec4(1.0, 0.0, 0.0, 1.0);
  }

  vec3 lightCoeff = vec3(0.0, 0.0, 0.0);

  for (int i = 0; i < 11; i++) {
    light item = lights[i]; 
    /* SpotLight */ 
    if (item.type == 0) {
      vec3 pointDir = fragPosition - item.pos;
      float proj = dot(normalize(item.dir), pointDir);

      bool cond1 = 0.0 <= proj && proj <= item.distance;
      bool cond2 = (proj / cos(item.angle)) >= length(pointDir);

      if (cond1 && cond2) {
        lightCoeff += item.intensity * item.color;
      }
    /* DirectionalLight */
    } else if (item.type == 1) {
      vec3 pointDir = fragPosition - item.pos;
      float proj = dot(normalize(item.dir), pointDir);

      if (length(proj) >= 0.0) {
        lightCoeff += item.intensity * item.color;
      }
    }
  }

 
  gl_FragColor = resTex * vec4(lightCoeff, 1.0);
  
}