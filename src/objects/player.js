import Character from './character.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PointerLockControls } from "three/examples/jsm/Addons.js";
import Skill from '../skill.js';
import Item from '../item.js';

export default class Player extends Character {

    constructor(chunk, objectScene) {
        super(chunk, objectScene);

        this._camera = null; // Will be set up in initialise
        //this._mass = 1;

        this.skills = {
            smithing: new Skill('smithing', this._game.eventEmitter, { xp: 0 })
        }

        this.inventory = [
            new Item('bronze-ingot', {
                label: 'Bronze Ingot',
                stackLimit: 64,
                quantity: 64,
                icon: 'bronze-ingot.png',
                //container: game.activePlayer.inventory
            }),
            new Item('wood', {
                label: 'Wood',
                stackLimit: 64,
                quantity: 64,
                icon: 'wood.png',
                //container: game.activePlayer.inventory
            }),
            new Item('iron-ingot', {
                label: 'Iron Ingot',
                stackLimit: 64,
                quantity: 64,
                icon: 'iron-ingot.png',
                //container: game.activePlayer.inventory
            }),
            new Item('garlith-ingot', {
                label: 'Garlith Ingot',
                stackLimit: 64,
                quantity: 64,
                icon: 'garlith-ingot.png',
            }),
            new Item('damascus-ingot', {
                label: 'Damascus Ingot',
                stackLimit: 64,
                quantity: 64,
                icon: 'damascus-ingot.png',
            }),
            new Item('kyran-ingot', {
                label: 'Kyran Ingot',
                stackLimit: 64,
                quantity: 64,
                icon: 'kyran-ingot.png',
            }),
            new Item('tranid-ingot', {
                label: 'Tranid Ingot',
                stackLimit: 64,
                quantity: 64,
                icon: 'tranid-ingot.png',
            }),
        ];
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
    
        this._controls.update(delta);
        const input = new THREE.Vector3();

        this._updateCamera();
    
        if (this._keysPressed['KeyW']) input.z -= 1;
        if (this._keysPressed['KeyS']) input.z += 1;
        if (this._keysPressed['KeyA']) input.x -= 1;
        if (this._keysPressed['KeyD']) input.x += 1;
    
        this.isGrounded = this.grounded(); // replace with your grounded logic
    
        if (this._keysPressed['Space'] && this.isGrounded) this.jump();
    
        const speed = 7;
        let velocity = this._scene.body.velocity; // Enable3D method to get velocity
    
        if (input.lengthSq() > 0) {
            // Rotate input vector relative to camera yaw
            const worldQuat = this._camera.getWorldQuaternion(new THREE.Quaternion());
            const euler = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ');
            euler.x = 0;
            euler.z = 0;
            input.applyEuler(euler).normalize().multiplyScalar(speed);
    
            // Set horizontal velocity (keep Y velocity)
            this._scene.body.setVelocity(input.x, velocity.y, input.z);
        } else {
            if (this.isGrounded) {
                this._scene.body.setVelocity(0, velocity.y, 0);
            } else {
                // Apply damping
                this._scene.body.setVelocity(velocity.x * 0.8, velocity.y, velocity.z * 0.8);
            }
        }
    
        this._faceCamera();
    }

    _updateCamera() {
        const socketWorldPos = this._cameraSocket.getWorldPosition(new THREE.Vector3());
        this._camera.position.copy(socketWorldPos);
    }
    
    _faceCamera() {
        // Get the camera's forward direction in world space
        const cameraDir = new THREE.Vector3();
        this._camera.getWorldDirection(cameraDir);
        cameraDir.y = 0; // Flatten to XZ plane
        cameraDir.normalize();
    
        // Calculate the yaw angle from the direction vector
        const angle = Math.atan2(cameraDir.x, cameraDir.z);
    
        // Create a quaternion from this yaw angle
        const worldQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), // Y-axis
            angle
        );
    
        // Convert to local space
        const parentQuat = new THREE.Quaternion();
        this._mesh.parent.getWorldQuaternion(parentQuat);
        parentQuat.invert();
        worldQuat.premultiply(parentQuat);
    
        // Apply to mesh
        this._mesh.quaternion.copy(worldQuat);
    }
    
    

    _setupCamera() {
        this._camera = this._chunk.gameScene.camera;
        this._cameraSocket = this._sockets.get("firstPersonCameraSocket");

        this._camera.quaternion.copy(this._cameraSocket.getWorldQuaternion(new THREE.Quaternion()));
        this._camera.rotateY(Math.PI);
        
        this._updateCamera();
    }

    _setupControls() {
        this._controls = new PointerLockControls(this._camera, this._game.container);
        this._controls.minPolarAngle = 0.1; // Limit vertical rotation to look down
        this._controls.maxPolarAngle = Math.PI - 0.01; // Limit vertical rotation to look up and down

        document.addEventListener('click', () => {
            // Check if any .ui-panel is visible (i.e., not hidden via CSS)
            const panels = document.querySelectorAll('.ui-panel');
            const anyVisible = Array.from(panels).some(panel => {
                return panel.offsetParent !== null;
            });
        
            if (!anyVisible) {
                this._controls.lock();
            }
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