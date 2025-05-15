import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import WorldObject from './worldObject.js';
import Capsule from '../cannon/capsule.js';

export default class EnemyObject extends WorldObject {

    constructor(game, {position, rotation, gravity, startupCallback, updateCallback} = {}) {
        super(game, {position, rotation, gravity, startupCallback, updateCallback});
        this._movementSpeed = 4;
    }

    async _generateMesh() {
        let gltf = await this._loader.loadAsync('/male.glb', (e) => {
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
    }

    _setupPhysics() {
        this._body = new Capsule(0.5, 1.8, 1, {
            x: this._initialPosition.x,
            y: this._initialPosition.y,
            z: this._initialPosition.z
        });
        
        this._physicsMaterial = new CANNON.Material('enemyMaterial');
        this._contactMaterial = new CANNON.ContactMaterial(this._physicsMaterial, this._terrainPhysicsMaterial, {
            friction: 0.1,
            restitution: 0.0
        });

        this._body._capsuleBody.material = this._physicsMaterial;
    }

    update() {
        super.update();
        this._mesh.position.copy(this._game.cannonToThreeVec3(this._body._capsuleBody.position));
        //this._mesh.quaternion.copy(this._game.cannonToThreeQuaternion(this._body._capsuleBody.quaternion));
        if (this._visualFacingAngle !== undefined) {
            this._mesh.quaternion.setFromEuler(new THREE.Euler(0, this._visualFacingAngle, 0));
        }
    }

    /**
     * Face the target and move towards it at the speed specified.
     * If no speed is specified, the enemies default movementSpeed is used.
     * 
     * @param {Object3D} target 
     */
    pursue(target, speed = null) {
        // Get physics-based position as THREE.Vector3
        const enemyPos = this._game.cannonToThreeVec3(this._body._capsuleBody.position);
        
        // Clone and flatten target position
        const targetPos = target.position.clone();
        targetPos.y = enemyPos.y;
    
        // Calculate direction
        const direction = targetPos.clone().sub(enemyPos);
        if (direction.lengthSq() === 0) return;
    
        // Angle the enemy should face
        const angle = Math.atan2(direction.x, direction.z);
    
        // Movement direction
        const moveDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
        moveDir.normalize();
    
        speed = speed || this._movementSpeed;
        this._body._capsuleBody.velocity.x = moveDir.x * speed;
        this._body._capsuleBody.velocity.z = moveDir.z * speed;
    
        // Store angle for visual orientation
        this._visualFacingAngle = angle;
    }        
        
}