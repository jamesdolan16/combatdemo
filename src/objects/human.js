import WorldObject from './worldObject.js';

import * as CANNON from 'cannon-es';
import * as THREE from 'three';

import * as U from '../utilities.js';
import Capsule from '../cannon/capsule.js';

export default class HumanObject extends WorldObject {
    constructor(game, options = {}) {
        super(game, options);

        const {
            movementSpeed = U.WALKSPEED,
            jumpVelocity = U.JUMPVELOCITY,
            viewDistance = U.VIEWDISTANCE,
            inventory = [],
        } = options;
        
        this._movementSpeed = movementSpeed;
        this._jumpVelocity = jumpVelocity;
        this._viewDistance = viewDistance;
        this.inventory = inventory;
        this.slots = {
            rightHand: null,
            leftHand: null
        }
    }

    async initialise() {
        await this._preloadMeshes();
        await super.initialise();
        this._equipItems();
    }

    async _preloadMeshes() {
        await Promise.all(this?.inventory.map(async item => {
            item.mesh = await this._GLTFCache.fetchClonedScene(item.name);
            item.handSocket = item.mesh.getObjectByName('handSocket');
        }));
    }

    _equipItems() {
        this.inventory.forEach(item => {
            if (item?.equippedR) this.equipRightHand(item);
            else if (item?.equippedL) this.equipLeftHand(item);
        });
    }

    equipRightHand(item) {
        if (item?.mesh) {
            this.slots.rightHand = item;
            this.alignToSocket(item.mesh, item.handSocket, this._rightHandSocket);
        } else {
            console.warn('Item mesh is not defined, cannot equip right hand');
        }
    }
    
    equipLeftHand(item) {
        if (item?.mesh) {
            this.slots.leftHand = item;
            this.alignToSocket(item.mesh, item.handSocket, this._leftHandSocket);
        } else {
            console.warn('Item mesh is not defined, cannot equip left hand');
        }
    }

    async _generateMesh() {
        const gltf = await this._GLTFCache.fetch('male-default');
        const scene = gltf.scene.clone();

        this._mesh = new THREE.Object3D();  // Wrapper to ensure correct rotation
        this._mesh.castShadow = true;
        this._mesh.userData.parent = this;
        this._mesh.userData.box = new THREE.Box3().setFromObject(scene);
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

        scene.position.y = -this._mesh.userData.height / 2;
        this._mesh.add(scene);

        this._animations = gltf.animations;
        this._mixer = new THREE.AnimationMixer(this._mesh);
        this._cameraSocket = scene.getObjectByName('firstPersonCameraSocket');
        this._rightHandSocket = scene.getObjectByName('handSocketR');
        this._leftHandSocket = scene.getObjectByName('handSocketL');
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
            restitution: 0.0,
        });

        this._body._capsuleBody.material = this._physicsMaterial;
    }

    update(delta) {
        super.update(delta);
        this._mixer.update(delta);
        this._mesh.position.copy(this._game.cannonToThreeVec3(this._body._capsuleBody.position));
    }

    grounded() {
        // Set up a ray that starts at the player's current position and points downward
        const rayOrigin = new THREE.Vector3(
            this._body._capsuleBody.position.x, 
            this._body._capsuleBody.position.y + 0.5, 
            this._body._capsuleBody.position.z
        ); // Slight offset upwards to start above the player
        const rayDirection = new THREE.Vector3(0, -1, 0);  // Ray going downward
        
        const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 2); // Range is from 0 to 1 to detect objects just beneath
        const intersects = raycaster.intersectObject(this._game._terrain);  // _terrain is the terrain object or mesh
        
        return intersects.length > 0; // If there's an intersection, we're grounded
    }

    canSee(target) {
        const directionVector = new THREE.Vector3();
        this._mesh.getWorldDirection(directionVector);

        const toTarget = new THREE.Vector3().subVectors(target._mesh.position, this._mesh.position);
        const distance = toTarget.length();
        toTarget.normalize();

        const angle = directionVector.angleTo(toTarget);
        const fov = Math.PI;

        if (angle < fov / 2 && distance < this._viewDistance) {
            const rayOrigin = this._mesh.position.clone();
            const raycaster = new THREE.Raycaster(rayOrigin, toTarget, 0, this._viewDistance);
            U.debugRaycaster(raycaster, this._game._scene, this._viewDistance, 0x00ff00);

            const intersects = raycaster.intersectObjects(this._game._scene.children, true);
            const validHits = intersects.filter(hit => 
                hit.object.userData.worldObject !== this
                && hit.object.type !== 'Line'
            );  
            
            if (validHits.length > 0 && validHits[0].object.userData.worldObject === target) {
                this._targetLastKnownPosition = target._mesh.position.clone();
                return true;
            } else {
                return false;
            }
        }
    }

    jump() {
        this._body._capsuleBody.velocity.y = this._jumpVelocity;
    }
}