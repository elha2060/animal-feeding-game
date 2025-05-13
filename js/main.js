window.addEventListener('DOMContentLoaded', () => {
    const startScreenWrapper = document.getElementById('startScreenWrapper');
    const gameArea = document.getElementById('gameArea');
    const startGameButton = document.getElementById('startGameButton');
    const renderCanvas = document.getElementById('renderCanvas');
    const foodChoicesBar = document.getElementById('foodChoicesBar'); // Fallback
    const nextAnimalButton = document.getElementById('nextAnimalButton');
    const animalQueueSlotPrev = document.getElementById('slot-prev');
    const animalQueueSlotCurrent = document.getElementById('slot-current');
    const animalQueueSlotNext = document.getElementById('slot-next');

    let engine, scene, camera, currentAnimalData, 
        currentFoodAssets = {}, allGameAnimals = [], currentAnimalIndex = 0, 
        isAcceptingInput = true, displayedFoodMeshes = [];

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

    // --- INITIALIZATION & SCENE ---
    async function initializeGame() {
        startScreenWrapper.style.display = 'none';
        gameArea.style.display = 'flex';
        nextAnimalButton.style.display = 'none';
        foodChoicesBar.style.display = 'none'; // Primarily use 3D choices
        isAcceptingInput = false; // Prevent input until first animal loaded

        engine = new BABYLON.Engine(renderCanvas, true, { stencil: true, preserveDrawingBuffer: true }, true);
        scene = createScene();
        setupPicking(scene); // Initialize picking

        engine.runRenderLoop(() => { if (scene) scene.render(); });
        window.addEventListener('resize', () => engine.resize());

        allGameAnimals = GAME_DATA.animals;
        currentAnimalIndex = 0;
        
        await preloadFoodModels();
        await loadAndDisplayCurrentAnimal(); // Make sure this is awaited
        isAcceptingInput = true; // Now ready for first input
    }

    function createScene() {
        const newScene = new BABYLON.Scene(engine);
        camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.8, 6, new BABYLON.Vector3(0, 1.2, 0), newScene);
        camera.lowerRadiusLimit = 3; camera.upperRadiusLimit = 10;
        camera.lowerBetaLimit = Math.PI / 4; camera.upperBetaLimit = Math.PI / 1.9;
        // camera.attachControl(renderCanvas, true); // For dev

        const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0.5, 1, 0.25), newScene);
        light1.intensity = 0.9;
        const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-0.5, -1, -0.5), newScene);
        light2.intensity = 0.4;
        light2.position = new BABYLON.Vector3(10, 20, 10);

        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, newScene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", newScene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.75, 0.6);
        ground.material = groundMaterial;
        ground.isPickable = false; // Ground should not interfere with picking food

        newScene.clearColor = new BABYLON.Color4(0.85, 0.93, 1, 1);
        return newScene;
    }

    // --- MODEL LOADING ---
    async function preloadFoodModels() { /* ... (Same as before, ensure 'isVisible = false') ... */ 
        console.log("Preloading food models...");
        for (const foodData of GAME_DATA.foods) {
            if (foodData.modelPath && !currentFoodAssets[foodData.name]) {
                const loadedAsset = await loadModel(foodData.modelPath, `${foodData.name}_food_asset`, scene);
                if (loadedAsset && loadedAsset.rootMesh) {
                    currentFoodAssets[foodData.name] = loadedAsset; // Store the asset container
                    loadedAsset.rootMesh.name = `${foodData.name}_food_model`; // Name the root mesh itself
                    loadedAsset.rootMesh.isVisible = false; 
                    if (foodData.scale) { 
                        loadedAsset.rootMesh.scaling = new BABYLON.Vector3(foodData.scale.x, foodData.scale.y, foodData.scale.z);
                    }
                    // Make all descendant meshes pickable and store foodName
                    loadedAsset.meshes.forEach(m => {
                         m.isPickable = true;
                         m.foodName = foodData.name; // Store food name directly on mesh for picking
                    });
                    console.log(`${foodData.name} preloaded.`);
                }
            }
        }
        console.log("Food preloading complete.");
    }

    async function loadModel(modelPath, modelNameInScene, targetScene) { /* ... (Same as before) ... */ 
        if (!modelPath) { console.warn(`No path for ${modelNameInScene}`); return null; }
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(null, modelPath.substring(0, modelPath.lastIndexOf('/') + 1), modelPath.substring(modelPath.lastIndexOf('/') + 1), targetScene);
            const rootMesh = result.meshes[0];
            if (rootMesh) rootMesh.name = modelNameInScene;
            result.animationGroups.forEach(ag => ag.stop());
            return { rootMesh, animationGroups: result.animationGroups, meshes: result.meshes };
        } catch (error) { console.error(`Error loading ${modelNameInScene} from ${modelPath}:`, error); return null; }
    }
    
    // --- ANIMATION ---
    function playAnimation(asset, animationName, loop = true, onEndCallback = null) { /* ... (Modified to include onEndCallback) ... */
        if (!asset || !asset.animationGroups || asset.animationGroups.length === 0) {
            if (onEndCallback) onEndCallback(); return null;
        }
        const animGroup = asset.animationGroups.find(ag => ag.name.toLowerCase().includes(animationName.toLowerCase()));
        asset.animationGroups.forEach(ag => { if (ag !== animGroup) ag.stop(); });
        if (animGroup) {
            animGroup.play(loop);
            if (onEndCallback && !loop) { // Only add observer for non-looping animations
                const observer = animGroup.onAnimationEndObservable.addOnce(() => {
                    onEndCallback();
                });
            }
            return animGroup;
        } else {
            console.warn(`Anim "${animationName}" not found for ${asset.rootMesh.name}. Avail:`, asset.animationGroups.map(ag => ag.name));
            if (asset.animationGroups.length > 0 && animationName.toLowerCase().includes("idle") && loop) {
                asset.animationGroups[0].play(loop); return asset.animationGroups[0];
            }
        }
        if (onEndCallback) onEndCallback(); // Call callback if no animation found to unblock flow
        return null;
    }

    // --- GAME FLOW & UI ---
    async function loadAndDisplayCurrentAnimal() {
        isAcceptingInput = false;
        nextAnimalButton.style.display = 'none';
        foodChoicesBar.style.display = 'none'; // Default to hiding HTML bar

        displayedFoodMeshes.forEach(mesh => mesh.isVisible = false);
        displayedFoodMeshes = [];

        if (currentAnimalIndex >= allGameAnimals.length) currentAnimalIndex = 0;
        currentAnimalData = allGameAnimals[currentAnimalIndex];
        updateAnimalQueueUI();

        const oldAnimalMesh = scene.getMeshByName("current_animal_model_root");
        if (oldAnimalMesh) oldAnimalMesh.dispose(false, true);

        currentAnimalData.asset = await loadModel(currentAnimalData.modelPath, "current_animal_model_root", scene);
        if (currentAnimalData.asset && currentAnimalData.asset.rootMesh) {
            currentAnimalData.asset.rootMesh.position = new BABYLON.Vector3(0, 0, 0);
            currentAnimalData.asset.rootMesh.rotation.y = currentAnimalData.rotationY || 0;
            if (currentAnimalData.scale) currentAnimalData.asset.rootMesh.scaling = new BABYLON.Vector3(currentAnimalData.scale.x, currentAnimalData.scale.y, currentAnimalData.scale.z);
            
            playAnimation(currentAnimalData.asset, currentAnimalData.idleAnim || "idle", true);
            await setup3DFoodChoices();
            isAcceptingInput = true;
        } else {
            console.error(`Failed to load ${currentAnimalData.name}. Skipping.`);
            proceedToNextAnimal(); // Auto-skip if load fails
        }
    }

    function updateAnimalQueueUI() {
        animalQueueSlotCurrent.textContent = currentAnimalData.name;
        const prevIndex = (currentAnimalIndex - 1 + allGameAnimals.length) % allGameAnimals.length;
        const nextIndex = (currentAnimalIndex + 1) % allGameAnimals.length;
        animalQueueSlotPrev.textContent = allGameAnimals[prevIndex].name;
        animalQueueSlotNext.textContent = allGameAnimals[nextIndex].name;
    }

    async function setup3DFoodChoices() {
        displayedFoodMeshes.forEach(mesh => mesh.isVisible = false); // Hide old ones
        displayedFoodMeshes = [];

        const correctFoodName = currentAnimalData.correctFood;
        let foodOptionNames = [correctFoodName];
        let distractors = GAME_DATA.foods.filter(food => food.name !== correctFoodName).map(food => food.name);
        distractors.sort(() => 0.5 - Math.random());
        foodOptionNames.push(...distractors.slice(0, Math.min(4, distractors.length))); // Ensure enough distractors if available
        
        // Pad if not 5 options
        let i = 0;
        let allFoodNames = GAME_DATA.foods.map(f => f.name);
        while (foodOptionNames.length < 5 && allFoodNames.length > foodOptionNames.length) {
             let potentialPad = allFoodNames.find(n => !foodOptionNames.includes(n));
             if(potentialPad) foodOptionNames.push(potentialPad); else break;
        }
        i = 0;
        while (foodOptionNames.length < 5 && foodOptionNames.length > 0) { // Fallback padding
            foodOptionNames.push(foodOptionNames[i % foodOptionNames.length]); i++;
        }
        foodOptionNames = foodOptionNames.slice(0,5); // Ensure exactly 5
        foodOptionNames.sort(() => 0.5 - Math.random());

        const choiceBasePositions = [ // Adjusted for better spread, Y can be from foodData
            new BABYLON.Vector3(-2.4, 0, 2.8), new BABYLON.Vector3(-1.2, 0, 2.8),
            new BABYLON.Vector3(0, 0, 2.8),    new BABYLON.Vector3(1.2, 0, 2.8),
            new BABYLON.Vector3(2.4, 0, 2.8)
        ];

        let modelsShown = 0;
        for (let j = 0; j < foodOptionNames.length; j++) {
            const foodName = foodOptionNames[j];
            const foodData = GAME_DATA.foods.find(f => f.name === foodName);
            const foodAssetContainer = currentFoodAssets[foodName];

            if (foodAssetContainer && foodAssetContainer.rootMesh && foodData) {
                const foodMesh = foodAssetContainer.rootMesh;
                foodMesh.isVisible = true;
                // Use foodData.displayPosition if defined, otherwise use array `choiceBasePositions`
                let displayPos = foodData.displayPosition ? foodData.displayPosition : choiceBasePositions[j];
                foodMesh.position = new BABYLON.Vector3(displayPos.x, (foodData.scale?.y || 1) * 0.5, displayPos.z); // Adjust Y based on scale
                
                if (foodData.scale) foodMesh.scaling = new BABYLON.Vector3(foodData.scale.x, foodData.scale.y, foodData.scale.z);
                
                // Ensure all children meshes are pickable and carry the foodName
                foodAssetContainer.meshes.forEach(m => {
                     m.isPickable = true; // Critical for picking
                     m.foodName = foodData.name;
                });
                displayedFoodMeshes.push(foodMesh);
                modelsShown++;
            }
        }

        if (modelsShown === 0 && foodOptionNames.length > 0) { // Fallback if no 3D models could be shown
            setupFallbackHtmlFoodChoices(foodOptionNames);
        } else {
            foodChoicesBar.style.display = 'none'; // Hide HTML bar if 3D shown
        }
    }
    
    function setupFallbackHtmlFoodChoices(foodOptionNames) { /* ... (Same as before) ... */ }

    // --- PICKING & INTERACTION ---
    function setupPicking(targetScene) {
        targetScene.onPointerDown = (evt, pickResult) => {
            if (!isAcceptingInput || !pickResult.hit || !pickResult.pickedMesh) return;

            const pickedMesh = pickResult.pickedMesh;
            if (pickedMesh.foodName) { // We stored foodName on the meshes
                handle3DFoodChoice(pickedMesh.foodName);
            }
        };
        // Add hover effect for pickable food
        let lastHoveredMesh = null;
        targetScene.onPointerMove = (evt, pickResult) => {
            if (lastHoveredMesh) {
                // scene.effectLayers is an array, check if glowLayer is present.
                // For simplicity, assume glowLayer is first if it exists or handle this more robustly.
                if (scene.effectLayers && scene.effectLayers[0] && scene.effectLayers[0].name === "glow") {
                    scene.effectLayers[0].removeExcludedMesh(lastHoveredMesh);
                }
                lastHoveredMesh = null;
            }
            if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.foodName && isAcceptingInput) {
                lastHoveredMesh = pickResult.pickedMesh;
                // Create glow layer on demand if it doesn't exist
                if (!scene.getGlowLayerByName("glow")) {
                    const glowLayer = new BABYLON.GlowLayer("glow", scene, { mainTextureSamples: 2 });
                    glowLayer.intensity = 0.5;
                }
                scene.getGlowLayerByName("glow").addExcludedMesh(lastHoveredMesh); // Bug: Should be addIncludedMesh or handle differently
                                                                               // Corrected: Glow layer highlights, so exclude to "unhighlight" others. Or use includedMesh.
                                                                               // Let's use highlighting by adding to an effect layer or changing material.
                // Simpler hover: change emissiveColor
                // This assumes StandardMaterial. For PBR, use emissiveColor on PBR material.
                // if (lastHoveredMesh.material) lastHoveredMesh.material.emissiveColor = BABYLON.Color3.Yellow();
            }
        };
         // Glow layer for hover effect
        const glowLayer = new BABYLON.GlowLayer("glow", targetScene, { 
            mainTextureSamples: 2, // Lower for better performance
            blurKernelSize: 32
        });
        glowLayer.intensity = 0.6;
        // By default, nothing glows. We'll add meshes to it on hover.
        // This needs to be handled more carefully. Let's use a simpler hover for now.

        // Let's simplify hover: Pointer cursor
        targetScene.defaultCursor = "default";
        targetScene.onPointerMove = () => {
            const pickResult = targetScene.pick(targetScene.pointerX, targetScene.pointerY, (mesh) => mesh.isPickable && mesh.isVisible && mesh.foodName);
            if (pickResult.hit) {
                targetScene.defaultCursor = "pointer";
            } else {
                targetScene.defaultCursor = "default";
            }
        };

    }
    
    function animateFoodToAnimal(foodMesh, animalAsset, targetEatRelPos, onComplete) {
        const animalAbsPos = animalAsset.rootMesh.absolutePosition;
        const targetAbsPos = animalAbsPos.add(targetEatRelPos);

        const animDuration = 30; // frames (0.5 sec at 60fps)
        const animation = new BABYLON.Animation(
            "foodMove", "position", 60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        const keys = [];
        keys.push({ frame: 0, value: foodMesh.position.clone() });
        keys.push({ frame: animDuration, value: targetAbsPos });
        animation.setKeys(keys);

        // Add an easing function
        const easingFunction = new BABYLON.SineEase();
        easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
        animation.setEasingFunction(easingFunction);
        
        foodMesh.animations = [animation];
        scene.beginAnimation(foodMesh, 0, animDuration, false, 1, onComplete);
    }

    async function handle3DFoodChoice(chosenFoodName) {
        if (!isAcceptingInput) return;
        isAcceptingInput = false;
        console.log(`3D Chose food: ${chosenFoodName}`);

        displayedFoodMeshes.forEach(mesh => mesh.isVisible = false);
        // foodChoicesBar.style.display = 'none'; // Already hidden if 3D choices were up

        const chosenFoodAssetContainer = currentFoodAssets[chosenFoodName];
        let foodToAnimateMesh = null;

        if (chosenFoodAssetContainer && chosenFoodAssetContainer.rootMesh) {
            foodToAnimateMesh = chosenFoodAssetContainer.rootMesh;
            foodToAnimateMesh.isVisible = true; 
        }

        if (chosenFoodName === currentAnimalData.correctFood) {
            console.log("Correct!");
            if (foodToAnimateMesh && currentAnimalData.targetEatPosition && currentAnimalData.asset) {
                animateFoodToAnimal(foodToAnimateMesh, currentAnimalData.asset, currentAnimalData.targetEatPosition, () => {
                    if (foodToAnimateMesh) foodToAnimateMesh.isVisible = false;
                    playAnimation(currentAnimalData.asset, currentAnimalData.eatAnim || "eat", false, () => {
                        playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false, () => {
                            nextAnimalButton.style.display = 'block';
                            isAcceptingInput = true; 
                        });
                    });
                });
            } else { // Fallback if no food to animate or no target
                if (foodToAnimateMesh) foodToAnimateMesh.isVisible = false;
                playAnimation(currentAnimalData.asset, currentAnimalData.eatAnim || "eat", false, () => {
                    playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false, () => {
                        nextAnimalButton.style.display = 'block';
                        isAcceptingInput = true;
                    });
                });
            }
        } else { 
            console.log("Incorrect!");
            if (foodToAnimateMesh) foodToAnimateMesh.isVisible = false; // Hide wrongly chosen food immediately
            playAnimation(currentAnimalData.asset, currentAnimalData.shrugAnim || "shrug", false, () => {
                setup3DFoodChoices(); 
                isAcceptingInput = true;
            });
        }
    }
    // Fallback for HTML button clicks if needed, should call handle3DFoodChoice
    function handleFoodChoice(event) { handle3DFoodChoice(event.target.dataset.foodName); }

    function proceedToNextAnimal() {
        currentAnimalIndex++;
        loadAndDisplayCurrentAnimal();
    }
    
    function goFullScreen(el) {
        if (el.requestFullscreen)        { el.requestFullscreen(); }
        else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
        else if (el.msRequestFullscreen) { el.msRequestFullscreen(); }
    }

    // --- EVENT LISTENERS ---
    // Guard against resize events before the engine exists
    window.addEventListener('resize', () => { if (engine) engine.resize(); });
    document.addEventListener('fullscreenchange', () => { if (engine) engine.resize(); });

    startGameButton.addEventListener('click', () => {
        goFullScreen(document.documentElement);   // ask browser for full-screen
        initializeGame();                         // start the game
    });

    nextAnimalButton.addEventListener('click', () => {
        if (nextAnimalButton.style.display === 'block') { // Only if button is truly active
             proceedToNextAnimal();
        }
    });
});
