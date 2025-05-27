import DynamicWorldObject from "./DynamicWorldObject";
import * as U from "../utilities";
import Interactable from "./interactable";
import Capsule from "../cannon/capsule";
import * as CANNON from "cannon-es";

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
    }

    async initialise() {
        await this._loadInventory();
        await super.initialise();
        this._equipItems();
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
        this._bodyCapsule = new Capsule(0.5, 1.8, 1, {
            x: this._initialPosition.x,
            y: this._initialPosition.y,
            z: this._initialPosition.z
        });

        this._body = this._bodyCapsule._capsuleBody;

        this._physicsMaterial = new CANNON.Material();
        this._terrainContactMaterial = new CANNON.ContactMaterial(
            this._physicsMaterial, 
            this._game._terrainPhysicsMaterial, 
            {
                friction: 0.1,
                restitution: 0
            }
        );
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
            this._body.position.x, 
            this._body.position.y + 0.5, 
            this._body.position.z
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