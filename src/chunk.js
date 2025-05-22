import * as THREE from 'three';
import * as CANNON from 'cannon-es';


export default class Chunk {
    _chunkSize = 64;

    constructor(name, game) {     
        this.name = name;
        this._game = game;
        this._spawns = [];
    }

    async initialise() {
        this._calculateInitialPosition();
        await this._loadScene();
        this._setupPhysics();
        await this._loadSpawns();

        this.loadedAt = Date.now();
        return this;
    }

    _calculateInitialPosition() {
        //const [_, posX, posZ] = this.name.match(/^chunk_(\d+?)_(\d+?)$/);  // <dev> Turn this on when we have real chunking
        const posX = 0;
        const posZ = 0;
        this._initialPosition = new THREE.Vector3(
            posX * this._chunkSize, 
            0, 
            posZ * this._chunkSize
        );
    }

    async _loadScene() {
        this._scene = await this._game._GLTFCache.fetchClonedScene(this.name, this);
        this._scene.traverse(child => {
            if (child.isMesh) child.material.side = THREE.DoubleSide;
            else if (child.isObject3D && child.name.startsWith("s_")) this._spawns.push(child);
        });
        this._terrain = this._scene.getObjectByName("floor");
    }

    async _loadSpawns() {
        await Promise.all(this._spawns.map(async (objectScene) => {
            const object = await this._game._worldObjectFactory.newFromSpawnPoint(this, objectScene);
            this._mixers.push(object._mixer);
            this._scene.add(object._mesh); 
            this._game._world.addBody(object._body._capsuleBody);
            this._game._world.addContactMaterial(object._contactMaterial);
        }));
    }

    _setupPhysics() {
        const floorShape = new CANNON.Trimesh(
            this._terrain.geometry.attributes.position.array,
            this._terrain.geometry.index.array
        );
        const floorBody = new CANNON.Body({
            mass: 0,
            shape: floorShape,
            material: new CANNON.Material('terrain')
        });
        this._terrainBody = floorBody;
        this._game._world.addBody(floorBody);
    }
}