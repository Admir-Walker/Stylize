import React, { Component } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../style.css";
import ColorPicker from "./ColorPicker";

const INITIAL_MTL = new THREE.MeshPhongMaterial({
  color: 0xf1f1f1,
  shininess: 10,
});

export default class Nova extends Component {
  constructor(props) {
    super(props);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.loader = null;
    this.model = null;
    this.controls = null;
    this.state = {
      color: "#ddd",
      selected: "",
      modelComponents: [],
    };
  }
  initializeThree = () => {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf1f1f1);
    this.scene.fog = new THREE.Fog(0xf1f1f1, 20, 100);
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.camera.position.x = 0;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
    document.getElementById("scene").appendChild(this.renderer.domElement);
  };
  setControls = () => {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minPolarAngle = Math.PI / 3;
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.dampingFactor = 0.1;
    this.controls.autoRotate = false; // Toggle this if you'd like the chair to automatically rotate
    this.controls.autoRotateSpeed = 0.2; // 30
  };
  resizeRenderer() {
    const canvas = this.renderer.domElement;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let canvasPixelWidth = canvas.width / window.devicePixelRatio;
    let canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResizing =
      canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResizing) this.renderer.setSize(width / 2, height / 2);
    return needResizing;
  }
  startAnimating = () => {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.startAnimating);
    if (this.resizeRenderer()) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
  };

  loadModel = () => {
    this.loader = new GLTFLoader();
    this.loader.load(this.props.modelPath, (gltf) => {
      this.model = gltf.scene;
      let temp = [];
      this.model.traverse((o) => {
        if (o.isMesh) {
          temp.push({ childID: o.name, mtl: INITIAL_MTL });
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      this.setStateAsync({ modelComponents: [...temp] });
      this.model.scale.set(2, 2, 2);
      this.model.rotation.y = Math.PI;
      this.model.position.y = -1;

      for (let object of this.state.modelComponents) {
        this.addTexturesToModel(this.model, object.childID, object.mtl);
      }
      this.scene.add(this.model);
    });
  };
  addLights = () => {
    let hemiLights = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.61);
    hemiLights.position.set(0, 50, 0);
    this.scene.add(hemiLights);

    let dirLights = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLights.position.set(-8, 12, 8);
    dirLights.castShadow = true;
    dirLights.shadow.mapSize = new THREE.Vector2(1024, 1024);
    this.scene.add(dirLights);
  };
  addFloor = () => {
    var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    var floorMaterial = new THREE.MeshPhongMaterial({
      color: 0xeeeeee,
      shininess: 0,
    });

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;
    floor.position.y = -1;
    this.scene.add(floor);
  };

  addTexturesToModel = (parent, type, mtl) => {
    parent.traverse((o) => {
      if (o.isMesh) {
        if (o.name.includes(type)) {
          o.material = mtl;
          o.nameID = type;
        }
      }
    });
  };

  setStateAsync = (state) => {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  };
  handleChangeComplete = async (color) => {
    await this.setStateAsync({ color: color });
    let new_mtl;
    new_mtl = new THREE.MeshPhongMaterial({
      color: color.hex,
      //shininess: color.shininess ? color.shininess : 10,
    });
    this.setMaterial(this.model, this.state.selected, new_mtl);
  };
  handleSelectedPart = async (part) => {
    await this.setStateAsync({ selected: part });
  };
  setMaterial = (parent, type, mtl) => {
    parent.traverse((o) => {
      if (o.isMesh && o.nameID != null) {
        if (o.nameID === type) {
          o.material = mtl;
        }
      }
    });
  };
  async componentDidMount() {
    await this.setStateAsync({selected:this.props.defaultSelected})
    this.initializeThree();
    this.setControls();
    this.startAnimating();
    this.loadModel();
    this.addFloor();
    this.addLights();
  }
  render() {
    const labels = this.state.modelComponents.map((el) => {
      return (
          <option key = {el.childID}
            id={el.childID}
            value={el.childID}
            selected={this.state.selected === el.childID}
          >
          {String(el.childID).charAt(0).toUpperCase()+String(el.childID).slice(1)}
          </option>
      );
    });
    return (
      <div className="row">
        <div className="col" id="scene">
        </div>
        <div className="col">
          <ColorPicker
            color={this.state.color}
            handleChangeComplete={this.handleChangeComplete}
          />
        </div>
        <div className="col">
          <select onChange={(e) => this.handleSelectedPart(e.target.value)}>
          {labels}
          </select>
        </div>
      </div>
    );
  }
}
