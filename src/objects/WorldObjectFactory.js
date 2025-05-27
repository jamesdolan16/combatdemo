import { Object3D } from "three";
import WorldObject from "./worldObject";
import SpawnPoint from "./spawnPoint";
import Scenery from "./scenery";
import Character from "./character";
import Interactable from "./interactable";
import Prop from "./prop";
import Player from "./player";

export default class WorldObjectFactory {
    classMap = {
        SpawnPoints: SpawnPoint,
        Scenery: Scenery,
        Characters: Character,
        Interactables: Interactable,
        Props: Prop
    };

    constructor(game) {
        this._game = game;
    }

    /**
     * Create new WorldObject from a blender exported spawn point
     * 
     * @param {Object3D} objectScene 
     * @returns {WorldObject}
     */
    async newFromSpawnPoint(chunk, objectScene) {
        const classConstructor = this.classMap[objectScene.userData.category];
        const object = new classConstructor(chunk, objectScene);
        await object.initialise();

        return object;
    }

    async newPlayer(chunk, objectScene) {
        const player = new Player(chunk, objectScene);
        await player.initialise();
        return player;
    }  

}