import { SkeletonUtils } from "three/examples/jsm/Addons.js";
import WorldObject from "./objects/worldObject";
import { Scene } from "three";
import * as THREE from "three";

export default class GLTFCache {
    constructor(loader, options = {}) {
        const {
            maxSize = 50
        } = options;

        this._maxSize = maxSize;
        this._loader = loader;

        this._cache = new Map();
    }

    /**
     * Tries to fetch the requested gltf from the cache, if it's not found load it, cache it and return that
     * 
     * @param {string} name The identifier of the required glb e.g. for `/falx1h.glb` it would be `falx1h`
     * @returns {GLTF}
     */
    async fetch(name) {
        let cached = this._cache.get(name);
        if (cached) return cached;

        const path = `/${name}.glb`;
        
        try { 
            const loaded = await this._loader.loadAsync(path, (e) => {
                //console.log((e.loaded / e.total * 100) + '% loaded');
            });
            if (loaded.animations.length > 0) this._trimAnimations(loaded);

            this._add(name, loaded);
            return loaded;
        } catch (e) {
            console.error(`Failed to load requested resource: ${name}.glb`);
        }
    }

    /**
     * Fetches the requested gltf and returns a clone of the object scene
     * 
     * @param {string} name 
     * @param {WorldObject} parent 
     * @returns {Scene|null}
     */
    async fetchClonedScene(name, parentObject) {
        const gltf = await this.fetch(name);
        if (gltf) {
            const clone = SkeletonUtils.clone(gltf.scene);
            clone.traverse((child) => {
                child.userData.worldObject = parentObject;
                if (child.isMesh) {
                    child.material.side = THREE.DoubleSide; // Ensure all meshes are double-sided
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            return clone;
        }
        return null;
    }
    
    /**
     * Removes animations that dont do anything
     * 
     * @param {*} gltf 
     */
    _trimAnimations(gltf) {
        gltf.animations.forEach(anim => {
            for(let idx = anim.tracks.length-1 ; idx>=0 ; idx--) {
                let track = anim.tracks[idx];
    
                let numElements = track.values.length / track.times.length;
    
                let delta = 0;
                for(let i=0 ; i<numElements ; i++) {
                    let valList = track.values.filter((value, index) => (index % numElements) === i);
                    let min = valList.reduce((a,b) => Math.min(a,b), valList[0]);
                    let max = valList.reduce((a,b) => Math.max(a,b), valList[0]);
                    // Sum up all absolute changes in this track
                    delta += Math.abs(max-min);
                }
    
                if(delta === 0) {
                    // This track has no animation on it - remove it
                    anim.tracks.splice(idx, 1);
                }
            }
        });
    }

    _add(name, model) {
        if (this._cache.size >= this._maxSize) this._evict();
        this._cache.set(name, { model, count: 1 });
    }

    _evict() {
        let leastKey = null;
        let leastCount = Infinity;

        for (const [key, value] of this._cache) {
            if (value.count < leastCount) {
                leastCount = value.count;
                leastKey = key;
            }
        }

        if (leastKey !== null) this._cache.delete(leastKey);
    }

    /**
     * Newline seperated string of all cached GLTFs
     * 
     * @returns {string}
     */
    list() {
        return Array.from(this._cache.keys).join("\n");
    }
}