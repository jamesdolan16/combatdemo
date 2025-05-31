import WorldObject from "./worldObject";
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default class Scenery extends WorldObject {
    get type() { return 'Scenery'; }

    _setupPhysics() {
        const geometry = this._mesh.geometry.clone();
        geometry.scale(
            this._initialScale.x,
            this._initialScale.y,
            this._initialScale.z
        );
    
        const vertices = Array.from(geometry.attributes.position.array);
        const indices = Array.from(geometry.index.array);
    
        this._cannonMesh = new CANNON.Trimesh(vertices, indices);
    
        this._body = new CANNON.Body({
            mass: 0, // Static object
            shape: this._cannonMesh,
            material: new CANNON.Material(this._name)
        });
    
        this._body.position.copy(this._game.threeToCannonVec3(this._mesh.getWorldPosition(new THREE.Vector3())));
        this._body.quaternion.copy(this._game.threeToCannonQuaternion(this._mesh.getWorldQuaternion(new THREE.Quaternion())));

        this._game._world.addBody(this._body);
    }
}