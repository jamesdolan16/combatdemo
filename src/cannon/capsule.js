import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default class Capsule {
    constructor(object, mass = 0.05, position = { x: 0, y: 0, z: 0 }) {
        this._object = object; // The object for which the capsule is being created
        this._mass = mass;
        this._position = position;

        // Calculate dimensions based on the object's bounding box
        const boundingBox = new THREE.Box3().setFromObject(this._object._scene);
        const height = boundingBox.max.y - boundingBox.min.y;
        const radius = Math.max(
            (boundingBox.max.x - boundingBox.min.x) / 2,
            (boundingBox.max.z - boundingBox.min.z) / 2
        );

        this._radius = radius;
        this._height = height;

        this._createBody();
    }

    _createBody() {
        this._capsuleBody = new CANNON.Body({
            mass: this._mass,
            fixedRotation: true,
            //linearDamping: 0.1
        });

        this._capsuleBody.position.set(
            this._position.x,
            this._position.y,
            this._position.z
        );

        // Cylinder for the middle
        const cylHeight = this._height - 2 * this._radius;
        const cylinder = new CANNON.Cylinder(this._radius, this._radius, cylHeight, 8);
        const q = new CANNON.Quaternion();
        //q.setFromEuler(Math.PI / 2, 0, 0); // Rotate to stand upright
        const cylinderTransform = new CANNON.Vec3(0, 0, 0);
        this._capsuleBody.addShape(cylinder, cylinderTransform, q);

        // Spheres for the ends
        const sphereTop = new CANNON.Vec3(0, cylHeight / 2, 0);
        const sphereBottom = new CANNON.Vec3(0, -cylHeight / 2, 0);
        const sphereShape = new CANNON.Sphere(this._radius);
        this._capsuleBody.addShape(sphereShape, sphereTop);
        this._capsuleBody.addShape(sphereShape, sphereBottom);
    }
}