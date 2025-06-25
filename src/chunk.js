import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import WorldObject from './objects/worldObject';
import DynamicWorldObject from './objects/DynamicWorldObject';

export default class Chunk {
    _chunkSize = 64;

    constructor(name, game, gameScene) {     
        this.name = name;
        this._game = game;
        this.gameScene = gameScene;
        this._spawns = [];
        this._mixers = [];
    }

    async initialise() {
        this._calculateInitialPosition();
        await this._loadScene();
        this._loadSpawns();

        this.loadedAt = Date.now();
        return this;
    }

    dispose() {
        // Remove physics from terrain
        this.gameScene.physics.destroy(this._terrain);
        
        // Remove any dynamic bodies
        this._scene.traverse(obj => {
          if (obj.body) this.gameScene.physics.destroy(obj);
        });
      
        this.gameScene.scene.remove(this._scene);
    }
      

    update(delta) {
        const timestamp = Date.now();
        this.gameScene.scene.traverse(object => {
            if (object.userData.worldObject instanceof DynamicWorldObject) {
                object.userData.worldObject.update(delta, timestamp);
            }

            if (object instanceof THREE.SpotLightHelper) {
                object.update();
            }
        });
    }

    _calculateInitialPosition() {
        const posX = 0;
        const posZ = 0;
        this._initialPosition = new THREE.Vector3(
            posX * this._chunkSize, 
            0, 
            posZ * this._chunkSize
        );
    }

    async _loadScene() {
        this._scene = await this._game.GLTFCache.fetchClonedScene(this.name, this);
        this._scene.traverse(child => {
            if (child.isMesh) child.material.side = THREE.DoubleSide;
            else if (child.isObject3D && child.name.startsWith("s_")) this._spawns.push(child);
        })

        this._terrain = this._scene.getObjectByName("floor");

        this.gameScene.scene.add(this._terrain);
        this.gameScene.physics.add.existing(this._terrain, {
            shape: 'concave', 
            mass: 0 
        });
    }

    _loadSpawns() {
        this._spawns.forEach(objectScene => {
            this._game.worldObjectFactory.newFromSpawnPoint(this, objectScene);
        });
    }
    
    
}