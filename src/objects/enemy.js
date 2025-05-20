import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import HumanObject from './human.js';
import Capsule from '../cannon/capsule.js';
import WorldObject from './worldObject.js';
import * as U from '../utilities.js';

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
     * @param {WorldObject} target 
     */
    pursue(target, speed = null) {
        if (this._targetLastKnownPosition === null) throw new Error("Can't pursue, no knowledge of targets position");
        // Clone and flatten target position
        const flatTargetPos = this._targetLastKnownPosition;
        flatTargetPos.y = this._mesh.position.y;
    
        // Calculate direction/distance to target
        const direction = flatTargetPos.clone().sub(this._mesh.position);
        if (direction.lengthSq() === 0) return;
    
        // Angle the enemy should face
        const angle = Math.atan2(direction.x, direction.z);
    
        // Movement direction
        const moveDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
        moveDir.normalize();
    
        speed = speed || this._movementSpeed;
        this._body._capsuleBody.velocity.x = moveDir.x * speed;
        this._body._capsuleBody.velocity.z = moveDir.z * speed;
        
        if (this.stuck() && this.grounded()) this.jump();
        
        if (!this.walkNoBobbing?.isRunning()) {
            this.walkNoBobbing = this._mixer.clipAction(this._animations.find(anim => anim.name === "walk-no-bobbing")).play();
        }

        // Store angle for visual orientation
        this._visualFacingAngle = angle;

        const distance = this._targetLastKnownPosition.distanceTo(this._mesh.position);
        if (distance < 3) {
            this.attack(target)
        } else {
            this.stopAttacking();
        }
    }

    attack(target) {
        if (!this.attacking?.isRunning()) this.attacking = this._mixer.clipAction(this._animations.find(anim => anim.name === "1h-chop.R")).play();
        //if (!this.walkNoBobbing?.isRunning()) this.walkNoBobbing = this._mixer.clipAction(this._animations.find(anim => anim.name === "walk-no-bobbing")).play().setEffectiveWeight(1);
        //if (!this.walk?.isRunning()) this.walk = this._mixer.clipAction(this._animations.find(anim => anim.name === "walk")).stop();

    }

    stopAttacking() {
        this.attacking = this._mixer.clipAction(this._animations.find(anim => anim.name === "1h-chop.R")).stop();
        //if (!this.walkNoBobbing?.isRunning()) this.walkNoBobbing = this._mixer.clipAction(this._animations.find(anim => anim.name === "1h-chop.R")).stop();
        //if (!this.walk?.isRunning()) this.walk = this._mixer.clipAction(this._animations.find(anim => anim.name === "walk")).play();
    }

    /**
     * Identifies if the enemy is stuck on the terrain
     */
    stuck() {
        if (this._positionHistory.length < 2) return false; // Not enough data to determine if stuck

        let maxDistance = 0;
        this._positionHistory.forEach((pos, index) => {
            if (index === 0) return; // Skip the first position
            const distance = pos.position.distanceTo(this._positionHistory[index - 1].position);
            if (distance > maxDistance) maxDistance = distance;
        });

        console.log("Max distance: ", maxDistance);
        return maxDistance <= U.STUCKTHRESHOLD;
    }
        
}