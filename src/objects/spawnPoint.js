import DynamicWorldObject from "./DynamicWorldObject";
import WorldObject from "./worldObject";

/**  
 * SpawnPoint is a special type of WorldObject that does not have physics or a mesh
*/
export default class SpawnPoint extends DynamicWorldObject {
    spawnPlayer() {
        this._game.worldObjectFactory.newPlayer(this._chunk, {
            position: this._initialPosition,
            quaternion: this._initialRotation,
            scale: this._initialScale,
            userData: {
                name: "spawned-character",
                baseName: "male-default",
            },
        });
    }
    
    _loadScene() {}
}