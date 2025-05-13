// Wait for the DOM to be fully loaded before running game logic
window.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const startScreenWrapper = document.getElementById('startScreenWrapper');
    const gameArea = document.getElementById('gameArea');
    const startGameButton = document.getElementById('startGameButton');
    const renderCanvas = document.getElementById('renderCanvas');
    const foodChoicesBar = document.getElementById('foodChoicesBar');
    // const animalQueueBar = document.getElementById('animalQueueBar'); // Will use later
    // const nextAnimalButton = document.getElementById('nextAnimalButton'); // Will use later


    // Babylon.js Essentials
    let engine;
    let scene;
    
    // Game State / Assets
    let currentAnimalData; // Holds data for the current animal (name, correct food, model asset)
    let currentFoodAssets = {}; // Stores loaded food model assets { foodName: asset }
    let allGameAnimals = []; // Array to hold all animal data objects
    let currentAnimalIndex = 0; // To track the current animal in the queue

    // Asset paths (centralize for easier management)
    const ASSET_PATHS = {
        // Animals
        monkey: "assets/models/monkey/monkey.glb",
        // cat: "assets/models/cat/cat.glb", // Example for later
        // Foods
        banana: "assets/models/banana/banana.glb",
        // milk: "assets/models/milk/milk.glb", // Example for later
        // fish: "assets/models/fish/fish.glb", // Example for later
        // pizza: "assets/models/pizza/pizza.glb", // Example for later
        // hay: "assets/models/hay/hay.glb", // Example for later
    };

    // --- GAME DATA DEFINITION ---
    const GAME_DATA = {
        animals: [
            { 
                name: "Monkey", 
                modelPath: ASSET_PATHS.monkey, 
                correctFood: "Banana",
                sound: "assets/sounds/monkey_sound.mp3", // Placeholder
                asset: null, // Will store loaded Babylon asset container
                idleAnim: "idle", // Assuming animation name
                eatAnim: "eat",   // Assuming animation name
                happyAnim: "happy", // Assuming animation name
                shrugAnim: "shrug"  // Assuming animation name
            },
            // TODO: Add Cat, Whale, Dog, Mouse data here later
            // { name: "Cat", modelPath: ASSET_PATHS.cat, correctFood: "Milk", sound: "...", asset: null, idleAnim:"cat_idle", ... },
        ],
        foods: [ // All available food items in the game
            { name: "Banana", modelPath: ASSET_PATHS.banana, asset: null },
            { name: "Milk", modelPath: ASSET_PATHS.milk, asset: null }, // Example
            { name: "Fish", modelPath: ASSET_PATHS.fish, asset: null }, // Example
            { name: "Bone", modelPath: null, asset: null }, // Example, path to be added
            { name: "Cheese", modelPath: null, asset: null }, // Example, path to be added
            { name: "Pizza", modelPath: ASSET_PATHS.pizza, asset: null }, // Example
            { name: "Hay", modelPath: ASSET_PATHS.hay, asset: null }, // Example
            // TODO: Add Flower, Shark, Croissant data here later
        ]
    };

    // --- INITIALIZATION ---
    function initializeGame() {
        startScreenWrapper.style.display = 'none';
        gameArea.style.display = 'flex';

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

        // Prepare game data (e.g., shuffle animals if desired, then load first)
        allGameAnimals = GAME_DATA.animals; // For now, use in defined order
        currentAnimalIndex = 0;

        // Preload all food models (or common ones) - optional optimization
        // For now, we'll load banana along with monkey, others on demand or later
        
        loadAndDisplayCurrentAnimal(); 
    }

    function createScene() {
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.ArcRotateCamera("camera", 
            -Math.PI / 2,      // Alpha
            Math.PI / 2.8,     // Beta (raised camera slightly for better view)
            4.5,               // Radius (closer to animal)
            new BABYLON.Vector3(0, 1.2, 0), // Target (slightly higher Y)
            scene
        );
        // camera.attachControl(renderCanvas, true); // Keep for dev, disable for release
        camera.lowerRadiusLimit = 3;
        camera.upperRadiusLimit = 10;
        camera.lowerBetaLimit = Math.PI / 4; 
        camera.upperBetaLimit = Math.PI / 1.8; // Prevent looking too directly top-down

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.5, 1, 0.25), scene);
        light.intensity = 1.2; // Slightly brighter

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 15, height: 15}, scene); // Larger ground
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.75, 0.6); // Greener
        ground.material = groundMaterial;
        ground.position.y = 0;

        scene.clearColor = new BABYLON.Color4(0.85, 0.93, 1, 1); // Slightly adjusted pastel blue
        return scene;
    }

    // --- MODEL LOADING ---
    async function loadModel(modelPath, modelName, targetScene) {
        if (!modelPath) {
            console.warn(`No model path provided for ${modelName}. Skipping load.`);
            return null;
        }
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                null, 
                modelPath.substring(0, modelPath.lastIndexOf('/') + 1), 
                modelPath.substring(modelPath.lastIndexOf('/') + 1),    
                targetScene
            );
            const rootMesh = result.meshes[0];
            rootMesh.name = modelName;
            console.log(`${modelName} loaded. Animations: ${result.animationGroups.length}`);
            result.animationGroups.forEach(ag => ag.stop());
            return { rootMesh, animationGroups: result.animationGroups, meshes: result.meshes };
        } catch (error) {
            console.error(`Error loading model ${modelName} from ${modelPath}:`, error);
            return null;
        }
    }

    // --- GAME FLOW & UI ---
    async function loadAndDisplayCurrentAnimal() {
        if (currentAnimalIndex >= allGameAnimals.length) {
            console.log("All animals shown!"); // TODO: Implement game end or loop
            // For now, just stop or reset
            currentAnimalIndex = 0; // Loop back to first animal
            // return; 
        }

        currentAnimalData = allGameAnimals[currentAnimalIndex];

        // Clean up previous animal if any
        if (scene.getMeshByName("current_animal_root")) {
             scene.getMeshByName("current_animal_root").dispose();
        }
        // TODO: Also dispose of previous animal's other meshes and animation groups if necessary for memory

        console.log(`Loading animal: ${currentAnimalData.name}`);
        currentAnimalData.asset = await loadModel(currentAnimalData.modelPath, "current_animal_root", scene);

        if (currentAnimalData.asset && currentAnimalData.asset.rootMesh) {
            currentAnimalData.asset.rootMesh.position = new BABYLON.Vector3(0, 0, 0); 
            // TODO: Add animal-specific scaling if needed in GAME_DATA
            // currentAnimalData.asset.rootMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
            playAnimation(currentAnimalData.asset, currentAnimalData.idleAnim || "idle", true);
            console.log(`${currentAnimalData.name} displayed.`);
        } else {
            console.error(`Failed to load/display ${currentAnimalData.name}.`);
            // TODO: Handle this error more gracefully (e.g., skip animal, show error message)
            currentAnimalIndex++;
            loadAndDisplayCurrentAnimal(); // Try next animal
            return;
        }

        // For now, always load banana as a test for food item.
        // Later, this will be driven by food choices.
        if (!currentFoodAssets["Banana"]) { // Load banana only once
            const bananaData = GAME_DATA.foods.find(f => f.name === "Banana");
            if (bananaData && bananaData.modelPath) {
                currentFoodAssets["Banana"] = await loadModel(bananaData.modelPath, "banana_model", scene);
                if (currentFoodAssets["Banana"] && currentFoodAssets["Banana"].rootMesh) {
                    currentFoodAssets["Banana"].rootMesh.position = new BABYLON.Vector3(1.5, 0.5, 0.5); // Example position
                    currentFoodAssets["Banana"].rootMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5); // Example scale
                    // currentFoodAssets["Banana"].rootMesh.isVisible = false; // Will be controlled by UI
                }
            }
        }
        
        setupFoodChoicesUI();
        // TODO: Setup Animal Queue UI
    }

    function setupFoodChoicesUI() {
        foodChoicesBar.innerHTML = ''; // Clear previous choices

        // For MVP, we need 5 food choices: 1 correct, 4 distractors.
        const correctFoodName = currentAnimalData.correctFood;
        let foodOptions = [correctFoodName];
        
        // Get distractor foods (all foods minus the correct one)
        let distractors = GAME_DATA.foods.filter(food => food.name !== correctFoodName)
                                       .map(food => food.name);
        
        // Shuffle distractors and pick 4
        distractors.sort(() => 0.5 - Math.random()); // Simple shuffle
        foodOptions.push(...distractors.slice(0, 4));

        // Ensure we have exactly 5 options if not enough distractors (pad if necessary)
        while (foodOptions.length < 5 && GAME_DATA.foods.length > foodOptions.length) {
            // Add more unique distractors if available
            let potentialDistractor = GAME_DATA.foods.find(f => !foodOptions.includes(f.name))?.name;
            if (potentialDistractor) foodOptions.push(potentialDistractor); else break;
        }
         // If still not 5, duplicate from existing distractors (less ideal, but fills spots)
        let i = 0;
        while (foodOptions.length < 5 && foodOptions.length > 0) {
            foodOptions.push(foodOptions[i % distractors.length]); 
            i++;
        }


        // Shuffle the final 5 options so correct one isn't always first
        foodOptions.sort(() => 0.5 - Math.random());

        foodOptions.forEach(foodName => {
            const foodButton = document.createElement('button');
            foodButton.innerText = foodName;
            foodButton.dataset.foodName = foodName; // Store food name for click handler
            foodButton.classList.add('food-choice-button'); // For styling
            foodButton.addEventListener('click', handleFoodChoice);
            foodChoicesBar.appendChild(foodButton);
        });
        // Code-Critic: Add CSS for .food-choice-button
    }

    function handleFoodChoice(event) {
        const chosenFoodName = event.target.dataset.foodName;
        console.log(`Chose food: ${chosenFoodName}`);

        if (chosenFoodName === currentAnimalData.correctFood) {
            console.log("Correct!");
            playAnimation(currentAnimalData.asset, currentAnimalData.eatAnim || "eat", false);
            // TODO: After eat animation, play happy animation
            // TODO: Show "Next Animal" button
        } else {
            console.log("Incorrect!");
            playAnimation(currentAnimalData.asset, currentAnimalData.shrugAnim || "shrug", false);
            // TODO: Allow user to try again
        }
    }
    
    // --- ANIMATION HANDLING ---
    function playAnimation(asset, animationName, loop = true) {
        if (!asset || !asset.animationGroups || asset.animationGroups.length === 0) {
            console.warn(`No animation groups for ${asset?.rootMesh?.name}`);
            return null; // Return null if no animation played
        }
        const animGroup = asset.animationGroups.find(ag => ag.name.toLowerCase().includes(animationName.toLowerCase()));
        if (animGroup) {
            console.log(`Playing animation "${animGroup.name}" for ${asset.rootMesh.name}`);
            // Stop all other animations on this asset before starting a new one
            asset.animationGroups.forEach(ag => ag.stop());
            animGroup.play(loop); // Simplified play, assumes full range. For specific frames: start(loop, speedRatio, from, to)
            return animGroup;
        } else {
            console.warn(`Anim "${animationName}" not found for ${asset.rootMesh.name}. Avail:`, asset.animationGroups.map(ag => ag.name));
            if (asset.animationGroups.length > 0 && animationName.toLowerCase().includes("idle")) { // Broader check for idle
                asset.animationGroups.forEach(ag => ag.stop());
                asset.animationGroups[0].play(loop);
                return asset.animationGroups[0];
            }
        }
        return null; // No animation played
    }

    // --- EVENT LISTENERS ---
    startGameButton.addEventListener('click', initializeGame);

}); // End of DOMContentLoaded
