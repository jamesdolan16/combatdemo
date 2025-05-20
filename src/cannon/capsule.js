import * as CANNON from 'cannon-es';

export default class Capsule {
    constructor(radius = 0.5, height = 1.8, mass = 0.05, position = { x: 0, y: 0, z: 0 }) {
        this._radius = radius;
        this._height = height;
        this._mass = mass;
        this._position = position;
        this._createBody();
    }

    _createBody() {
        this._capsuleBody = new CANNON.Body({ 
            mass: this._mass, 
            fixedRotation: true
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
        q.setFromEuler(Math.PI / 2, 0, 0); // rotate to stand upright
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