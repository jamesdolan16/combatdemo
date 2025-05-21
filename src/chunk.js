export default class Chunk {
    chunkSize = 64;

    constructor(name, GLTFCache, world) {     
        this.name = name;
        this._initialPosition = position;
        this._GLTFCache = GLTFCache;
        this._world = world;
    }

    async initialise() {
        this._calculateInitialPosition();
        await this._loadScene();
        await this._loadSpawns();
        this._setupPhysics();

        this.loadedAt = Date.now();
        return this;
    }

    _calculateInitialPosition() {
        const [_, posX, posZ] = chunkName.match(/^chunk_(\d+?)_(\d+?)$/);
        this._initialPosition = new THREE.Vector3(
            posX * chunkSize, 
            0, 
            posZ * chunkSize
        );
    }

    async _loadScene() {
        this._scene = await this._GLTFCache.fetchClonedScene(this.name);
        this._scene.traverse(child => {
            if (child.isMesh) child.material.side = THREE.DoubleSide;
            else if (child.isObject3D && child.name.startsWith("s_")) this._spawns.push(child);
        });
        this._terrain = this._scene.getObjectByName("floor");
    }

    async _loadSpawns() {
        await Promise.all(this._spawns.map(async objectData => {
            object = await this._worldObjectFactory.newFromSpawnPoint(objectData);
            this._mixers.push(object._mixer);
            this._scene.add(object._mesh); 
            this._world.addBody(object._body._capsuleBody);
            this._world.addContactMaterial(object._contactMaterial);
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
        this._world.addBody(floorBody);
    }
}