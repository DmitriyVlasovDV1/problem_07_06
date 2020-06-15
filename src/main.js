import { mat4, vec3 } from 'gl-matrix';

import './styles.css';

import txtTrafficCoords from './traffic_coords.txt';
import vertShaderStrLandscape from './landscape.vert';
import fragShaderStrLandscape from './landscape.frag';


import * as THREE from 'three';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import {OBJLoader2} from '../node_modules/three/examples/jsm/loaders/OBJLoader2.js';
import {MTLLoader} from '../node_modules/three/examples/jsm/loaders/MTLLoader.js';
import {MtlObjBridge} from '../node_modules/three/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';
import {FBXLoader} from '../node_modules/three/examples/jsm/loaders/FBXLoader.js';


/* Animation system class */
class classAnimation {
  constructor() {

    /* Scene */
    this.scene = new THREE.Scene();

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({canvas: canvas});
    this.renderer.setClearColor(0x111111);
    this.renderer.shadowMapEnabled = true;
    
    /* Camera*/
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.camDir = new THREE.Vector3(0, 0, 0);

    /* Time */
    this.timeMs = Date.now();
    this.timeStart = Date.now();

    /* Controls */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.currentlyPressedKeys = {};
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.safety = true;

    /* Skybox */
    this.skyBox;
  }

  /* Controls handle mthods */
  handleKeyDown = (event) => {
    this.currentlyPressedKeys[event.keyCode] = true;

  }
  handleKeyUp = (event) => {
    this.currentlyPressedKeys[event.keyCode] = false;
  }

  handleKeys() {
    if (animSys.currentlyPressedKeys[32]) {
      flag = true;
      infoText.innerHTML = "Press '1' to drive by yourself";
    } if (animSys.currentlyPressedKeys[49]) {
      traffic.cars[traffic.indPlayer].isControlled = true;
      infoText.innerHTML = "Usable buttons: W A S D";
    }
  }


  /* Set skybox method */
  setSkybox(skyboxTextures) {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load(skyboxTextures);

    this.scene.background = texture;
  }

  /* Set camera position function */
  setCamPos(vector) {
    this.camera.position.set(...vector);
  }

  /* Set camera position function */
  setCamAt(vector) {
    this.camera.lookAt(new THREE.Vector3(...vector));
  }

  response() {
    this.camera.getWorldDirection(this.camDir);
    this.handleKeys();
    this.timeMs = Date.now() - this.timeStart;
  }

  render() {
    animSys.renderer.render(this.scene, this.camera );
  }
}

/* Landscape class */
class classLandscape {
  constructor (maxHeight, widthX, widthZ, fragX, fragZ, 
               texScale,
               texHeightPath, texMaterialsPath, 
               texGrassPath, texStonePath, texDirtPath, texSandPath, texLavaPath, texRoadPath) {

    this.texScale = texScale;
    this.maxHeight = maxHeight;
    
    /* Set textures */
    this.textures = [
      this.texHeight = new THREE.TextureLoader().load(texHeightPath),
      this.texMaterials = new THREE.TextureLoader().load(texMaterialsPath),
      this.texGrass = new THREE.TextureLoader().load(texGrassPath),
      this.texStone = new THREE.TextureLoader().load(texStonePath),
      this.texDirt = new THREE.TextureLoader().load(texDirtPath),
      this.texLava = new THREE.TextureLoader().load(texLavaPath),
      this.texRoad = new THREE.TextureLoader().load(texRoadPath),
      this.texSand = new THREE.TextureLoader().load(texSandPath)];

      this.imageHeight = new Image();
      this.imageHeight.src = texHeightPath;
      this.imageHeight.onload = () => {
      }

    for (let i = 0; i < this.textures.length; i++) {
      this.textures[i].wrapS = THREE.RepeatWrapping;
      this.textures[i].wrapT = THREE.RepeatWrapping;
    }

    /* Set primitive */
    let geometry = new THREE.PlaneGeometry(widthX, widthZ, fragX, fragZ);
    
    let material = new THREE.ShaderMaterial( {
      uniforms: {

        texHeight: { value: this.texHeight },

        texMaterials: { value: this.texMaterials },
        texGrass: { value: this.texGrass },
        texStone: { value: this.texStone },
        texDirt: { value: this.texDirt },
        texSand: { value: this.texSand },
        texLava: { value: this.texLava },
        texRoad: { value: this.texRoad },

        texSclae: { value: this.texScale },
        maxHeight: { value: this.maxHeight },
        time: {value: animSys.timeMs},
        lightCoeff: {value: light.value}
      },

      vertexShader: vertShaderStrLandscape,
      fragmentShader: fragShaderStrLandscape
    } );

    this.primitive = new THREE.Mesh(geometry, material);
    this.primitive.rotation.x=-0.5*Math.PI;
    this.primitive.position.y = -1;
    this.primitive.receiveShadow = true;
    animSys.scene.add(this.primitive);

  }
  response (){
    this.primitive.material.uniforms.lightCoeff.value = light.value;
  }
} 

class classEditor {
  constructor (radius, color, speed) {
    let geometry = new THREE.SphereGeometry(radius, 20, 20);
    let material = new THREE.MeshPhongMaterial( { color: color } );
    this.primitive = new THREE.Mesh( geometry, material );

    this.speed = speed;

    this.dirUp = new THREE.Vector3(0, this.speed, 0);
    this.dirDown = new THREE.Vector3(0, -this.speed, 0);
    this.dirNorth = new THREE.Vector3(0, 0, 0);
    this.dirSouth = new THREE.Vector3(0, 0, 0);
    this.dirEast = new THREE.Vector3(0, 0, 0);
    this.dirWest = new THREE.Vector3(0, 0, 0);

    this.safety = true;

    this.points = [];
  }

  handleKeys () {
    this.dirEast.crossVectors(animSys.camDir, this.dirUp).normalize().multiplyScalar(this.speed);
    this.dirWest.copy(this.dirEast).negate();
    this.dirNorth.crossVectors(this.dirWest, this.dirUp).normalize().multiplyScalar(this.speed);
    this.dirSouth.copy(this.dirNorth).negate();

    if (animSys.currentlyPressedKeys['W'.charCodeAt(0)]) {
      this.primitive.position.add(this.dirNorth);
    } if (animSys.currentlyPressedKeys['S'.charCodeAt(0)]) {
      this.primitive.position.add(this.dirSouth);
    } if (animSys.currentlyPressedKeys['A'.charCodeAt(0)]) {
      this.primitive.position.add(this.dirWest);
    } if (animSys.currentlyPressedKeys['D'.charCodeAt(0)]) {
      this.primitive.position.add(this.dirEast);
    } if (animSys.currentlyPressedKeys['Q'.charCodeAt(0)]) {
      this.primitive.position.add(this.dirUp);
    } if (animSys.currentlyPressedKeys['E'.charCodeAt(0)]) {
      this.primitive.position.add(this.dirDown);
    } if (!this.safety && animSys.currentlyPressedKeys['P'.charCodeAt(0)]) {
      this.addPoint();
      this.safety = true;
    } if (animSys.currentlyPressedKeys['L'.charCodeAt(0)]) {
      this.safety = false;
    }
  }

  addPoint(radius=3) {
    let geometry = new THREE.SphereGeometry(radius, 20, 20);
    let material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
    let primitive = new THREE.Mesh(geometry, material);
    primitive.position.copy(this.primitive.position);
    animSys.scene.add(primitive);
    this.points.push(primitive);

    console.log("[", primitive.position.x, ",", 
                     primitive.position.y, ",", 
                     primitive.position.z, "]");
  }


  response () {
    this.handleKeys();
  }
}

let flag = false;
class classTraffic {
  constructor() {
    /* Auxiliary variables */
    this.dirUp = new THREE.Vector3(0, 1, 0);
    this.dirNorth = new THREE.Vector3();
    this.dirSouth = new THREE.Vector3();
    this.dirEast = new THREE.Vector3();
    this.dirWest = new THREE.Vector3();
    this.tmp = new THREE.Vector3();
    this.isFirstResponse = true;

    this.timeLastBuff = Date.now();
    this.timeDeltaBuff = 10;
    this.rangeBuff = 40;
    this.viewAngle = 0.75;

    /* Segments */
    this.segments = []

    let arrCoords = txtTrafficCoords.split("\n");
    this.numOfSegments = arrCoords.length / 2 - 1;
    for (let i = 0; i < this.numOfSegments; i++) {
      this.segments.push([new THREE.Vector3(...eval(arrCoords[i * 2])), 
                          new THREE.Vector3(...eval(arrCoords[i * 2 + 1]))]);
    }

    /* Cars */
    this.minCarsGap = 4;
    this.radarRadius = 20;

    this.cars = []
    this.numOfCars = 10;
    for (let i = 0; i < this.numOfCars; i++) {
      this.cars.push(new classCar(this.tmp.addVectors(this.segments[i][0], this.segments[i][1]).multiplyScalar(0.5), i + 1));
    }

    /* Player */
    this.indPlayer = 0;
    this.cars[this.indPlayer].isControlled = false;
  }
  
  response () {

    if (animSys.currentlyPressedKeys[9]) {
      this.cars[this.indPlayer].isControlled = false;
      this.indPlayer = (this.indPlayer + 1) % this.numOfCars;
      this.cars[this.indPlayer].isControlled = true;
    }

    /* Computing isNewBuff */
    let isNewBuff = false;
    if ((Date.now() - this.timeLastBuff) / 1000.0 > this.timeDeltaBuff) {
      this.timeLastBuff = Date.now();
      isNewBuff = true;
    }

    for (let car of this.cars) {

      /* Computing targetDir and isBreaking */
      if (car.isControlled) {

        /* TargetDir and isBreaking */
        this.dirEast.crossVectors(animSys.camDir, this.dirUp).normalize();
        this.dirWest.copy(this.dirEast).negate();
        this.dirNorth.crossVectors(this.dirWest, this.dirUp).normalize();
        this.dirSouth.copy(this.dirNorth).negate();

        car.isBreaking = true;
        car.targetDir.copy(this.dirNorth.multiplyScalar(1));
        if (animSys.currentlyPressedKeys['W'.charCodeAt(0)]) {
          car.targetDir.add(this.dirNorth.multiplyScalar(1.5));
          car.isBreaking = false;
        }
        if (animSys.currentlyPressedKeys['A'.charCodeAt(0)]) {
          car.targetDir.add(this.dirWest);
        } if (animSys.currentlyPressedKeys['D'.charCodeAt(0)]) {
          car.targetDir.add(this.dirEast);
        }
        car.targetDir.normalize();

        /* Correcting isBreaking */
        for (let car2 of this.cars) {
          this.tmp.subVectors(car2.primitive.position, car.primitive.position);
          if (this.tmp.length() < this.minCarsGap && this.tmp.normalize().dot(car.targetDir) > this.viewAngle) {
            car.isBreaking = true;
            break;
          }
        }

      } else {
        /* TargetDir */
        let v1 = this.segments[car.targetSegment][0];
        let v2 = this.segments[car.targetSegment][1];
        let vC = car.primitive.position;

        let vecSeg = new THREE.Vector3();
        let vecCar = new THREE.Vector3();
        let vecTarget = new THREE.Vector3();

        vecSeg.subVectors(v2, v1);
        vecCar.subVectors(vC, v1);
        this.tmp.copy(vecSeg).normalize();

        vecTarget.copy(this.tmp).multiplyScalar(vecCar.dot(this.tmp));

        if (vecTarget.length() > vecSeg.length() || this.tmp.subVectors(vecSeg, vecTarget).length() > vecSeg.length()) {
          if (vecTarget.length() < this.tmp.subVectors(vecSeg, vecTarget).length()) {
            vecTarget.set(0, 0, 0);
          } else {
            vecTarget.copy(vecSeg);
          }
        }

        car.targetDir.subVectors(vecTarget, vecCar);

        if (car.targetDir.length() < 10) {
          car.targetSegment = (car.targetSegment + 1) % this.numOfSegments;
        }

        car.targetDir.normalize();

        /* isBreking and correcting targetDir */
        let prog = vecTarget.length() / vecSeg.length();
        let vecBetweenCars = new THREE.Vector3();
        car.isBreaking = false;
        for (let car2 of this.cars) {
          vecBetweenCars = this.tmp.subVectors(car2.primitive.position, car.primitive.position);
          if (vecBetweenCars.length() < this.radarRadius && this.tmp.normalize().dot(car.currentDir) > this.viewAngle) {
            if (vecBetweenCars.length() < this.minCarsGap) {
              car.isBreaking = true;
            }
            if (prog > 0.5) {
              car.targetDir.copy(this.tmp.subVectors(this.tmp.set(0, 0, 0), vecCar)).normalize();
            } else {
              car.targetDir.copy(this.tmp.subVectors(this.tmp.copy(vecSeg), vecCar)).normalize();
            }
          }
        }
      }

      /* Computing currentBuff */
      if (isNewBuff) {
        car.currentBuff = (Math.random()) * this.rangeBuff;
      } 

      /* Draw speed */
      if (car === this.cars[0]) {
        speedText.innerHTML = `Your speed: ${(car.currentSpeed / 3.6).toFixed(2)} km/h`;
      }

      /* car response */
      car.response();
    }
  }
}


class classCar {
  constructor (position, targetSegment) {
    /* Model */
    let geometry = new THREE.SphereGeometry(5, 20, 20);
    let material = new THREE.MeshPhongMaterial( { color: 0xAA00AA } );
    this.primitive = new THREE.Mesh(geometry, material);
    
    this.primitive = new THREE.Object3D();
    this.primitive.copy(model_car).scale.set(0.85, 0.85, 0.85);
    this.primitive.position.copy(position);
    
    this.maxVolume = 3;
    
    listener = new THREE.AudioListener();
    animSys.camera.add( listener );
    const audioLoader = new THREE.AudioLoader();
      
    audioLoader.load( './src/sounds/car_motor.mp3', ( buffer ) => {
      
      let sound = new THREE.PositionalAudio( listener );
      sound.setBuffer( buffer );
      sound.setRefDistance( 10 );
      
      sound.setLoopEnd(buffer.duration * (0.7 + 0.3 * Math.random()));
      sound.setLoopStart(buffer.duration * 0.3 * Math.random());
      sound.setLoop(true);
      this.primitive.add(sound);
    });

    audioLoader.load( './src/sounds/car_on_speed.mp3', ( buffer ) => {
      
      let sound = new THREE.PositionalAudio( listener );
      sound.setBuffer( buffer );
      sound.setRefDistance( 10 );
      
      sound.setLoopEnd(buffer.duration * (0.5 + 0.3 * Math.random()));
      sound.setLoopStart(buffer.duration * 0.3 * Math.random());
      sound.setLoop(true);
      this.primitive.add(sound);
    });

    animSys.scene.add(this.primitive);

    /* Movements params */

    /* Constants */
    this.maxSpeed = 75;
    this.rotationSpeed = 0.1;
    this.accelerationStarting = 20;
    this.accelerationBreaking = -100;

    /* Current params */
    this.currentBuff = 0;
    this.currentSpeed = 0.0;
    this.currentAcceleration = 0.0;
    this.currentDir = new THREE.Vector3(0, 0, 0);
    
    this.timeLastResponse = Date.now();
    this.timeLastModelTurn = Date.now();
    
    this.targetDir = new THREE.Vector3();
    this.targetSegment = targetSegment;
    this.isFirstResponse = true;
    this.isBreaking = false;
    this.isControlled = false;

    /* Auxiliary variables */
    this.tmp = new THREE.Vector3();
  }

  response () {
    if (this.isFirstResponse) {
      this.primitive.children[2].play();
      this.primitive.children[3].play();
      //this.primitive.children[3].play();
      this.isFirstResponse = false;
      this.timeLastResponse = Date.now();
      return;
    }

    /* Computing delta time */
    let deltaTime = (Date.now() - this.timeLastResponse) / 1000.0;
    this.timeLastResponse = Date.now();


    /* Computing current acceleration */
    if (this.isBreaking && this.currentSpeed > 0) {
      this.currentAcceleration = this.accelerationBreaking;
    } else if (!this.isBreaking && this.currentSpeed < this.maxSpeed + this.currentBuff) {
      this.currentAcceleration = this.accelerationStarting;
    } else {
      this.currentAcceleration = 0;
    }


    /* Computing currentSpeed */
    this.currentSpeed += this.currentAcceleration * deltaTime;

    if (this.currentSpeed > this.maxSpeed + this.currentBuff) {
      this.currentSpeed = this.maxSpeed + this.currentBuff;
    } else if (this.currentSpeed < 0.0) {
      this.currentSpeed = 0.0;
    }

    this.primitive.children[3].setVolume(this.maxVolume * (this.currentSpeed / (this.maxSpeed + this.currentBuff)));
    this.primitive.children[2].setVolume(this.maxVolume * (1 - (this.currentSpeed / (this.maxSpeed + this.currentBuff))));
    

    /* Computing delta length */
    let deltaLength = this.currentSpeed * deltaTime + 0.5 * this.currentAcceleration * deltaTime ** 2;

    /* Computing currentDir */
    this.currentDir.add(this.tmp.subVectors(this.targetDir, this.currentDir).normalize().multiplyScalar(this.rotationSpeed)).normalize();

    /* Movement */
    //this.primitive.lookAt(this.tmp.addVectors(this.currentDir, this.primitive.position));
    this.primitive.position.add(this.tmp.copy(this.currentDir).multiplyScalar(deltaLength));

    if (this.tmp.subVectors(this.targetDir, this.currentDir).length() < this.rotationSpeed) {
      this.primitive.lookAt(this.tmp.addVectors(this.targetDir, this.primitive.position));
    } else {
      this.primitive.lookAt(this.tmp.addVectors(this.currentDir, this.primitive.position));
    }
    
  }
}


class classCameraTracker {
  constructor (maxSpeed, deltaAcceleration, minDistance, height) {
    this.maxSpeed = maxSpeed;
    this.minDistance = minDistance;
    this.height = new THREE.Vector3(0, height, 0);
    this.currentSpeed = 0.0;
    this.currentAcceleration = 0.0;
    this.deltaAcceleration = deltaAcceleration;
    this.timeLastUpdate;

    this.isFirstResponse = true;
  }


  response (target) {
    if (this.isFirstResponse) {
      this.isFirstResponse = false;
      this.timeLastUpdate = Date.now();
      return;
    }

    let tmp = new THREE.Vector3();
    let isBreaking = false;
    if (tmp.subVectors(tmp.copy(target).add(this.height), animSys.camera.position).length() < this.minDistance) {
      isBreaking = true;
    } 
    if (tmp.length() < this.minDistance / 3) {
      this.currentSpeed = 0;
    }



    if (isBreaking) {
      this.currentAcceleration = -this.deltaAcceleration;
    } else {
      this.currentAcceleration = this.deltaAcceleration;
    }

    let deltaTime = (Date.now() - this.timeLastUpdate) / 1000.0;
    this.timeLastUpdate = Date.now();

    this.currentSpeed += this.currentAcceleration * deltaTime;

    if (this.currentSpeed > this.maxSpeed) {
      this.currentSpeed = this.maxSpeed;
    } else if (this.currentSpeed < 0.0) {
      this.currentSpeed = 0.0;
    }

    let deltaLength = this.currentSpeed * deltaTime + 0.5 * this.currentAcceleration * deltaTime ** 2;

    tmp.normalize().multiplyScalar(deltaLength).add(animSys.camera.position);
    animSys.camera.position.set(tmp.x, tmp.y, tmp.z);
    animSys.camera.lookAt(target);
  }
}

class classLight {
  constructor (color, dayTime) {
    this.dayTime = dayTime;
    this.color = color;

    this.spotLight = new THREE.SpotLight(color);
    this.value = Math.sin(((animSys.timeMs / 1000.0) % this.dayTime) / this.dayTime * Math.PI) * 0.8 + 0.2;
    this.spotLight.power = this.value * Math.PI;
    this.spotLight.position.set(-40, 600, -10);
    this.spotLight.castShadow = true;
    animSys.scene.add(this.spotLight);
  }

  response () {
    this.value = Math.sin(((animSys.timeMs / 1000.0) % this.dayTime) / this.dayTime * Math.PI) * 0.8 + 0.2;
    this.spotLight.power = this.value * Math.PI;
  }

}



function tick() {
  requestAnimationFrame(tick);

  /* Response */
  animSys.response();

  light.response();
  landscape.response();
  //editor.response();
  if (flag) {
    traffic.response();
    cameraTracker.speed = traffic.cars[traffic.indPlayer].maxSpeed + traffic.cars[traffic.indPlayer].currentBuff - 10;
    cameraTracker.response(traffic.cars[traffic.indPlayer].primitive.position);
  }

  /* Render */
  animSys.render();
}

let infoText;
let speedText;
let animSys;
let cameraTracker;
let landscape;
let editor;
let traffic;
let model_car;
let sound_01;
let sound_buffer_01;
let listener;
let light;
let canvas;

async function initialization () {
  /* Animation system */
  await new Promise(function (resolve, reject) {
    animSys = new classAnimation();
    animSys.setCamPos([-30, 40, 30]);
    animSys.setCamAt([0, 0, 0]);
    resolve();
  });

  /* Resources */
  await new Promise(function (resolve, reject) {
    /* Models */
    const mtlLoader = new MTLLoader();
    mtlLoader.load('./src/sport_car_01/car.mtl', (mtlParseResult) => {
        const objLoader = new OBJLoader2();
        const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
        materials.Material.side = THREE.DoubleSide;
        objLoader.addMaterials(materials);
        objLoader.load('./src/sport_car_01/car.obj', (root) => {
          model_car = root;
          resolve();
        });
      })
    });

  /* Camera tracker system */
  cameraTracker = new classCameraTracker(100, 70, 20, 10);

  /* Light */
  light = new classLight(0xffffff, 40);

  /* Traffic */
  traffic = new classTraffic();

  /* Landscape */
  let commonPath = "./src/images/landscape/";

  landscape = new classLandscape(75.0, 500, 500, 500, 500, 
    40.0,
    commonPath + "texture_height.jpg", 
    commonPath + "texture_materials.jpg", 
    commonPath + "texture_grass.jpg", 
    commonPath + "texture_stone.jpg",
    commonPath + "texture_dirt.jpg",
    commonPath + "texture_sand.jpg",
    commonPath + "texture_lava.jpg",
    commonPath + "texture_road.jpg");

  /* Editor */
  /*
  editor = new classEditor(4, 0xff0000, 0.5);
  animSys.scene.add(editor.primitive); 
  */


  /* Skybox */
  animSys.setSkybox([
    './src/images/skybox_01/xpos.jpg',
    './src/images/skybox_01/xneg.jpg',
    './src/images/skybox_01/ypos.jpg',
    './src/images/skybox_01/yneg.jpg',
    './src/images/skybox_01/zpos.jpg',
    './src/images/skybox_01/zneg.jpg'
    ]);

}

function mainFunction() {
  /* HTML texts */
  infoText = document.getElementById("idInfo");
  speedText = document.getElementById("idSpeed");

  /* Canvas */
  canvas = document.getElementById("idCanvas");
  
  infoText.innerHTML = "We are loading resources...";
  initialization().then(
    result => {
      infoText.innerHTML = "Press SPACE to start race";
      tick();
    },
    error => alert(error)
  );
}

document.addEventListener('DOMContentLoaded', mainFunction);