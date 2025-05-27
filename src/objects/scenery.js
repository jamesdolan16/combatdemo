import WorldObject from "./worldObject";
import * as CANNON from 'cannon-es';

export default class Scenery extends WorldObject {
    _setupPhysics() {
        this._cannonMesh = new CANNON.Trimesh(
            this._mesh.geometry.attributes.position.array,
            this._mesh.geometry.index.array
        );
        this._body = new CANNON.Body({
            mass: 0, // Static object
            shape: this._cannonMesh,
            material: new CANNON.Material(this._name)
        });
    }
}