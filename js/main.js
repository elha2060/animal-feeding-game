// Wait for the DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const startScreenWrapper = document.getElementById('startScreenWrapper');
    const gameArea = document.getElementById('gameArea');
    const startGameButton = document.getElementById('startGameButton');
    const renderCanvas = document.getElementById('renderCanvas');
    const foodChoicesBar = document.getElementById('foodChoicesBar');
    const nextAnimalButton = document.getElementById('nextAnimalButton'); 
    
    // Babylon.js Essentials & Game State
    let engine, scene, currentAnimalData, currentFoodAssets = {}, allGameAnimals = [], currentAnimalIndex = 0, isAcceptingInput = true;
    let displayedFoodModels = [];

    // Asset paths
    const ASSET_PATHS = {
        monkey: "assets/models/monkey/monkey.glb",
        cat: "assets/models/cat/cat.glb",
        mouse: "assets/models/mouse/mouse.glb",
        dog: "assets/models/dog/dog.glb",
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

    // GAME DATA DEFINITION
    const GAME_DATA = {
        animals: [
            { 
                name: "Monkey", modelPath: ASSET_PATHS.monkey, correctFood: "Banana",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death",
                scale: { x: 1, y: 1, z: 1 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 1.2, 0.5) 
            },
            { 
                name: "Dog", modelPath: ASSET_PATHS.dog, correctFood: "Bone",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", 
                scale: { x: 1, y: 1, z: 1 }, rotationY: Math.PI,
                targetEatPosition: new BABYLON.Vector3(0, 0.8, 0.6) 
            },
             { 
                name: "Cat", modelPath: ASSET_PATHS.cat, correctFood: "Milk",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", 
                scale: { x: 1, y: 1, z: 1 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 0.6, 0.4)
            },
            { 
                name: "Whale", modelPath: ASSET_PATHS.whale, correctFood: "Fish",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", 
                scale: { x: 2, y: 2, z: 2 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 1.5, 1)
            },
            { 
                name: "Mouse", modelPath: ASSET_PATHS.mouse, correctFood: "Cheese",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", 
                scale: { x: 0.5, y: 0.5, z: 0.5 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 0.2, 0.2)
            },
        ],
        foods: [ 
            { name: "Banana", modelPath: ASSET_PATHS.banana, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(-2, 0.3, 2) },
            { name: "Milk", modelPath: ASSET_PATHS.milk, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(-1, 0.3, 2) }, 
            { name: "Fish", modelPath: ASSET_PATHS.fish, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(0, 0.3, 2) }, 
            { name: "Bone", modelPath: ASSET_PATHS.bone, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(1, 0.3, 2) }, 
            { name: "Cheese", modelPath: ASSET_PATHS.cheese, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(2, 0.3, 2) }, 
            { name: "Pizza", modelPath: ASSET_PATHS.pizza, asset: null, scale: {x:0.3,y:0.3,z:0.3}, displayPosition: new BABYLON.Vector3(-2, 0.3, 2.5) }, 
            { name: "Hay", modelPath: ASSET_PATHS.hay, asset: null, scale: {x:0.4,y:0.4,z:0.4}, displayPosition: new BABYLON.Vector3(-1, 0.3, 2.5) }, 
            { name: "Croissant", modelPath: ASSET_PATHS.croissant, asset: null, scale: {x:0.3,y:0.3,z:0.3}, displayPosition: new BABYLON.Vector3(0, 0.3, 2.5) }, 
            { name: "Truck", modelPath: ASSET_PATHS.truck, asset: null, scale: {x:0.4,y:0.4,z:0.4}, displayPosition: new BABYLON.Vector3(1, 0.3, 2.5) }, 
            { name: "Flower", modelPath: ASSET_PATHS.flower, asset: null, scale: {x:0.3,y:0.3,z:0.3}, displayPosition: new BABYLON.Vector3(2, 0.3, 2.5) }, 
        ]
    };

    // --- FUNCTION DEFINITIONS ---
    // (All helper functions: createScene, preloadFoodModels, loadModel, playAnimation, 
    //  setup3DFoodChoices, setupFallbackHtmlFoodChoices, handleFoodChoice, proceedToNextAnimal
    //  MUST BE DEFINED HERE, BEFORE initializeGame if initializeGame calls them, OR ensure initializeGame is defined last if it uses them)

    function createScene() {
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.8, 5, new BABYLON.Vector3(0, 1.2, 0), scene);
        camera.lowerRadiusLimit = 2; camera.upperRadiusLimit = 15;
        camera.lowerBetaLimit = Math.PI / 6; camera.upperBetaLimit = Math.PI / 1.9;
        // camera.attachControl(renderCanvas, true); // For Dev

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0.5, 1, 0.25), scene);
        light.intensity = 1.2;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.75, 0.6);
        ground.material = groundMaterial;
        ground.position.y = 0;

        scene.clearColor = new BABYLON.Color4(0.85, 0.93, 1, 1);
        return scene;
    }

    async function preloadFoodModels() {
        console.log("Preloading food models...");
        for (const foodData of GAME_DATA.foods) {
            if (foodData.modelPath && !currentFoodAssets[foodData.name]) {
                const loadedAsset = await loadModel(foodData.modelPath, `${foodData.name}_model_asset`, scene); // Unique name for asset container
                if (loadedAsset && loadedAsset.rootMesh) {
                    currentFoodAssets[foodData.name] = loadedAsset;
                    loadedAsset.rootMesh.name = `${foodData.name}_model_root`; // Name the root mesh itself
                    loadedAsset.rootMesh.isVisible = false; 
                    if (foodData.scale) { 
                        loadedAsset.rootMesh.scaling = new BABYLON.Vector3(foodData.scale.x, foodData.scale.y, foodData.scale.z);
                    }
                    console.log(`${foodData.name} preloaded.`);
                }
            }
        }
        console.log("Food preloading complete.");
    }

    async function loadModel(modelPath, modelNameInScene, targetScene) {
        if (!modelPath) {
            console.warn(`No model path provided for ${modelNameInScene}. Skipping load.`);
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
            if (rootMesh) { // Check if rootMesh exists
                rootMesh.name = modelNameInScene; // Assign the desired name to the root mesh
            }
            console.log(`${modelNameInScene} (from ${modelPath}) loaded. Meshes: ${result.meshes.length}, Animations: ${result.animationGroups.length}`);
            result.animationGroups.forEach(ag => ag.stop());
            return { rootMesh, animationGroups: result.animationGroups, meshes: result.meshes };
        } catch (error) {
            console.error(`Error loading model ${modelNameInScene} from ${modelPath}:`, error);
            return null;
        }
    }
    
    function playAnimation(asset, animationName, loop = true) {
        if (!asset || !asset.animationGroups || asset.animationGroups.length === 0) {
            console.warn(`No animation groups for ${asset?.rootMesh?.name}`);
            return null;
        }
        const animGroup = asset.animationGroups.find(ag => ag.name.toLowerCase().includes(animationName.toLowerCase()));
        
        asset.animationGroups.forEach(ag => { if (ag !== animGroup) ag.stop(); });
        
        if (animGroup) {
            animGroup.play(loop); 
            return animGroup;
        } else {
            console.warn(`Anim "${animationName}" not found for ${asset.rootMesh.name}. Avail:`, asset.animationGroups.map(ag => ag.name));
            if (asset.animationGroups.length > 0 && animationName.toLowerCase().includes("idle")) {
                asset.animationGroups[0].play(loop);
                return asset.animationGroups[0];
            }
        }
        return null;
    }

    async function setup3DFoodChoices() {
        // Hide previously displayed 3D food models
        displayedFoodModels.forEach(foodAssetContainer => { // Renamed to avoid confusion
            if (foodAssetContainer && foodAssetContainer.rootMesh) foodAssetContainer.rootMesh.isVisible = false;
        });
        displayedFoodModels = [];

        const correctFoodName = currentAnimalData.correctFood;
        let foodOptionNames = [correctFoodName];
        
        let distractors = GAME_DATA.foods.filter(food => food.name !== correctFoodName).map(food => food.name);
        distractors.sort(() => 0.5 - Math.random());
        foodOptionNames.push(...distractors.slice(0, 4));
        
        let i = 0;
        while (foodOptionNames.length < 5 && GAME_DATA.foods.length > foodOptionNames.length) {
            let potentialDistractor = GAME_DATA.foods.find(f => !foodOptionNames.includes(f.name))?.name;
            if (potentialDistractor) foodOptionNames.push(potentialDistractor); else break;
        }
        i = 0; 
        let originalDistractors = distractors.length > 0 ? distractors : GAME_DATA.foods.map(f => f.name).filter(n => n !== correctFoodName);
        while (foodOptionNames.length < 5 && foodOptionNames.length > 0 && originalDistractors.length > 0) {
            foodOptionNames.push(originalDistractors[i % originalDistractors.length]);
            i++;
        }
        foodOptionNames.sort(() => 0.5 - Math.random());

        const choicePositions = [
            new BABYLON.Vector3(-2, 0.3, 2.5), new BABYLON.Vector3(-1, 0.3, 2.5),
            new BABYLON.Vector3(0, 0.3, 2.5),  new BABYLON.Vector3(1, 0.3, 2.5),
            new BABYLON.Vector3(2, 0.3, 2.5)  
        ];

        let successfullyShown3DModels = 0;
        for (let j = 0; j < foodOptionNames.length; j++) {
            const foodName = foodOptionNames[j];
            const foodData = GAME_DATA.foods.find(f => f.name === foodName);
            const foodAssetContainer = currentFoodAssets[foodName]; // Get preloaded asset container

            if (foodAssetContainer && foodAssetContainer.rootMesh && foodData) {
                foodAssetContainer.rootMesh.isVisible = true;
                foodAssetContainer.rootMesh.position = choicePositions[j] || foodData.displayPosition || new BABYLON.Vector3(j*1.5 - 3, 0.3, 2);
                // foodAssetContainer.rootMesh.name = `foodChoice_${foodName}`; // Already named during preload

                if (foodData.scale) { 
                    foodAssetContainer.rootMesh.scaling = new BABYLON.Vector3(foodData.scale.x, foodData.scale.y, foodData.scale.z);
                }
                displayedFoodModels.push(foodAssetContainer);
                successfullyShown3DModels++;
            } else {
                console.warn(`Asset for food choice ${foodName} not found or not loaded.`);
            }
        }

        if (successfullyShown3DModels > 0) {
            foodChoicesBar.style.display = 'none'; // Hide HTML bar if 3D models are shown
            // TODO: Implement 3D picking here
            // For now, re-enable HTML buttons if 3D picking isn't ready, for testing logic
            if (foodChoicesBar.innerHTML === '' || foodChoicesBar.style.display === 'none') { // Check if it needs repopulating
                 setupFallbackHtmlFoodChoices(foodOptionNames); // Re-populate and show HTML buttons
            }
        } else { // No 3D models shown, ensure HTML bar is visible and populated
             setupFallbackHtmlFoodChoices(foodOptionNames);
        }
    }
    
    function setupFallbackHtmlFoodChoices(foodOptionNames) {
        foodChoicesBar.innerHTML = ''; // Clear first
        if (!foodOptionNames || foodOptionNames.length === 0) {
            console.error("No food option names provided for fallback HTML buttons.");
            return;
        }
        foodOptionNames.forEach(foodName => {
            const foodButton = document.createElement('button');
            foodButton.innerText = foodName;
            foodButton.dataset.foodName = foodName;
            foodButton.classList.add('food-choice-button');
            foodButton.addEventListener('click', handleFoodChoice);
            foodChoicesBar.appendChild(foodButton);
        });
        foodChoicesBar.style.display = 'flex';
    }

    async function handleFoodChoice(eventOrFoodName) {
        if (!isAcceptingInput) return;
        isAcceptingInput = false;

        let chosenFoodName;
        if (typeof eventOrFoodName === 'string') {
            chosenFoodName = eventOrFoodName;
        } else {
            chosenFoodName = eventOrFoodName.target.dataset.foodName;
        }
        console.log(`Chose food: ${chosenFoodName}`);

        displayedFoodModels.forEach(foodAssetContainer => {
            if (foodAssetContainer && foodAssetContainer.rootMesh) foodAssetContainer.rootMesh.isVisible = false;
        });
        foodChoicesBar.style.display = 'none'; 

        const chosenFoodAssetContainer = currentFoodAssets[chosenFoodName];
        let foodToAnimateRootMesh = null;

        if (chosenFoodAssetContainer && chosenFoodAssetContainer.rootMesh) {
            foodToAnimateRootMesh = chosenFoodAssetContainer.rootMesh;
            foodToAnimateRootMesh.isVisible = true; 
            if (currentAnimalData.targetEatPosition && currentAnimalData.asset && currentAnimalData.asset.rootMesh) {
                // Position food relative to animal's current position and its defined targetEatPosition
                let absoluteEatPosition = currentAnimalData.asset.rootMesh.position.add(currentAnimalData.targetEatPosition);
                foodToAnimateRootMesh.position = absoluteEatPosition;
            }
        }

        if (chosenFoodName === currentAnimalData.correctFood) {
            console.log("Correct!");
            const eatAnim = playAnimation(currentAnimalData.asset, currentAnimalData.eatAnim || "eat", false);
            if (eatAnim) {
                eatAnim.onAnimationEndObservable.addOnce(() => {
                    if (foodToAnimateRootMesh) foodToAnimateRootMesh.isVisible = false; 
                    const happyAnim = playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false);
                    if (happyAnim) {
                        happyAnim.onAnimationEndObservable.addOnce(() => { nextAnimalButton.style.display = 'block'; isAcceptingInput = true; });
                    } else { nextAnimalButton.style.display = 'block'; isAcceptingInput = true; }
                });
            } else { 
                if (foodToAnimateRootMesh) foodToAnimateRootMesh.isVisible = false;
                const happyAnim = playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false);
                if (happyAnim) { happyAnim.onAnimationEndObservable.addOnce(() => { nextAnimalButton.style.display = 'block'; isAcceptingInput = true; }); }
                else { nextAnimalButton.style.display = 'block'; isAcceptingInput = true; }
            }
        } else { 
            console.log("Incorrect!");
            if (foodToAnimateRootMesh) foodToAnimateRootMesh.isVisible = false; 
            const shrugAnim = playAnimation(currentAnimalData.asset, currentAnimalData.shrugAnim || "shrug", false);
            if (shrugAnim) {
                shrugAnim.onAnimationEndObservable.addOnce(() => {
                    setup3DFoodChoices(); 
                    isAcceptingInput = true;
                });
            } else { 
                setup3DFoodChoices(); 
                isAcceptingInput = true;
            }
        }
    }
    
    function proceedToNextAnimal() {
        currentAnimalIndex++;
        loadAndDisplayCurrentAnimal(); // This will handle hiding button and setting up next state
    }

    // THIS IS THE MAIN INITIALIZATION FUNCTION
    async function initializeGame() { // Made async to await preloadFoodModels
        startScreenWrapper.style.display = 'none';
        gameArea.style.display = 'flex';
        nextAnimalButton.style.display = 'none';
        isAcceptingInput = true;

        engine = new BABYLON.Engine(renderCanvas, true, { stencil: true, preserveDrawingBuffer: true }, true);
        scene = createScene();

        engine.runRenderLoop(() => { if (scene) scene.render(); });
        window.addEventListener('resize', () => engine.resize());

        allGameAnimals = GAME_DATA.animals; 
        currentAnimalIndex = 0;
        
        await preloadFoodModels(); // Wait for foods to preload
        loadAndDisplayCurrentAnimal(); 
    }
    
    // THIS FUNCTION IS CALLED WHEN A NEW ANIMAL NEEDS TO BE LOADED
    async function loadAndDisplayCurrentAnimal() {
        isAcceptingInput = false; 
        nextAnimalButton.style.display = 'none'; 
        
        // Hide previously displayed 3D food models explicitly
        displayedFoodModels.forEach(foodAssetContainer => {
            if (foodAssetContainer && foodAssetContainer.rootMesh) foodAssetContainer.rootMesh.isVisible = false;
        });
        displayedFoodModels = []; 

        if (currentAnimalIndex >= allGameAnimals.length) {
            console.log("Game Over - All animals shown! Looping...");
            currentAnimalIndex = 0; 
        }
        currentAnimalData = allGameAnimals[currentAnimalIndex];

        const oldAnimalMesh = scene.getMeshByName("current_animal_model_root");
        if (oldAnimalMesh) oldAnimalMesh.dispose(false, true);

        console.log(`Loading animal: ${currentAnimalData.name}`);
        currentAnimalData.asset = await loadModel(currentAnimalData.modelPath, "current_animal_model_root", scene);

        if (currentAnimalData.asset && currentAnimalData.asset.rootMesh) {
            currentAnimalData.asset.rootMesh.position = new BABYLON.Vector3(0, 0, 0); 
            currentAnimalData.asset.rootMesh.rotation.y = currentAnimalData.rotationY || 0;
            if (currentAnimalData.scale) { 
                 currentAnimalData.asset.rootMesh.scaling = new BABYLON.Vector3(currentAnimalData.scale.x, currentAnimalData.scale.y, currentAnimalData.scale.z);
            }
            playAnimation(currentAnimalData.asset, currentAnimalData.idleAnim || "idle", true);
            
            await setup3DFoodChoices(); 
            
            isAcceptingInput = true; 
        } else { 
            console.error(`Failed to load/display ${currentAnimalData.name}. Skipping.`);
            isAcceptingInput = true; 
            proceedToNextAnimal(); 
        }
    }

    // --- EVENT LISTENERS ---
    // These MUST be able to find their callback functions.
    startGameButton.addEventListener('click', () => {
        initializeGame(); // Call the async function
    });
    nextAnimalButton.addEventListener('click', () => {
        // isAcceptingInput check is good here to prevent rapid clicks while transitioning
        if (isAcceptingInput || nextAnimalButton.style.display === 'block') { 
            proceedToNextAnimal();
        } else {
            console.warn("Next Animal button clicked, but not accepting input or button not fully ready.");
        }
    });

}); // End of DOMContentLoaded
