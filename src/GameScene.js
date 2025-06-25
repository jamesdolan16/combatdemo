import { Scene3D } from "enable3d";
import Chunk from "./chunk.js";
import { SharedContext } from "./SharedContext.js";

export default class GameScene extends Scene3D {
    constructor() {
        super('GameScene');
        this.userData = {};
    }

    async init() {
        this.renderer.setPixelRatio(1)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    async preload() {
        this.userData.game = SharedContext.game;
        // Load assets
    }

    async create() {
        this.warpSpeed('camera', 'light', 'sky');
        this.physics.debug.enable();

        this.clock.start();

        this.userData.activeChunk = new Chunk('chunktest', this.userData.game, this);
        await this.userData.activeChunk.initialise();

        this.userData.game.eventEmitter.on('pauseGameScene', () => {
            this.isPaused = true;
        });

        this.userData.game.eventEmitter.on('resumeGameScene', () => {
            this.isPaused = false;
        });
    }

    update() {
        if (this.isPaused) return;

        const delta = this.clock.getDelta();
        this.userData.activeChunk.update(delta);
    } 
}