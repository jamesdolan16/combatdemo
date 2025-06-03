import WorldObject from "./worldObject";
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default class Scenery extends WorldObject {
    get type() { return 'Scenery'; }

    _setupPhysics() {
        // Clone the mesh and apply the scale
        const scaledMesh = this._mesh.clone();
        scaledMesh.scale.set(
          this._initialScale.x,
          this._initialScale.y,
          this._initialScale.z
        );
      
        // Add the scaled mesh to the scene
        this.gameScene.add(scaledMesh);
      
        // Add physics to the mesh using enable3d
        this._body = this.gameScene.physics.add.existing(scaledMesh, {
          shape: 'concave',
          mass: 0, // static object
          collisionFlags: 1, // optional, ensures it's static
          autoCenter: false // keeps world position as-is
        });
      
        // Store references if needed
        this._physicsMesh = scaledMesh;
    }
}