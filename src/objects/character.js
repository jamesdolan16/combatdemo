import DynamicWorldObject from "./DynamicWorldObject";
import * as U from "../utilities";
import Interactable from "./interactable";
import Capsule from "../cannon/capsule";
import KinematicCapsule from "../cannon/kinematicCapsule";
import * as CANNON from "cannon-es";
import * as THREE from "three";

export default class Character extends DynamicWorldObject {
    constructor(chunk, objectScene) {
        super(chunk, objectScene);

        const {
            movementSpeed = U.WALKSPEED,
            jumpVelocity = U.JUMPVELOCITY,
            viewDistance = U.VIEWDISTANCE,
            initialInventory = [],
        } = objectScene.userData;
        
        this._movementSpeed = movementSpeed;
        this._jumpVelocity = jumpVelocity;
        this._viewDistance = viewDistance;
        this._initialInventory = initialInventory;
        this.slots = {
            rightHand: null,
            leftHand: null
        }

        this._mass = 100;
        this.inventory = structuredClone(this._initialInventory);
    }

    get type() { return 'Character'; }

    async initialise() {
        //await this._loadInventory();
        await super.initialise();
        //this._equipItems();

        this._readyLevel = this.type;
    }

    async _loadScene() {
        //await super._loadScene();
        this._scene = await this._GLTFCache.fetchClonedScene(this._baseName, this);
        this._scene = this._scene.children[0];
        this._animations = await (this._GLTFCache.fetch(this._baseName)).animations;
        this._mixer = new THREE.AnimationMixer(this._scene);
        
        const wrapper = new THREE.Object3D();
        wrapper.castShadow = true;
        wrapper.userData.worldObject = this;
        const boundingBox = new THREE.Box3().setFromObject(this._scene);
        const height = boundingBox.max.y - boundingBox.min.y;
        const scaleFactor = 1.8 / height;
        wrapper.scale.setScalar(scaleFactor);
        wrapper.position.set(
            this._initialPosition.x, 
            this._initialPosition.y,
            this._initialPosition.z
        );
        wrapper.rotation.set(
            this._initialRotation.x,
            this._initialRotation.y,
            this._initialRotation.z
        );
        this._scene.position.y = -height / 2;

        wrapper.add(this._scene);
        this._scene = wrapper;
        this._mesh = this._scene.children[0]; // Should always be the main mesh due to our wrapper-ing
    }

    update(delta, timestamp) {
        super.update(delta, timestamp);
    }

    async _loadInventory() {
        this._inventory = new Map();
        await Promise.all(this?._initialInventory.map(async item => {
            const scene = await this._GLTFCache.fetchClonedScene(item.name, this);
            scene.userData.quantity = item.quantity;
            scene.userData.equipSlot = item.equipSlot;
            this._inventory.set(item.name, new Interactable(this._game, scene));
        }));
    }

    _setupPhysics() {
        const radius = 0.5
        const height = 3.5 // vertical distance between the centers of the spheres (not total height)
      
        // Position from the scene (same as you're doing)
        const worldPos = this._scene.getWorldPosition(new THREE.Vector3())
      
        // Create a capsule body
        this.gameScene.physics.add.existing(this._scene,
            {
                shape: 'capsule',
                name: 'character',
                radius,
                height,
                x: worldPos.x,
                y: worldPos.y + radius + height / 2, // lift to stand on ground
                z: worldPos.z,
                mass: this._mass
            },
            { lambert: { color: 0x00ff00 } } // optional: a basic mesh material if debugging
        )

        this._scene.body.setAngularFactor(0, 0, 0);
        this._scene.body.setFriction(1);
        this._scene.body.setDamping(0.9, 1); // linear, angular damping
    }
      

    _equipItems() {
        Array.from(this._inventory.entries()).forEach(item => {
            if (item.equipSlot && this._sockets.has(item.equipSlot)) {
                this._sockets.get(item.equipSlot).userData.equippedItem = item;
                this.alignToSocket(item, item.equipSocket, this._sockets.get(item.equipSlot));
            }
        })
    }

    grounded() {
        // Set up a ray that starts at the player's current position and points downward
        const rayOrigin = new THREE.Vector3(
            this._scene.position.x, 
            this._scene.position.y + 0.5, 
            this._scene.position.z
        ); // Slight offset upwards to start above the player
        const rayDirection = new THREE.Vector3(0, -1, 0);  // Ray going downward
        
        const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 2); // Range is from 0 to 1 to detect objects just beneath
        const intersects = raycaster.intersectObject(this._chunk._terrain);  // _terrain is the terrain object or mesh
        
        return intersects.length > 0; // If there's an intersection, we're grounded
    }

    canSee(target) {
        const directionVector = new THREE.Vector3();
        this._scene.getWorldDirection(directionVector);

        const toTarget = new THREE.Vector3().subVectors(target._scene.position, this._scene.position);
        const distance = toTarget.length();
        toTarget.normalize();

        const angle = directionVector.angleTo(toTarget);
        const fov = Math.PI;

        if (angle < fov / 2 && distance < this._viewDistance) {
            const rayOrigin = this._scene.position.clone();
            const raycaster = new THREE.Raycaster(rayOrigin, toTarget, 0, this._viewDistance);
            U.debugRaycaster(raycaster, this._game.scene, this._viewDistance, 0x00ff00);

            const intersects = raycaster.intersectObjects(this._game.scene.children, true);
            const validHits = intersects.filter(hit => 
                hit.object.userData.worldObject !== this
                && hit.object.type !== 'Line'
            );  
            
            if (validHits.length > 0 && validHits[0].object.userData.worldObject === target) {
                this._targetLastKnownPosition = target._scene.position.clone();
                return true;
            } else {
                return false;
            }
        }
    }

    jump() {
        this._body.velocity.y = this._jumpVelocity;
    }
}