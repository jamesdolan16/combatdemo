import Character from './character.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PointerLockControls } from "three/examples/jsm/Addons.js";

export default class Player extends Character {

    constructor(chunk, objectScene) {
        super(chunk, objectScene);

        this._camera = null; // Will be set up in initialise
    }

    get type() { return 'Player'; }

    async initialise() {
        await super.initialise();
        this._setupCamera();
        this._setupControls();
        
        this._readyLevel = 'Player';
    }

    update(delta, timestamp) {
        if (this._readyLevel !== this.type || this._lastUpdated === timestamp) return;
        super.update(delta, timestamp);

        const socket = this._sockets.get("firstPersonCameraSocket");
        const socketPos = socket.getWorldPosition(new THREE.Vector3());

        this.isGrounded = this.grounded();

        this._camera.position.copy(socketPos);

        this._controls.update(delta);

        const input = new THREE.Vector3();
        if (this._keysPressed['KeyW']) input.z -= 1;
        if (this._keysPressed['KeyS']) input.z += 1;
        if (this._keysPressed['KeyA']) input.x -= 1;
        if (this._keysPressed['KeyD']) input.x += 1;
        if (this._keysPressed['Space'] && this.isGrounded ) this.jump();

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
            this._body.velocity.x = input.x * speed;
            this._body.velocity.z = input.z * speed;
        } else {
            if (this.isGrounded) {
                this._body.velocity.x = 0;
                this._body.velocity.z = 0;
            } else {
                this._body.velocity.x *= 0.8;
                this._body.velocity.z *= 0.8;
            }
        }

        this._faceCamera();
    }
    
    
    _faceCamera() {
        const cameraDirection = new THREE.Vector3();
        this._camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
        this._scene.quaternion.setFromEuler(new THREE.Euler(0, angle, 0));
    }

    _setupCamera() {
        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this._camera.userData.worldObject = this;
        this._chunk._scene.add(this._camera);

        /* this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const socket = this._sockets.get("firstPersonCameraSocket");
        socket.add(this._camera); 
        this._camera.userData.worldObject = this; */
    }

    _setupControls() {
        this._controls = new PointerLockControls(this._camera, this._game._container);

        document.addEventListener('click', () => {
            this._controls.lock();
        });
          
        document.addEventListener('keypress', (event) => {
            if (event.code === 'KeyEscape') {
                this._controls.unlock();
            }
        });

        this._keysPressed = {};

        document.addEventListener('keydown', (e) => this._keysPressed[e.code] = true);
        document.addEventListener('keyup', (e) => this._keysPressed[e.code] = false);
    }
}