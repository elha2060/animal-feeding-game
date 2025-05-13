// Wait for the DOM to be fully loaded before running game logic
window.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const startScreenWrapper = document.getElementById('startScreenWrapper'); // MODIFIED
    const gameArea = document.getElementById('gameArea');
    const startGameButton = document.getElementById('startGameButton'); // Still inside startScreen, so this is fine
    const renderCanvas = document.getElementById('renderCanvas');

    // Babylon.js Essentials
    let engine;
    let scene;
    let currentAnimalAsset; // To store the loaded animal asset container
    // More game state variables will be declared here later

    // Asset paths (centralize for easier management)
    const ASSET_PATHS = {
        monkey: "assets/models/monkey/monkey.glb", // Ensure this path is correct
        banana: "assets/models/banana/banana.glb"  // Ensure this path is correct
        // Add other animals and foods here later
    };

    // --- INITIALIZATION ---
    function initializeGame() {
        startScreenWrapper.style.display = 'none'; // MODIFIED
        gameArea.style.display = 'flex'; // Use 'flex' as per CSS for gameArea layout

        engine = new BABYLON.Engine(renderCanvas, true, { stencil: true, preserveDrawingBuffer: true }, true);
        scene = createScene();

        engine.runRenderLoop(() => {
            if (scene) {
                scene.render();
            }
        });

        window.addEventListener('resize', () => {
            engine.resize();
        });

        loadFirstAnimal(); 
    }

    function createScene() {
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, new BABYLON.Vector3(0, 1, 0), scene);
        camera.attachControl(renderCanvas, true);
        // Code-Critic: Reminder to adjust camera controls for final game.
        // Lower camera radius for a closer view of the animal
        camera.radius = 5; 
        // Adjust target to be slightly higher if animals are taller
        camera.target = new BABYLON.Vector3(0, 1.5, 0); // Adjusted for potentially taller model
        // Limit beta (vertical angle) to prevent camera from going below ground or too high
        camera.lowerBetaLimit = Math.PI / 4; // Prevents looking too far down
        camera.upperBetaLimit = Math.PI / 2; // Prevents looking straight down from top

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1.0; // Slightly increased intensity

        // Add a ground plane
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
        // Optional: Give the ground a simple material
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.85, 0.7); // A soft green
        ground.material = groundMaterial;
        ground.position.y = 0; // Ensure ground is at Y=0

        scene.clearColor = new BABYLON.Color4(0.9, 0.95, 1, 1);
        return scene;
    }

    // --- MODEL LOADING ---
    async function loadModel(modelPath, modelName, targetScene) {
        // Code-Critic: Consider adding more robust error handling here.
        try {
            // ImportMeshAsync returns an object with meshes, particleSystems, skeletons, animationGroups
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                null, // meshNames: null to load all meshes
                modelPath.substring(0, modelPath.lastIndexOf('/') + 1), // rootUrl: directory of the model
                modelPath.substring(modelPath.lastIndexOf('/') + 1),    // sceneFilename: name of the .glb file
                targetScene
            );

            // The first mesh (result.meshes[0]) is often the root node or main mesh of the imported model.
            // It might not be the visible mesh itself but a parent transform.
            const rootMesh = result.meshes[0];
            rootMesh.name = modelName; // Assign a name for easier access later

            console.log(`${modelName} loaded successfully. Meshes:`, result.meshes.length, "Animations:", result.animationGroups.length);
            
            // Store animation groups if any
            if (result.animationGroups && result.animationGroups.length > 0) {
                // Make sure animations are not playing by default unless intended
                result.animationGroups.forEach(ag => ag.stop());
            }
            
            return { rootMesh, animationGroups: result.animationGroups, meshes: result.meshes };

        } catch (error) {
            console.error(`Error loading model ${modelName} from ${modelPath}:`, error);
            // Code-Critic: Potentially show a user-friendly error message on screen.
            return null;
        }
    }

    async function loadFirstAnimal() {
        console.log("Loading first animal (Monkey)...");
        currentAnimalAsset = await loadModel(ASSET_PATHS.monkey, "monkey", scene);

        if (currentAnimalAsset && currentAnimalAsset.rootMesh) {
            // Position and scale the monkey as needed
            currentAnimalAsset.rootMesh.position = new BABYLON.Vector3(0, 0, 0); // Position at ground level
            // Code-Critic: Scaling might be necessary depending on the original model size.
            // currentAnimalAsset.rootMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5); // Example scaling

            // TODO: Play idle animation if available
            playAnimation(currentAnimalAsset, "idle"); // Assuming an "idle" animation exists
            console.log("Monkey loaded and positioned.");
        } else {
            console.error("Failed to load monkey model or rootMesh is undefined.");
        }

        // TODO: Load banana model (initially hidden or placed appropriately)
        // const bananaAsset = await loadModel(ASSET_PATHS.banana, "banana", scene);
        // if (bananaAsset && bananaAsset.rootMesh) {
        //     bananaAsset.rootMesh.position = new BABYLON.Vector3(2, 0.5, 0); // Example position
        //     bananaAsset.rootMesh.isVisible = false; // Hide it initially
        // }
    }
    
    // --- ANIMATION HANDLING ---
    function playAnimation(asset, animationName, loop = true) {
        if (!asset || !asset.animationGroups || asset.animationGroups.length === 0) {
            console.warn(`No animation groups found for asset ${asset?.rootMesh?.name}`);
            return;
        }

        // Try to find animation by name (case-insensitive partial match)
        const animGroup = asset.animationGroups.find(ag => ag.name.toLowerCase().includes(animationName.toLowerCase()));

        if (animGroup) {
            console.log(`Playing animation "${animGroup.name}" for ${asset.rootMesh.name}`);
            animGroup.start(loop, 1.0, animGroup.from, animGroup.to, false);
        } else {
            console.warn(`Animation "${animationName}" not found for ${asset.rootMesh.name}. Available animations:`, asset.animationGroups.map(ag => ag.name));
            // Code-Critic: As a fallback, if specific "idle" isn't found, maybe play the first animation?
            // Or, list available animations to help developer identify the correct name.
            if(asset.animationGroups.length > 0 && animationName === "idle") {
                console.log(`Attempting to play first available animation as idle: ${asset.animationGroups[0].name}`);
                asset.animationGroups[0].start(loop, 1.0, asset.animationGroups[0].from, asset.animationGroups[0].to, false);
            }
        }
    }


    // --- EVENT LISTENERS ---
    startGameButton.addEventListener('click', initializeGame);

}); // End of DOMContentLoaded
