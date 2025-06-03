import { Scene3D } from "enable3d";
import Chunk from "./chunk.js";

export default class GameScene extends Scene3D {
    constructor(game, config = {}) {
        super("Main Scene");
        this.game = game;
    }

    async init() {
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    async preload() {
        // Load shit
    }

    async create() {
        this.warpSpeed();
        this.physics.debug.enable();

        this.activeChunk = new Chunk('chunktest', this.game, this);
        await this.activeChunk.initialise();
        debugger;
        this.scene.add(this.activeChunk._scene);
        this.add.mesh(this.activeChunk._scene, { 
            physics: { shape: 'concave', mass: 0 } 
        });
    }

    update() {
        const delta = this.game.loop.delta;
        this.activeChunk.update(delta);
    }


}