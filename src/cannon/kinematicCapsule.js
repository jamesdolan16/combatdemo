import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default class KinematicCapsule {
    constructor(world, chunk, initialPosition = { x: 0, y: 0, z: 0 }) {
        this.world = world;
        this.chunk = chunk;
        this.scene = chunk._scene;

        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        this.moveSpeed = 0.005;
        this.jumpVelocity = 0.005;
        this.gravity = -0.000982;
        this.maxSlope = 0.7;
        this.grounded = false;
        this.initialPosition = initialPosition;

        this.velocityY = 0;

        this._initBody();
    }

    _initBody() {
        const radius = 0.5;
        const height = 1.8;
        const cylinderHeight = height - 2 * radius;

        this.body = new CANNON.Body({
            type: CANNON.Body.KINEMATIC,
            position: new CANNON.Vec3(
                this.initialPosition.x,
                this.initialPosition.y,
                this.initialPosition.z
            ),
        });

        const q = new CANNON.Quaternion();
        const cylinder = new CANNON.Cylinder(radius, radius, cylinderHeight, 8);

        this.body.addShape(cylinder, new CANNON.Vec3(0, 0, 0), q);
        this.body.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, cylinderHeight / 2, 0));
        this.body.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, -cylinderHeight / 2, 0));

        this.world.addBody(this.body);
    }

    _groundCheck() {
        const ray = new CANNON.Ray();
        const from = this.body.position.clone();
        const to = this.body.position.clone();
        from.y -= 0.9;
        to.y -= 1.1;

        ray.from.copy(from);
        ray.to.copy(to);

        const result = new CANNON.RaycastResult();
        ray.intersectBodies(this.world.bodies, result);

        if (result.hasHit && result.body !== this.body) {
            const slope = result.hitNormalWorld.dot(CANNON.Vec3.UNIT_Y);
            return slope > this.maxSlope;
        }

        return false;
    }

    update(delta) {
        // Build input vector
        const move = new THREE.Vector3();
        if (this.input.forward) move.z -= 1;
        if (this.input.backward) move.z += 1;
        if (this.input.left) move.x -= 1;
        if (this.input.right) move.x += 1;

        // Rotate input by facing direction, ignore pitch/roll
        move.applyEuler(this.direction);
        move.y = 0;
        
        if (move.lengthSq() > 0) {
            move.normalize();
        }

        // Calculate horizontal velocity (units per second)
        const horizontalSpeed = this.moveSpeed; // e.g. 5 units/sec
        const velocityX = move.x * horizontalSpeed;
        const velocityZ = move.z * horizontalSpeed;

        // Ground check
        this.grounded = this._groundCheck();
        console.log(`Grounded: ${this.grounded}`);

        // Handle vertical velocity (jump & gravity)
        if (this.grounded) {
            if (this.input.jump) {
                this.velocityY = this.jumpVelocity; // e.g. 5 units/sec upward
            } else {
                this.velocityY = 0;
            }
        } else {
            this.velocityY += this.gravity * delta; // gravity acceleration applied over time
        }

        console.log(`Velocity: ${velocityX}, ${this.velocityY}, ${velocityZ}`);
        // Compose final velocity vector
        const velocity = new CANNON.Vec3(velocityX, this.velocityY, velocityZ);

        // Move body by velocity * deltaTime (displacement)
        const displacement = new CANNON.Vec3();
        velocity.scale(delta, displacement);
        console.log(`Displacement: ${displacement.x}, ${displacement.y}, ${displacement.z}; delta: ${delta}`);

        // Add displacement to position (move the capsule)
        this.body.position.vadd(displacement, this.body.position);
    }
}
