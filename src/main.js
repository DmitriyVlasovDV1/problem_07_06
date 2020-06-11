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


/* Animation system class */
class classAnimation {
  constructor() {
    /* Canvas */
    this.canvas = document.getElementById("idCanvas");

    /* Scene */
    this.scene = new THREE.Scene();

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.setClearColor(0x111111);
    this.renderer.shadowMapEnabled = true;
    
    /* Camera*/
    this.camera = new THREE.PerspectiveCamera(75, this.canvas.width / this.canvas.height, 0.1, 1000);
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
        time: {value: animSys.timeMs}
      },

      vertexShader: vertShaderStrLandscape,
      fragmentShader: fragShaderStrLandscape
    } );

    this.primitive = new THREE.Mesh(geometry, material);
    this.primitive.rotation.x=-0.5*Math.PI;
    this.primitive.position.y = -5;
    this.primitive.receiveShadow = true;

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

    /* Segments */
    this.segments = []
    let arrCoords = txtTrafficCoords.split("\n");
    this.numOfSegments = arrCoords.length / 2 - 1;
    for (let i = 0; i < this.numOfSegments; i++) {
      this.segments.push([new THREE.Vector3(...eval(arrCoords[i * 2])), 
                          new THREE.Vector3(...eval(arrCoords[i * 2 + 1]))]);
    }

    /* Cars */
    let tmp = new THREE.Vector3();
    this.minCarsGap = 10;
    this.radarRadius = 20;
    this.cars = []
    this.numOfCars = 15;
    for (let i = 0; i < this.numOfCars - 1; i++) {
      this.cars.push(new classCar(tmp.addVectors(this.segments[i][0], this.segments[i][1]).multiplyScalar(0.5), i + 1));
    }

    this.player = new classCar(tmp.addVectors(this.segments[this.numOfCars - 1][0], this.segments[this.numOfCars][1]).multiplyScalar(0.5), this.numOfCars)
    this.player.isControllerd = true;

    //this.player.primitive.copy(model_car);

    this.cars.push(this.player);
  }

  
  response () {
    for (let car of this.cars) {
      let v1 = this.segments[car.targetSegment][0];
      let v2 = this.segments[car.targetSegment][1];
      
      let vC = car.primitive.position;

      let vecSeg = new THREE.Vector3();
      let vecCar = new THREE.Vector3();
      let vecTarget = new THREE.Vector3();
      let tmp = new THREE.Vector3();
      let proj;

      
      vecSeg.subVectors(v2, v1);
      vecCar.subVectors(vC, v1);
      tmp.copy(vecSeg).normalize();

      vecTarget.copy(tmp).multiplyScalar(vecCar.dot(tmp));

      if (vecTarget.length() > vecSeg.length() || tmp.subVectors(vecSeg, vecTarget).length() > vecSeg.length()) {
        if (vecTarget.length() < tmp.subVectors(vecSeg, vecTarget).length()) {
          vecTarget.set(0, 0, 0);
        } else {
          vecTarget.copy(vecSeg);
        }
      }

      car.moveTargetDir.subVectors(vecTarget, vecCar);

      if (car.moveTargetDir.length() < 2) {
        car.targetSegment = (car.targetSegment + 1) % this.numOfSegments;
      }
      car.moveTargetDir.normalize();

      let prog = vecTarget.length() / vecSeg.length();
      let isBreaking = false;
      for (let car2 of this.cars) {
        tmp.subVectors(car2.primitive.position, car.primitive.position);
        if (tmp.length() < this.radarRadius && tmp.normalize().dot(car.moveTargetDir) > 0.80) {
          if (tmp.length() < this.minCarsGap) {
            isBreaking = true;
          }
          if (prog < 0.5) {
            car.moveTargetDir.copy(tmp.copy(vecSeg).normalize().add(car.moveTargetDir).normalize());
          } else {
            car.moveTargetDir.copy(tmp.copy(vecSeg).normalize().negate().add(car.moveTargetDir).normalize());
          }
        }
      }

      car.response(isBreaking);
    }
  }
  
}


class classCar {
  constructor (position, targetSegment) {
    /* Model */
    
    let geometry = new THREE.SphereGeometry(5, 20, 20);
    let material = new THREE.MeshPhongMaterial( { color: 0xAA00AA } );
    this.primitive = new THREE.Mesh(geometry, material);
    
    /*this.primitive = new THREE.Object3D();
    this.primitive.copy(model_car);*/
    this.primitive.position.copy(position);


    animSys.scene.add(this.primitive);



    /* Movements params */
    this.maxSpeed = 75;
    this.rotationSpeed = 0.2;
    this.accelerationStarting = 20;
    this.accelerationBreaking = -60;

    this.currendBuff = 0;
    this.maxBuff = 70;

    this.currentSpeed = 0.0;
    this.currentAcceleration = 0.0;
    
    this.timeLastUpdate = Date.now();
    this.isFirstResponse = true;
    this.timeLastBuff = Date.now();
    this.moveTargetDir = new THREE.Vector3(0, 0 ,0);
    this.moveDir = new THREE.Vector3(0, 0 ,0);
    this.targetSegment = targetSegment;

    this.dirUp = new THREE.Vector3(0, 1, 0);

    this.isControllerd = false;

    this.dirUp = new THREE.Vector3(0, 1, 0);
    this.dirNorth = new THREE.Vector3();
    this.dirSouth = new THREE.Vector3();
    this.dirEast = new THREE.Vector3();
    this.dirWest = new THREE.Vector3();

  }

  response (isBreaking) {
    if (this.isFirstResponse) {
      this.isFirstResponse = false;
      this.timeLastUpdate = Date.now();
      this.timeLastBuff = Date.now();
      return;
    }

    let tmp = new THREE.Vector3();

    if (this.isControllerd) {
      speedText.innerHTML = `Your speed: ${((this.currentSpeed) * 10 / 36).toFixed(2)} km/h`;

      this.dirEast.crossVectors(animSys.camDir, this.dirUp).normalize();
      this.dirWest.copy(this.dirEast).negate();
      this.dirNorth.crossVectors(this.dirWest, this.dirUp).normalize();
      this.dirSouth.copy(this.dirNorth).negate();

      if (!isBreaking && animSys.currentlyPressedKeys['W'.charCodeAt(0)]) {
        this.currentAcceleration = this.accelerationStarting;
        this.moveDir.copy(this.dirNorth.multiplyScalar(this.rotationSpeed * 1.5));
      } else {
        this.currentAcceleration = this.accelerationBreaking;  
      }
      if (animSys.currentlyPressedKeys['A'.charCodeAt(0)]) {
        this.moveDir.add(this.dirWest.multiplyScalar(this.rotationSpeed));
      } if (animSys.currentlyPressedKeys['D'.charCodeAt(0)]) {
        this.moveDir.add(this.dirEast.multiplyScalar(this.rotationSpeed));
      }
    } else {
      if (!isBreaking && this.currentSpeed < this.maxSpeed) {
        this.currentAcceleration = this.accelerationStarting;
      } else if (isBreaking && this.currentSpeed > 0.0) {
        this.currentAcceleration = this.accelerationBreaking;
      } else {
        this.currentAcceleration = 0.0;
      }

      this.moveDir.add(tmp.subVectors(this.moveTargetDir.normalize(), this.moveDir.normalize()).normalize().multiplyScalar(this.rotationSpeed));
    }

    let deltaTime = (Date.now() - this.timeLastUpdate) / 1000.0;
    this.timeLastUpdate = Date.now();

    if ((Date.now() - this.timeLastBuff) / 1000.0 > 10) {
      this.currendBuff = (Math.random() - 0.5) * this.maxBuff;
      this.timeLastBuff = Date.now();
    } 
    if (this.isControllerd && (Date.now() - this.timeLastBuff) / 1000.0 < 3) {
      infoText.innerHTML = `Your max speed have been changed to ${((this.maxSpeed + this.currendBuff) * 10 / 36).toFixed(2)} km/h`;
      this.flagInfo = true;
    } else if (this.isControllerd && this.flagInfo) {
      let arr = [`Be careful! ♥`, `Going out of textures isnt fair ☺`, `Turtle on the road!`, `Only ${traffic.numOfCars - 1} left!`];
      this.flagInfo = false;
      infoText.innerHTML = arr[Math.floor(Math.random() * arr.length)];
    }
    


    this.currentSpeed += this.currentAcceleration * deltaTime;

    if (this.currentSpeed > this.maxSpeed + this.currendBuff) {
      this.currentSpeed = this.maxSpeed + this.currendBuff;
    } else if (this.currentSpeed < 0.0) {
      this.currentSpeed = 0.0;
    }

    let deltaLength = this.currentSpeed * deltaTime + 0.5 * this.currentAcceleration * deltaTime ** 2;
    
    this.primitive.lookAt(tmp.addVectors(this.moveDir, this.primitive.position));
    this.primitive.position.add(tmp.copy(this.moveDir.normalize()).multiplyScalar(deltaLength));
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


    if (!isBreaking && this.currentSpeed < this.maxSpeed) {
      this.currentAcceleration = this.deltaAcceleration;
    } else if (isBreaking && this.currentSpeed > 0.0) {
      this.currentAcceleration = -this.deltaAcceleration;
    } else {
      this.currentAcceleration = 0.0;
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


function tick() {
  requestAnimationFrame(tick);

  /* Response */

  animSys.response();
  //editor.response();
  if (flag) {
    traffic.response();
    cameraTracker.response(traffic.player.primitive.position);
  }

  /* Render */
  animSys.render();
}

let speedText;
let infoText;
let animSys;
let cameraTracker;
let landscape;
let editor;
let editor1;
let editor2;
let traffic;
let model_car;
const objLoader = new OBJLoader2();
const mtlLoader = new MTLLoader();

function mainFunction() {

  /* Initialization of animation system */
  animSys = new classAnimation();
  animSys.setCamPos([-30, 40, 30]);
  animSys.setCamAt([0, 0, 0]);


  
  mtlLoader.load('./src/lego_car/lego_car_b2.mtl', (mtlParseResult) => {
    const materials =  MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
    objLoader.addMaterials(materials);
    objLoader.load('./src/lego_car/lego_car_b2.obj', (root) => {
      root.applyMatrix4((new THREE.Matrix4()).scale(new THREE.Vector4(0.5, 0.5, 0.5)));
      animSys.scene.add(root);
     })});
  

  traffic = new classTraffic();

  cameraTracker = new classCameraTracker(80, 50, 40, 20);

  
  let commonPath = "./src/images/landscape/";


  /* Light */
  let spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( -40, 600, -10 );
  spotLight.castShadow = true;
  animSys.scene.add(spotLight);

  /* Cube */
  let geometryCube = new THREE.BoxGeometry(5, 5, 5);
  let materialCube = new THREE.MeshLambertMaterial( { color: 0x3333333 } );
  let cube = new THREE.Mesh( geometryCube, materialCube );
  cube.castShadow = true;

  cube.position.y = 20;
  animSys.scene.add( cube );

  landscape = new classLandscape(75.0, 500, 500, 500, 500, 
    20.0,
    commonPath + "texture_height.jpg", 
    commonPath + "texture_materials.jpg", 
    commonPath + "texture_grass.jpg", 
    commonPath + "texture_stone.jpg",
    commonPath + "texture_dirt.jpg",
    commonPath + "texture_sand.jpg",
    commonPath + "texture_lava.jpg",
    commonPath + "texture_road.jpg");

  animSys.scene.add(landscape.primitive);  

  //editor = new classEditor(4, 0xff0000, 0.5);
  //animSys.scene.add(editor.primitive); 
  

  /* Plane */
  let geometryPlane = new THREE.PlaneGeometry(60,20,1,1);
  let materialPlane = new THREE.MeshLambertMaterial( { color: 0x999999 } );
  let plane = new THREE.Mesh( geometryPlane, materialPlane );
  plane.receiveShadow = true;

  plane.rotation.x=-0.5*Math.PI;
	plane.position.x = 15;
	plane.position.y = 0;
  plane.position.z = 0;
  
  animSys.scene.add( plane );

  let axes = new THREE.AxisHelper( 20 );
	animSys.scene.add(axes);

  animSys.setSkybox([
    './src/images/skybox_01/xpos.jpg',
    './src/images/skybox_01/xneg.jpg',
    './src/images/skybox_01/ypos.jpg',
    './src/images/skybox_01/yneg.jpg',
    './src/images/skybox_01/zpos.jpg',
    './src/images/skybox_01/zneg.jpg'
    ]);
  tick();


  /*
  document.addEventListener('keydown', Mandelbrot.handleKeyDown);
  document.addEventListener('keyup', Mandelbrot.handleKeyUp);
  */

  infoText = document.getElementById("idInfo");
  speedText = document.getElementById("idSpeed");

  
}

document.addEventListener('DOMContentLoaded', mainFunction);