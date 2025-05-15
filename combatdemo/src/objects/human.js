import WorldObject from './worldObject.js';

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

import * as U from '../utilities.js';
import Capsule from '../cannon/capsule.js';

export default class HumanObject extends WorldObject {
    constructor(game, options = {}) {
        super(game, options);

        const {
            movementSpeed = U.WALKSPEED
        } = options;
        
        this._movementSpeed = movementSpeed;
    }

    async _generateMesh() {
        let gltf = await this._loader.loadAsync('/male-camera.glb', (e) => {
            console.log((e.loaded / e.total * 100) + '% loaded');
        });

        this._mesh = new THREE.Object3D();  // Wrapper to ensure correct rotation
        this._mesh.castShadow = true;
        this._mesh.userData.parent = this;
        this._mesh.userData.box = new THREE.Box3().setFromObject(gltf.scene);
        this._mesh.userData.height = this._mesh.userData.box.max.y - this._mesh.userData.box.min.y;

        this._mesh.scale.setScalar(1.8 / this._mesh.userData.height);

        this._mesh.position.set(
            this._initialPosition.x, 
            this._initialPosition.y, 
            this._initialPosition.z
        );
        this._mesh.rotation.set(
            this._initialRotation.x, 
            this._initialRotation.y, 
            this._initialRotation.z
        );

        gltf.scene.position.y = -this._mesh.userData.height / 2;
        this._mesh.add(gltf.scene);

        this._animations = gltf.animations;
        this._mixer = new THREE.AnimationMixer(this._mesh);
        this._cameraSocket = gltf.scene.getObjectByName('firstPersonCameraSocket');
    }

    _setupPhysics() {
        this._body = new Capsule(0.5, 1.8, 1, {
            x: this._initialPosition.x,
            y: this._initialPosition.y,
            z: this._initialPosition.z
        });
        
        this._physicsMaterial = new CANNON.Material(/*this.id*/);
        this._contactMaterial = new CANNON.ContactMaterial(this._physicsMaterial, this._terrainPhysicsMaterial, {
            friction: 0.1,
            restitution: 0.0
        });

        this._body._capsuleBody.material = this._physicsMaterial;
    }

    update(delta) {
        super.update(delta);
        this._mixer.update(delta);
        this._mesh.position.copy(this._game.cannonToThreeVec3(this._body._capsuleBody.position));
    }
}