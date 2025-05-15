import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import HumanObject from './human.js';
import Capsule from '../cannon/capsule.js';

export default class EnemyObject extends HumanObject {

    constructor(game, options = {}) {
        super(game, options);
    }

    update(delta) {
        super.update(delta);
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