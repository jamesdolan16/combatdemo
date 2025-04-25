import * as THREE from 'three';
import WorldObject from './worldObject.js';

export default class EnemyObject extends WorldObject {
    async _generateMesh() {
        let gltf = await this._loader.loadAsync('public/longsword.glb', (e) => {
            console.log((e.loaded / e.total * 100) + '% loaded');
        });

        this._mesh = gltf.scene;

        //this._geometry = new THREE.BoxGeometry(1, 2, 1);
        //this._material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        //this._mesh = new THREE.Mesh(this._geometry, this._material);
        this._mesh.castShadow = true;
        this._mesh.userData.parent = this;
        this._mesh.position.set(this._initialPosition.x, this._initialPosition.y, this._initialPosition.z);
        this._mesh.rotation.set(this._initialRotation.x, this._initialRotation.y, this._initialRotation.z);
        this._mesh.scale.set(0.2, 0.2, 0.2);
    }

    update() {
        this._updateCallback();
    }
}