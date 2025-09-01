// Scene setup
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 1.2;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setClearColor(0x000000, 0);
renderer.outputEncoding = THREE.sRGBEncoding;

const marsCanvasContainer = document.getElementById('container') || document.getElementById('mars-canvas');
console.log('Renderer attaching to container:', marsCanvasContainer && marsCanvasContainer.id);
marsCanvasContainer.appendChild(renderer.domElement);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.display = 'block';

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  const minDim = Math.min(w, h);
  camera.position.z = Math.max(3.8, minDim / 300);

  const scale = Math.max(w, h) / 100;
  starSphere.scale.setScalar(scale);
}

const textureLoader = new THREE.TextureLoader();
const starsTexture = textureLoader.load("textures/stars.jpg", undefined, undefined, function(err){
  console.warn('Failed to load stars texture, check path/CORS', err);
});


let mars;
textureLoader.load('textures/mars4.jpg', function(texture) {
  const geometry = new THREE.SphereGeometry(1.2, 128, 128);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  mars = new THREE.Mesh(geometry, material);
  mars.position.y = -1.6;
  const s = Math.min(window.innerWidth, window.innerHeight) / 600;
  const oldScale = Math.max(1.0, s);
  const newScale = oldScale * 0.7;
  const radius = 1.2;
  mars.scale.setScalar(newScale);
  mars.position.y += (oldScale - newScale) * radius;
  scene.add(mars);
}, undefined, function(err) {
  console.error('Failed to load mars texture', err);
});

const pointLight = new THREE.PointLight(0xffffff, 1.5);
pointLight.position.set(5, 3, 5);
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(0x404040, 1.2); 
scene.add(ambientLight);

const starGeometry = new THREE.SphereGeometry(10, 64, 64);
const starMaterial = new THREE.MeshBasicMaterial({
  map: starsTexture,
  side: THREE.BackSide
});
const starSphere = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starSphere);


function animate() {
  requestAnimationFrame(animate);
  if (mars) mars.rotation.y += 0.002;
  starSphere.rotation.y += 0.0005;
  renderer.render(scene, camera);
}

animate();
onWindowResize();

const links = document.querySelectorAll('nav a');

links.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault(); 

    const target = document.querySelector(this.getAttribute('href'));
    target.scrollIntoView({
      behavior: 'smooth', 
      block: 'start'  
    });
  });
});
