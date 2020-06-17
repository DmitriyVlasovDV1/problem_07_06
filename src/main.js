import { mat4, vec3 } from 'gl-matrix';

import './styles.css';

import txtTrafficCoords from './traffic_coords.txt';
import vertShaderStrLandscape from './landscape.vert';
import fragShaderStrLandscape from './landscape.frag';


import * as THREE from 'three';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js';

import {FBXLoader} from '../node_modules/three/examples/jsm/loaders/FBXLoader.js';
import * as dat from 'dat.gui';


/* Animation system class */
class classAnimation {
  constructor() {

    /* Scene */
    this.scene = new THREE.Scene();

    let context = canvas.getContext( 'webgl2', { alpha: false } );
    
    /* Renderer */
    this.renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );

    this.renderer.setClearColor(0x111111);
    this.renderer.shadowMapEnabled = true;
    
    /* Camera*/
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    this.camDir = new THREE.Vector3(0, 0, 0);

    /* Time */
    this.timeMs = Date.now();
    this.timeStart = Date.now();
    this.isPause = false;

    /* Controls */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.currentlyPressedKeys = {};
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.safety = true;

    /* Skybox */
    this.skyBox;

    /* Lights */
    this.lights = [];
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
    } if (animSys.currentlyPressedKeys['P'.charCodeAt(0)]) {
      this.isPause = true;
    } if (animSys.currentlyPressedKeys['G'.charCodeAt(0)]) {
      this.isPause = false;
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
    if (!this.isPause) {
      this.timeMs = Date.now() - this.timeStart;
    }
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
        lightCoeff: {value: light.value},
        lightColor: {value: light.primitive.color},
        lights: {value: []}
      },

      vertexShader: vertShaderStrLandscape,
      fragmentShader: fragShaderStrLandscape
    } );

    this.primitive = new THREE.Mesh(geometry, material);
    this.primitive.rotation.x=-0.5*Math.PI;
    this.primitive.position.y = 0;
    this.primitive.receiveShadow = true;
    animSys.scene.add(this.primitive);

  }
  response (){

    let lightsArray = []
    for (let i = 0; i < animSys.lights.length; i++) {
      lightsArray.push({
        pos: animSys.lights[i].getWorldPosition(),
        dir: (new THREE.Vector3()).subVectors(animSys.lights[i].target.getWorldPosition(), animSys.lights[i].getWorldPosition()),
        angle: animSys.lights[i].angle || 0,
        color: animSys.lights[i].color,
        intensity: animSys.lights[i].intensity,
        distance: animSys.lights[i].distance || 0,
        type: animSys.lights[i].isSpotLight ? 0 : 1,
      });
    }

    this.primitive.material.uniforms.lights.value = lightsArray;
    this.primitive.material.uniforms.lightCoeff.value = light.value;
    this.primitive.material.uniforms.time.value = animSys.timeMs;
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

    this.timeLastBuff = animSys.timeMs;
    this.timeDeltaBuff = 40;
    this.rangeBuff = 4;
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
    this.numOfCars = 5;
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
    if ((animSys.timeMs - this.timeLastBuff) / 1000.0 > this.timeDeltaBuff) {
      this.timeLastBuff = animSys.timeMs;
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
    /* Auxiliary variables */
    this.tmpVec = new THREE.Vector3();
    this.tmpMat = new THREE.Matrix4();

    /* Main Group */
    this.primitive = new THREE.Group();
    this.primitive.position.copy(position);

    animSys.scene.add(this.primitive);
    

    /* Model */
    this.model = new THREE.Object3D();
    this.model.copy(model_car)
    this.model.scale.set(0.03, 0.03, 0.03);
    this.model.position.set(6.6, 1, 6.6);
    this.model.rotation.y = -0.5 * Math.PI;
    this.primitive.add(this.model);

    /* Sounds */
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

      this.sound_00 = sound;
      this.primitive.add(this.sound_00);
    });

    audioLoader.load( './src/sounds/car_on_speed.mp3', ( buffer ) => {
      
      let sound = new THREE.PositionalAudio( listener );
      sound.setBuffer( buffer );
      sound.setRefDistance( 10 );
      
      sound.setLoopEnd(buffer.duration * (0.5 + 0.3 * Math.random()));
      sound.setLoopStart(buffer.duration * 0.3 * Math.random());
      sound.setLoop(true);
      this.sound_01 = sound;
      this.primitive.add(this.sound_01);
      
    });

    /* Headlights */

    this.lightsIntensity = 0.5;
    this.lights = [new THREE.SpotLight(), new THREE.SpotLight()];

    for (let i = 0; i < 2; i++) {
      this.lights[i].color.set(0xFFD700);
      this.lights[i].intensity = 0;

      this.lights[i].position.copy(this.tmpVec.set( ((i % 2) * 2 - 1) * 2.45, 2.3, 11.85));
      this.lights[i].target.position.copy(this.tmpVec.addVectors(this.lights[i].position, new THREE.Vector3(0, -2, 5)));
      this.lights[i].angle = 0.2;
      this.lights[i].distance = 160;
      
      this.lights[i].add(this.lights[i].target);
      
      this.primitive.add(this.lights[i]);

      animSys.lights.push(this.lights[i]);
    }
    
    /* Movements params */

    /* Constants */
    this.maxSpeed = 70;
    this.rotationSpeed = 0.07;
    this.accelerationStarting = 20;
    this.accelerationBreaking = -100;
    this.radiusWheel = 0.8;

    /* Current params */
    this.currentBuff = 0;
    this.currentSpeed = 0.0;
    this.currentAcceleration = 0.0;
    this.currentDir = new THREE.Vector3(0, 0, 0);
    this.targetDir = new THREE.Vector3();
    this.targetSegment = targetSegment;
    
    /* Time params */
    this.timeLastResponse = animSys.timeMs;
    this.timeLastModelTurn = animSys.timeMs;

    /* Flags */
    this.isFirstResponse = true;
    this.isBreaking = false;
    this.isControlled = false;
  }

  response () {
    if (this.isFirstResponse) {
      this.sound_00.play();
      this.sound_01.play();

      this.isFirstResponse = false;
      this.timeLastResponse = animSys.timeMs;
      return;
    }

    /* Computing delta time */
    let deltaTime = (animSys.timeMs - this.timeLastResponse) / 1000.0;
    this.timeLastResponse = animSys.timeMs;

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

    /* Headlights */
    for (let i = 0; i < 2; i++) {
      if (light.value < 0.4) {
        this.lights[i].intensity = this.lightsIntensity;
      } else {
        this.lights[i].intensity = 0;
      }
    }
    
    /* Compute sounds */
    this.sound_01.setVolume(this.maxVolume * (this.currentSpeed / (this.maxSpeed + this.currentBuff)));
    this.sound_00.setVolume(this.maxVolume * (1 - (this.currentSpeed / (this.maxSpeed + this.currentBuff))));

    /* Computing delta length */
    let deltaLength = this.currentSpeed * deltaTime + 0.5 * this.currentAcceleration * deltaTime ** 2;

    /* Computing currentDir */
    this.currentDir.add(this.tmpVec.subVectors(this.targetDir, this.currentDir).normalize().multiplyScalar(this.rotationSpeed)).normalize();

    /* Movement */
    this.primitive.position.add(this.tmpVec.copy(this.currentDir).multiplyScalar(deltaLength));

    if (this.tmpVec.subVectors(this.targetDir, this.currentDir).length() < this.rotationSpeed) {
      this.primitive.lookAt(this.tmpVec.addVectors(this.targetDir, this.primitive.position));
    } else {
      this.primitive.lookAt(this.tmpVec.addVectors(this.currentDir, this.primitive.position));
    }

    /* Wheels rotation */
    let sinRot = this.currentDir.x * this.targetDir.z - this.currentDir.z * this.targetDir.x;
    if (sinRot > 0) {
      this.model.children[3].children[1].children[0].setRotationFromAxisAngle(this.tmpVec.set(0, 0, 1), -Math.asin(sinRot));
      this.model.children[3].children[1].children[1].setRotationFromAxisAngle(this.tmpVec.set(0, 0, 1), -Math.asin(sinRot) + Math.PI);
    } else {
      this.model.children[3].children[1].children[0].setRotationFromAxisAngle(this.tmpVec.set(0, 0, 1), -Math.asin(sinRot));
      this.model.children[3].children[1].children[1].setRotationFromAxisAngle(this.tmpVec.set(0, 0, 1), -Math.asin(sinRot) + Math.PI);
    }
    
    for (let i = 0; i < 2; i++) {
      this.tmpMat.identity().makeRotationY(((i % 2) * 2 - 1) * -1 * (this.currentSpeed / this.radiusWheel) * deltaTime);

      this.model.children[3].children[1].children[i].children[2].applyMatrix4(this.tmpMat);
      this.model.children[3].children[1].children[i].children[4].applyMatrix4(this.tmpMat);
      this.model.children[3].children[1].children[i].children[5].applyMatrix4(this.tmpMat);
    }
    for (let i = 2; i < 4; i++) {
      this.tmpMat.identity().makeRotationY(((i % 2) * 2 - 1) * -1 * (this.currentSpeed / this.radiusWheel) * deltaTime);

      this.model.children[3].children[1].children[i].children[1].applyMatrix4(this.tmpMat);
      this.model.children[3].children[1].children[i].children[3].applyMatrix4(this.tmpMat);
      this.model.children[3].children[1].children[i].children[4].applyMatrix4(this.tmpMat);
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
      this.timeLastUpdate = animSys.timeMs;
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

    let deltaTime = (animSys.timeMs - this.timeLastUpdate) / 1000.0;
    this.timeLastUpdate = animSys.timeMs;

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



class classModelTester {
  constructor() {

    this.tmpVec = new THREE.Vector3();
    this.tmpMatr = new THREE.Matrix4();

    this.car = new THREE.Group();
    this.car.position.set(-120, 0, -120);
    
    this.primitive = new THREE.Object3D();
    this.primitive.copy(model_car).scale.set(0.03, 0.03, 0.03);
    this.primitive.position.set(6.7, 0, 6.6);
    this.primitive.rotation.y = -0.5 * Math.PI;

    
    this.lights = [new THREE.SpotLight(), new THREE.SpotLight()];
    this.helpers = [];

    for (let i = 0; i < 2; i++) {
      this.lights[i].color.set(0xffFFff);
      this.lights[i].intensity = 1;

      this.lights[i].position.copy(this.tmpVec.set( ((i % 2) * 2 - 1) * 2.45, 2.3, 11.85));
      this.lights[i].target.position.copy(this.tmpVec.addVectors(this.lights[i].position, new THREE.Vector3(0, 0, 1)));
      this.lights[i].angle = 0.3;
      this.lights[i].distance = 10;
      
      this.lights[i].add(this.lights[i].target);
      
      this.car.add(this.lights[i]);
    }
    
    
    this.axesHelper = new THREE.AxesHelper( 20 );

    this.car.add(this.primitive);
    this.car.add(this.axesHelper);
    animSys.scene.add(this.car);


  }

  response () {
    /* -2.45, 2.3, 11.85 */
    /*this.light.position.copy(this.tmpVec.set(-2.45, 2.3, 11.85));
    this.light.target.position.copy(this.tmpVec.addVectors(this.light.position, new THREE.Vector3(0, 0, 1)));
    this.light.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), tmpObj.angle * Math.PI);*/
    
  }
}

class classLight {
  constructor (color, dayTime) {
    this.dayTime = dayTime;
    this.color = color;

    this.primitive = new THREE.DirectionalLight(color);
    this.dayProgress = ((animSys.timeMs / 1000.0) % this.dayTime) / this.dayTime;
    this.value = Math.sin(this.dayProgress * Math.PI) * 0.8 + 0.2;
    this.primitive.intensity = this.value;

    this.rotationRadius = 300;

    this.primitive.position.set(Math.cos(this.dayProgress * 2 * Math.PI) * this.rotationRadius, 
                                400, 
                                Math.sin(this.dayProgress * 2 * Math.PI) * this.rotationRadius);
    this.primitive.target.position.set(0, 0, 0);
    this.primitive.castShadow = true;

    /*this.helper = new THREE.DirectionalLightHelper(this.primitive);
    animSys.scene.add(this.helper);*/
    animSys.lights.push(this.primitive);


    animSys.scene.add(this.primitive);
    animSys.scene.add(this.primitive.target);
  }

  response () {
    this.dayProgress = ((animSys.timeMs / 1000.0) % this.dayTime) / this.dayTime;
    this.value = (Math.sin(this.dayProgress * 2 * Math.PI) + 1) * 0.5;
    this.primitive.intensity = this.value;

    this.primitive.position.set(Math.cos(this.dayProgress * 2 * Math.PI) * this.rotationRadius, 
                                400, 
                                Math.sin(this.dayProgress * 2 * Math.PI) * this.rotationRadius);
    this.primitive.target.updateMatrixWorld();
    /*this.helper.update();*/
  }

}

/* GUI helper */
class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return `#${this.object[this.prop].getHexString()}`;
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
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
  //tester.response();

  /* Render */
  animSys.render();
}


let infoText;
let speedText;
let animSys;
let cameraTracker;
let landscape;
let traffic;
let model_car;
let listener;
let light;
let canvas;
let gui;
let tester;
let editor;

async function initialization () {
  /* Animation system */
  await new Promise(function (resolve, reject) {
    animSys = new classAnimation();
    animSys.setCamPos([-30, 40, 30]);
    animSys.setCamAt([0, 0, 0]);
    resolve();
  });

  
  await new Promise(function (resolve, reject) {
    let loader = new FBXLoader();
    //loader.load( './src/sport_car_03/Toyota Chaser TourerV.fbx', function ( object ) {
    loader.load( './src/sport_car_04/car.fbx', function ( object ) {

      object.traverse( function ( child ) {

        console.log(child.name);
        if ( child.isMesh ) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      model_car = object;
      resolve();
    });
  });


  /* Camera tracker system */
  cameraTracker = new classCameraTracker(100, 70, 30, 10);

  /* Light */
  light = new classLight(0xffffff, 40);

  /* Traffic */
  traffic = new classTraffic();
  //tester = new classModelTester();

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
  
  //editor = new classEditor(4, 0xff0000, 0.5);
  //animSys.scene.add(editor.primitive); 


  /* Skybox */
  animSys.setSkybox([
    './src/images/skybox_01/xpos.jpg',
    './src/images/skybox_01/xneg.jpg',
    './src/images/skybox_01/ypos.jpg',
    './src/images/skybox_01/yneg.jpg',
    './src/images/skybox_01/zpos.jpg',
    './src/images/skybox_01/zneg.jpg'
    ]);


  gui.addColor(new ColorGUIHelper(light.primitive, 'color'), 'value').name('Sun light color');

}

class classtmpObj {
  constructor() {
    this.X = 0;
    this.Y = 0;
    this.Z = 0;
    this.angle = 0;
  }
}

let tmpObj = new classtmpObj()

function mainFunction() {
  /* HTML texts */
  infoText = document.getElementById("idInfo");
  speedText = document.getElementById("idSpeed");

  /* Canvas */
  canvas = document.getElementById("idCanvas");
  
  /* GUI */
  gui = new dat.GUI();

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