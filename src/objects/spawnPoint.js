import DynamicWorldObject from "./DynamicWorldObject";
import WorldObject from "./worldObject";

/**  
 * SpawnPoint is a special type of WorldObject that does not have physics or a mesh
*/
export default class SpawnPoint extends DynamicWorldObject {
    async spawnPlayer() {
        const object = await this._game._worldObjectFactory.newPlayer(this._chunk, {
            name: "spawned-character",
            position: this._initialPosition,
            rotation: this._initialRotation,
            userData: {
                baseName: "male-default",
            },
        });

        this._chunk.addObject(object);
        this._game.activePlayer = object;
    }
    
    _loadScene() {}
}