import WorldObject from "./worldObject";
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default class Scenery extends WorldObject {
    get type() { return 'Scenery'; }

    _setupPhysics() {
        this.gameScene.physics.add.existing(this._mesh, {
          shape: 'concave',
          mass: 0, // static object
          collisionFlags: 1, // optional, ensures it's static
          autoCenter: false // keeps world position as-is
        });
    }
}