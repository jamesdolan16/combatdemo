import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export const WALKSPEED = 4;
export const JUMPVELOCITY = 5;
export const VIEWDISTANCE = 32;
export const STUCKTHRESHOLD = 0.9;

export function debugRaycaster(raycaster, scene, length, color) {
    const origin = raycaster.ray.origin.clone();
    const direction = raycaster.ray.direction.clone().normalize().multiplyScalar(length);
    const points = [origin, origin.clone().add(direction)];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    setTimeout(() => scene.remove(line), 1000);
}

/**
 * Works like setInterval but uses requestAnimationFrame under the hood.
 * @param {Function} callback - The function to call each interval.
 * @param {number} interval - Interval time in milliseconds. 17ms is roughly 60 FPS, 
 *  which is the default for requestAnimationFrame. so anything less will be inaccurate
 * @returns {Function} A function you can call to cancel the interval.
 */
export function rafInterval(callback, interval) {
    let start = performance.now();
    let rafId = null;

    function loop(now) {
        if (now - start >= interval) {
            callback();
            start = now;
        }
        rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return rafId;
}

