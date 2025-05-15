import HumanObject from "./human";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { PointerLockControls } from "three/examples/jsm/Addons.js";

export default class PlayerObject extends HumanObject {
    constructor(game, options = {}) {
        super(game, options);
        game.activePlayer = this;
    }

    async initialise() {
        await super.initialise();
        this._setupCamera();
        this._setupControls();
    }

    _setupCamera() {
        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const worldPosition = this._cameraSocket.getWorldPosition(new THREE.Vector3());
        this._camera.position.copy(worldPosition);
        this._camera.rotation.copy(this._cameraSocket.rotation);
        this._camera.userData.parent = this;
    }

    _setupControls() {
        this._controls = new PointerLockControls(this._camera, this._game._container);
        this._controls.lookSpeed = 0.005;
        this._controls.lookVertical = true;

        document.addEventListener('click', () => {
            this._controls.lock();
        });
          
        document.addEventListener('keypress', (event) => {
            if (event.code === 'KeyEscape') {
                this._controls.unlock();
            }
        });

        this._playerVelocity = new CANNON.Vec3();
        this._playerDirection = new THREE.Vector3();
        this._playerDirection.set(0, 0, 0);

        this._keysPressed = {};

        document.addEventListener('keydown', (e) => this._keysPressed[e.code] = true);
        document.addEventListener('keyup', (e) => this._keysPressed[e.code] = false);
    }

    _setupPhysics() {
        super._setupPhysics();
    }

    update(delta) {
        super.update(delta);

        const socketPos = this._cameraSocket.getWorldPosition(new THREE.Vector3());
        const socketQuat = this._cameraSocket.getWorldQuaternion(new THREE.Quaternion());

        this._camera.position.copy(socketPos);
        //this._camera.quaternion.copy(socketQuat);
        
        this._controls.update(delta);

        const input = new THREE.Vector3();
        if (this._keysPressed['KeyW']) input.z -= 1;
        if (this._keysPressed['KeyS']) input.z += 1;
        if (this._keysPressed['KeyA']) input.x -= 1;
        if (this._keysPressed['KeyD']) input.x += 1;
        if (this._keysPressed['Space'] && this._playerGrounded()) this.jump();

        if (input.lengthSq() > 0) {
            // Get horizontal facing direction from camera
            const euler = new THREE.Euler().setFromQuaternion(this._controls.object.quaternion, 'YXZ');
            euler.x = 0;
            euler.z = 0;
            input.applyEuler(euler);
            input.normalize();
            input.multiplyScalar(1.5);

            // Apply movement
            const speed = 5;
            this._body._capsuleBody.velocity.x = input.x * speed;
            this._body._capsuleBody.velocity.z = input.z * speed;
        } else {
            this._body._capsuleBody.velocity.x *= 0.8;
            this._body._capsuleBody.velocity.z *= 0.8;
        }

        this._faceCamera();
    }

    _faceCamera() {
        const cameraDirection = new THREE.Vector3();
        this._camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
        this._mesh.quaternion.setFromEuler(new THREE.Euler(0, angle, 0));
    }
    

    jump() {
        this._body._capsuleBody.velocity.y = 5;
    }

    grounded() {
        const rayOrigin = new THREE.Vector3(
            this._playerBody._capsuleBody.position.x, 
            this._playerBody._capsuleBody.position.y + 0.5, 
            this._playerBody._capsuleBody.position.z
        ); // Slight offset upwards to start above the player
        const rayDirection = new THREE.Vector3(0, -1, 0);  // Ray going downward
        
        const raycaster = new THREE.Raycaster(rayOrigin, rayDirection, 0, 2.3); // Range is from 0 to 1 to detect objects just beneath
        const intersects = raycaster.intersectObject(this._terrain);  // _terrain is the terrain object or mesh
        
        return intersects.length > 0;
    }
}