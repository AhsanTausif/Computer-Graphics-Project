import * as THREE from 'three';

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Updated to Sky Blue

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let viewMode = 'follow';

// --- LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 50, 10);
sun.castShadow = true;
scene.add(sun);

// --- THE CAR FACTORY ---
function createWheel() {
    const wheelGroup = new THREE.Group();
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.2 });

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32), tireMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.42, 32), metalMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    const spokeGeo = new THREE.BoxGeometry(0.05, 0.7, 0.05);
    for (let i = 0; i < 5; i++) {
        const spoke = new THREE.Mesh(spokeGeo, metalMat);
        spoke.rotation.x = (i * Math.PI * 2) / 5;
        wheelGroup.add(spoke);
    }
    return wheelGroup;
}

const carGroup = new THREE.Group();

// BODY
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, metalness: 0.6, roughness: 0.3 });
const chassis = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 4.2), bodyMat);
chassis.position.y = 0.6;
chassis.castShadow = true;
carGroup.add(chassis);

// CABIN
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });
const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.2), glassMat);
cabin.position.set(0, 1.3, -0.2);
carGroup.add(cabin);

const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 2.2), bodyMat);
roof.position.set(0, 1.7, -0.2);
carGroup.add(roof);

// INTERIOR
const seatMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), seatMat);
seatL.position.set(-0.4, 0.8, -0.1);
const seatR = seatL.clone();
seatR.position.x = 0.4;
carGroup.add(seatL, seatR);

const steering = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 8, 16), seatMat);
steering.position.set(-0.4, 1.2, 0.65);
steering.rotation.x = Math.PI / 2.5;
carGroup.add(steering);

// LIGHTS
const headMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const hL = new THREE.Mesh(new THREE.SphereGeometry(0.2), headMat);
hL.position.set(-0.75, 0.6, 2.1);
const hR = hL.clone(); hR.position.x = 0.75;
carGroup.add(hL, hR);

const tL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), tailMat);
tL.position.set(-0.7, 0.6, -2.1);
const tR = tL.clone(); tR.position.x = 0.7;
carGroup.add(tL, tR);

// WHEELS
const wheels = [];
const wPos = [[-1.1, 0.5, 1.3], [1.1, 0.5, 1.3], [-1.1, 0.5, -1.3], [1.1, 0.5, -1.3]];
wPos.forEach(pos => {
    const w = createWheel();
    w.position.set(...pos);
    carGroup.add(w);
    wheels.push(w);
});

scene.add(carGroup);

// ENVIRONMENT
const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x444444 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
scene.add(new THREE.GridHelper(500, 100, 0x555555, 0x444444));

// --- ANIMATION & INPUT ---
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === '1') viewMode = 'follow';
    if (e.key === '2') viewMode = 'top';
    if (e.key === '3') viewMode = 'side';
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let speed = 0;
let turn = 0;

function animate() {
    requestAnimationFrame(animate);

    if (keys['w']) speed = THREE.MathUtils.lerp(speed, 0.2, 0.05);
    else if (keys['s']) speed = THREE.MathUtils.lerp(speed, -0.15, 0.05);
    else speed = THREE.MathUtils.lerp(speed, 0, 0.03);

    if (keys['a']) turn = 0.03;
    else if (keys['d']) turn = -0.03;
    else turn = 0;

    carGroup.rotateY(turn * (speed * 10));
    carGroup.translateZ(speed);

    wheels.forEach(w => w.rotation.x += speed * 2.5);

    const camOffset = new THREE.Vector3();
    if (viewMode === 'follow') camOffset.set(0, 4, -10);
    else if (viewMode === 'top') camOffset.set(0, 30, 0.1);
    else camOffset.set(12, 2, 0);

    const targetPos = camOffset.applyMatrix4(carGroup.matrixWorld);
    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(carGroup.position);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});