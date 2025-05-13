// Wait for the DOM to be fully loaded before running game logic
window.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const startScreenWrapper = document.getElementById('startScreenWrapper');
    const gameArea = document.getElementById('gameArea');
    const startGameButton = document.getElementById('startGameButton');
    const renderCanvas = document.getElementById('renderCanvas');
    const foodChoicesBar = document.getElementById('foodChoicesBar');
    const nextAnimalButton = document.getElementById('nextAnimalButton'); // Get the button
    // const animalQueueBar = document.getElementById('animalQueueBar'); // Will use later


    // Babylon.js Essentials
    let engine;
    let scene;
    
    // Game State / Assets
    let currentAnimalData; 
    let currentFoodAssets = {}; 
    let allGameAnimals = []; 
    let currentAnimalIndex = 0; 
    let isAcceptingInput = true; // To prevent multiple clicks during animations

    // Asset paths (ensure these are correct for your local setup)
    const ASSET_PATHS = {
        monkey: "assets/models/monkey/monkey.glb",
        cat: "assets/models/cat/cat.glb",
        mouse: "assets/models/mouse/mouse.glb",
        dog: "assets/models/dog/dog.glb", // You mentioned a dog model
        whale: "assets/models/whale/whale.glb",
        banana: "assets/models/banana/banana.glb",
        milk: "assets/models/milk/milk.glb",
        fish: "assets/models/fish/fish.glb",
        pizza: "assets/models/pizza/pizza.glb",
        hay: "assets/models/hay/hay.glb",
        croissant: "assets/models/croissant/croissant.glb",
        truck: "assets/models/truck/truck.glb",
        flower: "assets/models/flower/flower.glb",
        bone: "assets/models/bone/bone.glb",
        cheese: "assets/models/cheese/cheese.glb"
    };

    // --- GAME DATA DEFINITION ---
    // IMPORTANT: Update animation names (idleAnim, eatAnim etc.) for EACH animal 
    // based on the actual animation names in their GLB files.
    // Add scale and rotationY for per-animal adjustments.
    const GAME_DATA = {
        animals: [
            { 
                name: "Monkey", modelPath: ASSET_PATHS.monkey, correctFood: "Banana",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE NAMES
                scale: { x: 1, y: 1, z: 1 }, rotationY: 0 // Default, adjust per animal
            },
            { 
                name: "Dog", modelPath: ASSET_PATHS.dog, correctFood: "Bone",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE NAMES
                scale: { x: 1, y: 1, z: 1 }, rotationY: Math.PI // Example: Dog facing backwards initially, rotate 180 deg (PI radians)
            },
            { 
                name: "Cat", modelPath: ASSET_PATHS.cat, correctFood: "Milk",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE NAMES
                scale: { x: 1, y: 1, z: 1 }, rotationY: 0 
            },
            { 
                name: "Whale", modelPath: ASSET_PATHS.whale, correctFood: "Fish",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE NAMES
                scale: { x: 2, y: 2, z: 2 }, rotationY: 0 // Example: Whale might be bigger
            },
            { 
                name: "Mouse", modelPath: ASSET_PATHS.mouse, correctFood: "Cheese",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE NAMES
                scale: { x: 0.5, y: 0.5, z: 0.5 }, rotationY: 0 // Example: Mouse might be smaller
            },
        ],
        foods: [ 
            { name: "Banana", modelPath: ASSET_PATHS.banana, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, // Added scale for food too
            { name: "Milk", modelPath: ASSET_PATHS.milk, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Fish", modelPath: ASSET_PATHS.fish, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Bone", modelPath: ASSET_PATHS.bone, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Cheese", modelPath: ASSET_PATHS.cheese, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Pizza", modelPath: ASSET_PATHS.pizza, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Hay", modelPath: ASSET_PATHS.hay, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Croissant", modelPath: ASSET_PATHS.croissant, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Truck", modelPath: ASSET_PATHS.truck, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
            { name: "Flower", modelPath: ASSET_PATHS.flower, asset: null, scale: {x:0.5,y:0.5,z:0.5} }, 
        ]
    };

    // --- INITIALIZATION ---
    function initializeGame() {
        startScreenWrapper.style.display = 'none';
        gameArea.style.display = 'flex';
        nextAnimalButton.style.display = 'none'; // Ensure it's hidden at start
        isAcceptingInput = true;

        engine = new BABYLON.Engine(renderCanvas, true, { stencil: true, preserveDrawingBuffer: true }, true);
        scene = createScene();

        engine.runRenderLoop(() => {
            if (scene) scene.render();
        });
        window.addEventListener('resize', () => engine.resize());

        allGameAnimals = GAME_DATA.animals; 
        currentAnimalIndex = 0;
        
        // Preload all food models that have a path
        preloadFoodModels();

        loadAndDisplayCurrentAnimal(); 
    }

    function createScene() {
        // ... (createScene remains largely the same, camera adjustments already made)
        // You might want to adjust camera.radius or target if animals are very different sizes
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.8, 5, new BABYLON.Vector3(0, 1.2, 0), scene);
        // camera.attachControl(renderCanvas, true); // For Dev
        camera.lowerRadiusLimit = 2; camera.upperRadiusLimit = 15;
        camera.lowerBetaLimit = Math.PI / 6; camera.upperBetaLimit = Math.PI / 1.9;

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.5, 1, 0.25), scene);
        light.intensity = 1.2;
        // Optional: Add a directional light for shadows
        // const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0.5, -1, 0.5), scene);
        // dirLight.intensity = 0.5;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.75, 0.6);
        ground.material = groundMaterial;
        ground.position.y = 0;

        scene.clearColor = new BABYLON.Color4(0.85, 0.93, 1, 1);
        return scene;
    }

    // --- MODEL LOADING ---
    async function preloadFoodModels() {
        console.log("Preloading food models...");
        for (const foodData of GAME_DATA.foods) {
            if (foodData.modelPath && !currentFoodAssets[foodData.name]) {
                const loadedAsset = await loadModel(foodData.modelPath, `${foodData.name}_model`, scene);
                if (loadedAsset && loadedAsset.rootMesh) {
                    currentFoodAssets[foodData.name] = loadedAsset;
                    loadedAsset.rootMesh.isVisible = false; // Hide all preloaded foods initially
                    if (foodData.scale) { // Apply scale if defined in GAME_DATA
                        loadedAsset.rootMesh.scaling = new BABYLON.Vector3(foodData.scale.x, foodData.scale.y, foodData.scale.z);
                    }
                    console.log(`${foodData.name} preloaded.`);
                }
            }
        }
        console.log("Food preloading complete.");
    }

    async function loadModel(modelPath, modelName, targetScene) {
        // ... (loadModel function remains the same)
        if (!modelPath) { /* ... */ }
        try { /* ... */ 
            const result = await BABYLON.SceneLoader.ImportMeshAsync(null, modelPath.substring(0, modelPath.lastIndexOf('/') + 1), modelPath.substring(modelPath.lastIndexOf('/') + 1), targetScene);
            const rootMesh = result.meshes[0];
            rootMesh.name = modelName; // Important for later cleanup
            console.log(`${modelName} loaded. Animations: ${result.animationGroups.length}`);
            result.animationGroups.forEach(ag => ag.stop());
            return { rootMesh, animationGroups: result.animationGroups, meshes: result.meshes };
        } catch (error) { console.error(/* ... */); return null; }
    }

    // --- GAME FLOW & UI ---
    async function loadAndDisplayCurrentAnimal() {
        isAcceptingInput = false; // Disable input during transition
        nextAnimalButton.style.display = 'none'; // Hide button during load

        if (currentAnimalIndex >= allGameAnimals.length) {
            console.log("Game Over - All animals shown!");
            // TODO: Implement a proper game over screen or loop
            // For now, let's just reset to the first animal for continuous play
            currentAnimalIndex = 0; 
            // alert("You've fed all the animals! Playing again."); // Simple alert
        }

        currentAnimalData = allGameAnimals[currentAnimalIndex];

        // Dispose of previous animal's meshes
        const oldAnimalMesh = scene.getMeshByName("current_animal_model_root");
        if (oldAnimalMesh) {
            oldAnimalMesh.dispose(false, true); // Dispose mesh and its children
        }
        // Code-Critic: Also good to dispose of animation groups if they are cloned per instance, 
        // but SceneLoader often reuses them or they are tied to the skeleton. Monitor memory if it becomes an issue.

        console.log(`Loading animal: ${currentAnimalData.name}`);
        currentAnimalData.asset = await loadModel(currentAnimalData.modelPath, "current_animal_model_root", scene);

        if (currentAnimalData.asset && currentAnimalData.asset.rootMesh) {
            currentAnimalData.asset.rootMesh.position = new BABYLON.Vector3(0, 0, 0); 
            currentAnimalData.asset.rootMesh.rotation.y = currentAnimalData.rotationY || 0;
            if (currentAnimalData.scale) {
                currentAnimalData.asset.rootMesh.scaling = new BABYLON.Vector3(
                    currentAnimalData.scale.x, currentAnimalData.scale.y, currentAnimalData.scale.z
                );
            }
            playAnimation(currentAnimalData.asset, currentAnimalData.idleAnim || "idle", true);
            console.log(`${currentAnimalData.name} displayed.`);
            setupFoodChoicesUI();
            isAcceptingInput = true; // Re-enable input
        } else {
            console.error(`Failed to load/display ${currentAnimalData.name}. Skipping.`);
            isAcceptingInput = true; // Re-enable input even on failure
            proceedToNextAnimal(); // Try next animal
        }
    }

    function setupFoodChoicesUI() {
        // ... (setupFoodChoicesUI remains mostly the same)
        foodChoicesBar.innerHTML = ''; 
        const correctFoodName = currentAnimalData.correctFood;
        let foodOptions = [correctFoodName];
        let distractors = GAME_DATA.foods.filter(food => food.name !== correctFoodName).map(food => food.name);
        distractors.sort(() => 0.5 - Math.random());
        foodOptions.push(...distractors.slice(0, 4));
        // ... (logic to ensure 5 options, then shuffle - this remains the same) ...
        let i = 0;
        while (foodOptions.length < 5 && GAME_DATA.foods.length > foodOptions.length) {
            let potentialDistractor = GAME_DATA.foods.find(f => !foodOptions.includes(f.name))?.name;
            if (potentialDistractor) foodOptions.push(potentialDistractor); else break;
        }
        i = 0; // Reset i for the padding loop if needed
        let originalDistractors = distractors.length > 0 ? distractors : GAME_DATA.foods.map(f => f.name).filter(n => n !== correctFoodName); // Ensure we have some distractors for padding
        while (foodOptions.length < 5 && foodOptions.length > 0 && originalDistractors.length > 0) {
             // Pad with existing distractors, trying not to repeat too obviously if possible
            foodOptions.push(originalDistractors[i % originalDistractors.length]);
            i++;
        }
        foodOptions.sort(() => 0.5 - Math.random()); // Shuffle final choices
        // ---

        foodOptions.forEach(foodName => {
            const foodButton = document.createElement('button');
            foodButton.innerText = foodName;
            foodButton.dataset.foodName = foodName; 
            foodButton.classList.add('food-choice-button'); 
            foodButton.addEventListener('click', handleFoodChoice);
            foodChoicesBar.appendChild(foodButton);
        });
    }

    async function handleFoodChoice(event) {
        if (!isAcceptingInput) return; // Prevent clicks if not ready
        isAcceptingInput = false; // Disable input during animation

        const chosenFoodName = event.target.dataset.foodName;
        console.log(`Chose food: ${chosenFoodName}`);

        // Hide food choice buttons during feedback
        foodChoicesBar.style.display = 'none';

        // TODO: Animate 3D food model towards animal
        // For now, the banana model is just visible in the scene as a test.
        // We'll need to find and show the chosen 3D food model.
        // Example:
        // const chosenFoodAsset = currentFoodAssets[chosenFoodName];
        // if (chosenFoodAsset && chosenFoodAsset.rootMesh) {
        //     chosenFoodAsset.rootMesh.isVisible = true;
        //     // Animate it towards currentAnimalData.asset.rootMesh
        // }


        if (chosenFoodName === currentAnimalData.correctFood) {
            console.log("Correct!");
            const eatAnim = playAnimation(currentAnimalData.asset, currentAnimalData.eatAnim || "eat", false);
            if (eatAnim) {
                eatAnim.onAnimationEndObservable.addOnce(() => {
                    const happyAnim = playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false);
                    // Show Next Animal button after happy animation (or eat if no happy)
                    if (happyAnim) {
                        happyAnim.onAnimationEndObservable.addOnce(() => {
                            nextAnimalButton.style.display = 'block';
                            isAcceptingInput = true; // Allow clicking "Next Animal"
                        });
                    } else { // No happy animation, show button after eat
                        nextAnimalButton.style.display = 'block';
                        isAcceptingInput = true;
                    }
                });
            } else { // No eat animation, play happy directly or show button
                const happyAnim = playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false);
                if (happyAnim) {
                     happyAnim.onAnimationEndObservable.addOnce(() => {
                        nextAnimalButton.style.display = 'block';
                        isAcceptingInput = true;
                    });
                } else { // No eat or happy, just show button
                    nextAnimalButton.style.display = 'block';
                    isAcceptingInput = true;
                }
            }
        } else {
            console.log("Incorrect!");
            const shrugAnim = playAnimation(currentAnimalData.asset, currentAnimalData.shrugAnim || "shrug", false);
            if (shrugAnim) {
                shrugAnim.onAnimationEndObservable.addOnce(() => {
                    foodChoicesBar.style.display = 'flex'; // Show food choices again
                    isAcceptingInput = true; // Allow another try
                });
            } else { // No shrug animation
                foodChoicesBar.style.display = 'flex';
                isAcceptingInput = true;
            }
        }
    }

    function proceedToNextAnimal() {
        currentAnimalIndex++;
        loadAndDisplayCurrentAnimal();
    }
    
    // --- ANIMATION HANDLING ---
    function playAnimation(asset, animationName, loop = true) {
        // ... (playAnimation function remains largely the same, ensure it stops other anims)
        if (!asset || !asset.animationGroups || asset.animationGroups.length === 0) { /* ... */ return null; }
        const animGroup = asset.animationGroups.find(ag => ag.name.toLowerCase().includes(animationName.toLowerCase()));
        // Stop all other animations on this asset before starting a new one
        asset.animationGroups.forEach(ag => { if (ag !== animGroup) ag.stop(); }); // Stop others
        if (animGroup) {
            // console.log(`Playing animation "${animGroup.name}" for ${asset.rootMesh.name}`);
            animGroup.play(loop); 
            return animGroup;
        } else {
            console.warn(`Anim "${animationName}" not found for ${asset.rootMesh.name}. Avail:`, asset.animationGroups.map(ag => ag.name));
            if (asset.animationGroups.length > 0 && animationName.toLowerCase().includes("idle")) {
                asset.animationGroups.forEach(ag => ag.stop());
                asset.animationGroups[0].play(loop);
                return asset.animationGroups[0];
            }
        }
        return null;
    }

    // --- EVENT LISTENERS ---
    startGameButton.addEventListener('click', initializeGame);
    nextAnimalButton.addEventListener('click', () => {
        if (isAcceptingInput) { // Only proceed if not in another animation/action
            proceedToNextAnimal();
        }
    });

}); // End of DOMContentLoaded
