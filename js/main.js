// Wait for the DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
    // ... (DOM elements, engine, scene, game state vars - REMAIN THE SAME initially) ...
    const startScreenWrapper = document.getElementById('startScreenWrapper');
    const gameArea = document.getElementById('gameArea');
    const startGameButton = document.getElementById('startGameButton');
    const renderCanvas = document.getElementById('renderCanvas');
    const foodChoicesBar = document.getElementById('foodChoicesBar'); // We might repurpose or hide this later
    const nextAnimalButton = document.getElementById('nextAnimalButton'); 
    
    let engine, scene, currentAnimalData, currentFoodAssets = {}, allGameAnimals = [], currentAnimalIndex = 0, isAcceptingInput = true;
    let displayedFoodModels = []; // Keep track of food models currently shown as choices

    // ... (ASSET_PATHS - REMAINS THE SAME as your last version) ...
    const ASSET_PATHS = { /* ... your existing paths ... */ };

    // --- GAME DATA DEFINITION ---
    // Add 'displayPosition' for food items when they are choices
    // Add 'targetEatPosition' for animals (where food should go)
    const GAME_DATA = {
        animals: [
            // Example for Monkey (YOU NEED TO UPDATE ALL ANIMALS)
            { 
                name: "Monkey", modelPath: ASSET_PATHS.monkey, correctFood: "Banana",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE
                scale: { x: 1, y: 1, z: 1 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 1.2, 0.5) // Approx mouth position relative to animal root
            },
            // ... (YOUR OTHER ANIMAL DEFINITIONS with scale, rotationY, and targetEatPosition) ...
            { 
                name: "Dog", modelPath: ASSET_PATHS.dog, correctFood: "Bone",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE
                scale: { x: 1, y: 1, z: 1 }, rotationY: Math.PI,
                targetEatPosition: new BABYLON.Vector3(0, 0.8, 0.6) 
            },
             { 
                name: "Cat", modelPath: ASSET_PATHS.cat, correctFood: "Milk",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE
                scale: { x: 1, y: 1, z: 1 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 0.6, 0.4)
            },
            { 
                name: "Whale", modelPath: ASSET_PATHS.whale, correctFood: "Fish",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE
                scale: { x: 2, y: 2, z: 2 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 1.5, 1)
            },
            { 
                name: "Mouse", modelPath: ASSET_PATHS.mouse, correctFood: "Cheese",
                sound: null, asset: null, 
                idleAnim: "idle", eatAnim: "Eating", happyAnim: "Gallop", shrugAnim: "Death", // VERIFY THESE
                scale: { x: 0.5, y: 0.5, z: 0.5 }, rotationY: 0,
                targetEatPosition: new BABYLON.Vector3(0, 0.2, 0.2)
            },
        ],
        foods: [ 
            // Example for Banana (YOU NEED TO UPDATE ALL FOODS)
            // displayPosition is relative to the scene origin, where the food choices will appear
            { name: "Banana", modelPath: ASSET_PATHS.banana, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(-2, 0.3, 2) },
            { name: "Milk", modelPath: ASSET_PATHS.milk, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(-1, 0.3, 2) }, 
            { name: "Fish", modelPath: ASSET_PATHS.fish, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(0, 0.3, 2) }, 
            // ... (YOUR OTHER FOOD DEFINITIONS with scale and new displayPosition) ...
            { name: "Bone", modelPath: ASSET_PATHS.bone, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(1, 0.3, 2) }, 
            { name: "Cheese", modelPath: ASSET_PATHS.cheese, asset: null, scale: {x:0.5,y:0.5,z:0.5}, displayPosition: new BABYLON.Vector3(2, 0.3, 2) }, 
            { name: "Pizza", modelPath: ASSET_PATHS.pizza, asset: null, scale: {x:0.3,y:0.3,z:0.3}, displayPosition: new BABYLON.Vector3(-2, 0.3, 2.5) }, // Example different row
            { name: "Hay", modelPath: ASSET_PATHS.hay, asset: null, scale: {x:0.4,y:0.4,z:0.4}, displayPosition: new BABYLON.Vector3(-1, 0.3, 2.5) }, 
            { name: "Croissant", modelPath: ASSET_PATHS.croissant, asset: null, scale: {x:0.3,y:0.3,z:0.3}, displayPosition: new BABYLON.Vector3(0, 0.3, 2.5) }, 
            { name: "Truck", modelPath: ASSET_PATHS.truck, asset: null, scale: {x:0.4,y:0.4,z:0.4}, displayPosition: new BABYLON.Vector3(1, 0.3, 2.5) }, 
            { name: "Flower", modelPath: ASSET_PATHS.flower, asset: null, scale: {x:0.3,y:0.3,z:0.3}, displayPosition: new BABYLON.Vector3(2, 0.3, 2.5) }, 
        ]
    };

    // --- INITIALIZATION & SCENE ---
    // ... (initializeGame, createScene - REMAINS THE SAME) ...
    // ... (preloadFoodModels - REMAINS THE SAME, it already hides preloaded foods) ...
    // ... (loadModel - REMAINS THE SAME) ...

    // --- GAME FLOW & UI ---
    async function loadAndDisplayCurrentAnimal() {
        isAcceptingInput = false; 
        nextAnimalButton.style.display = 'none'; 
        foodChoicesBar.style.display = 'none'; // Hide HTML button bar permanently if using 3D food
                                               // Or hide it temporarily if still using for fallback

        // Hide previously displayed 3D food models
        displayedFoodModels.forEach(foodAsset => {
            if (foodAsset && foodAsset.rootMesh) foodAsset.rootMesh.isVisible = false;
        });
        displayedFoodModels = []; // Clear the array

        if (currentAnimalIndex >= allGameAnimals.length) {
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
            if (currentAnimalData.scale) { /* ... apply scale ... */ 
                 currentAnimalData.asset.rootMesh.scaling = new BABYLON.Vector3(currentAnimalData.scale.x, currentAnimalData.scale.y, currentAnimalData.scale.z);
            }
            playAnimation(currentAnimalData.asset, currentAnimalData.idleAnim || "idle", true);
            
            await setup3DFoodChoices(); // CHANGED from setupFoodChoicesUI
            
            isAcceptingInput = true; 
        } else { /* ... error handling, proceedToNextAnimal ... */ 
            console.error(`Failed to load/display ${currentAnimalData.name}. Skipping.`);
            isAcceptingInput = true; 
            proceedToNextAnimal(); 
        }
    }

    // NEW FUNCTION for 3D food choices
    async function setup3DFoodChoices() {
        const correctFoodName = currentAnimalData.correctFood;
        let foodOptionNames = [correctFoodName];
        // ... (logic to get 4 distractor names - REMAINS THE SAME as in setupFoodChoicesUI) ...
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
        // ---

        // Define positions for the 5 choices in the 3D scene
        // These are example positions, you'll need to adjust them.
        const choicePositions = [
            new BABYLON.Vector3(-2, 0.3, 2.5), // Choice 1
            new BABYLON.Vector3(-1, 0.3, 2.5), // Choice 2
            new BABYLON.Vector3(0, 0.3, 2.5),  // Choice 3
            new BABYLON.Vector3(1, 0.3, 2.5),  // Choice 4
            new BABYLON.Vector3(2, 0.3, 2.5)   // Choice 5
        ];

        for (let i = 0; i < foodOptionNames.length; i++) {
            const foodName = foodOptionNames[i];
            const foodData = GAME_DATA.foods.find(f => f.name === foodName);
            const foodAsset = currentFoodAssets[foodName]; // Get preloaded asset

            if (foodAsset && foodAsset.rootMesh && foodData) {
                foodAsset.rootMesh.isVisible = true;
                foodAsset.rootMesh.position = choicePositions[i] || foodData.displayPosition || new BABYLON.Vector3(i*1.5 - 3, 0.3, 2); // Use defined slot or fallback
                foodAsset.rootMesh.name = `foodChoice_${foodName}`; // For picking
                // Apply scale from GAME_DATA if not already applied during preload
                if (foodData.scale && (foodAsset.rootMesh.scaling.x !== foodData.scale.x)) { // Basic check
                    foodAsset.rootMesh.scaling = new BABYLON.Vector3(foodData.scale.x, foodData.scale.y, foodData.scale.z);
                }
                displayedFoodModels.push(foodAsset); // Add to list of currently shown foods
            } else {
                console.warn(`Asset for food choice ${foodName} not found or not loaded.`);
                // Fallback: Create an HTML button if 3D model is missing
                // This keeps the old HTML button bar relevant for fallbacks
                foodChoicesBar.style.display = 'flex'; // Show HTML button bar
                const foodButton = document.createElement('button');
                foodButton.innerText = foodName;
                foodButton.dataset.foodName = foodName; 
                foodButton.classList.add('food-choice-button'); 
                foodButton.addEventListener('click', handleFoodChoice); // HTML button click
                foodChoicesBar.appendChild(foodButton);
            }
        }
        // TODO: Implement picking for the 3D food models in the next step
        // For now, HTML buttons might still work if 3D setup has issues.
        // If we are fully committed to 3D food, the HTML foodChoicesBar might be hidden permanently.
        if (displayedFoodModels.length > 0 && foodChoicesBar.innerHTML === '') { // If we successfully showed 3D models and no HTML buttons were made
             foodChoicesBar.style.display = 'none';
        } else if (displayedFoodModels.length === 0) { // No 3D models shown, ensure HTML bar is visible
             foodChoicesBar.style.display = 'flex';
             // Populate with HTML buttons if setup3DFoodChoices failed to show any 3D models
             if(foodChoicesBar.innerHTML === '') setupFallbackHtmlFoodChoices(foodOptionNames);
        }
    }
    
    // Fallback if 3D models aren't ready for choices
    function setupFallbackHtmlFoodChoices(foodOptionNames) {
        foodChoicesBar.innerHTML = '';
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


    // MODIFIED to handle 3D food visibility and HTML bar
    async function handleFoodChoice(eventOrFoodName) {
        if (!isAcceptingInput) return;
        isAcceptingInput = false;

        let chosenFoodName;
        if (typeof eventOrFoodName === 'string') {
            chosenFoodName = eventOrFoodName; // Called from 3D pick
        } else {
            chosenFoodName = eventOrFoodName.target.dataset.foodName; // Called from HTML button
        }
        console.log(`Chose food: ${chosenFoodName}`);

        // Hide all 3D food choices and the HTML button bar
        displayedFoodModels.forEach(foodAsset => {
            if (foodAsset && foodAsset.rootMesh) foodAsset.rootMesh.isVisible = false;
        });
        foodChoicesBar.style.display = 'none'; // Hide HTML bar

        const chosenFoodAsset = currentFoodAssets[chosenFoodName];
        let foodToAnimate = null;

        if (chosenFoodAsset && chosenFoodAsset.rootMesh) {
            // Make a temporary clone for animation or use the original if careful
            // For simplicity now, let's just move the original.
            // It will be re-positioned/hidden by the next setup3DFoodChoices call.
            foodToAnimate = chosenFoodAsset.rootMesh;
            foodToAnimate.isVisible = true; // Ensure the chosen one is visible
            // TODO: Animate foodToAnimate towards currentAnimalData.targetEatPosition
            // For now, just make it jump there before eat animation
            if (currentAnimalData.targetEatPosition) {
                foodToAnimate.position = currentAnimalData.targetEatPosition.clone().add(currentAnimalData.asset.rootMesh.position);
            }
        }

        if (chosenFoodName === currentAnimalData.correctFood) {
            console.log("Correct!");
            const eatAnim = playAnimation(currentAnimalData.asset, currentAnimalData.eatAnim || "eat", false);
            if (eatAnim) {
                eatAnim.onAnimationEndObservable.addOnce(() => {
                    if (foodToAnimate) foodToAnimate.isVisible = false; // Hide food after eating
                    const happyAnim = playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false);
                    if (happyAnim) {
                        happyAnim.onAnimationEndObservable.addOnce(() => nextAnimalButton.style.display = 'block');
                    } else { nextAnimalButton.style.display = 'block'; }
                    isAcceptingInput = true; // Re-enable for Next button
                });
            } else { /* ... (no eat anim logic, play happy, show button) ... */
                if (foodToAnimate) foodToAnimate.isVisible = false;
                const happyAnim = playAnimation(currentAnimalData.asset, currentAnimalData.happyAnim || "happy", false);
                if (happyAnim) happyAnim.onAnimationEndObservable.addOnce(() => nextAnimalButton.style.display = 'block');
                else nextAnimalButton.style.display = 'block';
                isAcceptingInput = true;
            }
        } else { /* ... (Incorrect choice: shrug anim, then re-show 3D/HTML food choices) ... */
            console.log("Incorrect!");
            if (foodToAnimate) foodToAnimate.isVisible = false; // Hide wrongly chosen food
            const shrugAnim = playAnimation(currentAnimalData.asset, currentAnimalData.shrugAnim || "shrug", false);
            if (shrugAnim) {
                shrugAnim.onAnimationEndObservable.addOnce(() => {
                    setup3DFoodChoices(); // Re-show choices
                    isAcceptingInput = true;
                });
            } else { 
                setup3DFoodChoices(); // Re-show choices
                isAcceptingInput = true;
            }
        }
    }
    
    function proceedToNextAnimal() { /* ... REMAINS THE SAME ... */ }
    function playAnimation(asset, animationName, loop = true) { /* ... REMAINS THE SAME ... */ }

    // --- EVENT LISTENERS ---
    // ... (startGameButton, nextAnimalButton listeners - REMAINS THE SAME) ...
    startGameButton.addEventListener('click', initializeGame);
    nextAnimalButton.addEventListener('click', () => {
        // isAcceptingInput is now controlled within handleFoodChoice and loadAndDisplayCurrentAnimal
        // so this direct check might not be needed if those functions manage it properly.
        // However, as a safeguard:
        if (!isAcceptingInput && nextAnimalButton.style.display === 'block') {
            // This case might happen if animations end but isAcceptingInput wasn't reset.
            // Or, if the button is clicked rapidly.
            console.warn("Still processing, Next Animal click ignored for now.");
            // For robustness, we can force isAcceptingInput to true here if button is visible
            // Or rely on the animation end callbacks.
            // Let's assume callbacks handle it. If not, this is a place to debug.
        }
        proceedToNextAnimal();
    });
});
