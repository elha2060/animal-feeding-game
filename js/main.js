window.addEventListener('DOMContentLoaded', () => {
    /* ————————————————— DOM handles ————————————————— */
    const qs   = id => document.getElementById(id);
    const wrap = qs('startScreenWrapper');
    const area = qs('gameArea');
    const btnStart = qs('startGameButton');
    const canvas   = qs('renderCanvas');
    const htmlFood = qs('foodChoicesBar');
    const btnNext  = qs('nextAnimalButton');
    const qSlots   = {
        minus2 : qs('slot-2'),
        prev   : qs('slot-prev'),
        current: qs('slot-current'),
        next   : qs('slot-next'),
        plus2  : qs('slot+2')
    };

    /* ————————————————— engine-level vars ————————————————— */
    let engine, scene, camera, glowLayer;
    let allAnimals = [], currentIdx = 0, currentAnimalData = null;
    let foodAssets = {}, displayedFoodMeshes = [];
    let acceptingInput = false;

    /* ————————————————— assets & game data ————————————————— */
    const ASSET = { /*  same dictionary of paths …  */ };
    const GAME  = { /*  same animals[] & foods[] …  */ };

    /* ————————————————— helper: fullscreen ————————————————— */
    const goFull = el =>
        el.requestFullscreen ? el.requestFullscreen()
      : el.webkitRequestFullscreen ? el.webkitRequestFullscreen()
      : el.msRequestFullscreen && el.msRequestFullscreen();

    /* ————————————————— initialise game ————————————————— */
    async function init() {
        wrap.style.display = 'none';
        area.style.display = 'flex';
        htmlFood.style.display = 'none';
        btnNext.style.display = 'none';
        acceptingInput = false;

        engine = new BABYLON.Engine(canvas, true, { stencil:true, preserveDrawingBuffer:true }, true);
        scene  = buildScene();
        glowLayer = new BABYLON.GlowLayer('hoverGlow', scene, { mainTextureSamples:2, blurKernelSize:32 });
        setupPicking();

        engine.runRenderLoop(() => scene.render());

        allAnimals = GAME.animals;
        await preloadFoods();
        await showAnimal(0);

        acceptingInput = true;
    }

    /* ————————————————— scene ————————————————— */
    function buildScene(){
        const scn = new BABYLON.Scene(engine);
        camera = new BABYLON.ArcRotateCamera('cam', -Math.PI/2, Math.PI/2.8, 6, new BABYLON.Vector3(0,1.2,0), scn);
        camera.lowerRadiusLimit=3; camera.upperRadiusLimit=10;
        camera.lowerBetaLimit=Math.PI/4; camera.upperBetaLimit=Math.PI/1.9;

        new BABYLON.HemisphericLight('h1', new BABYLON.Vector3(.5,1,.25), scn).intensity=.9;
        const dir = new BABYLON.DirectionalLight('h2', new BABYLON.Vector3(-.5,-1,-.5), scn);
        dir.intensity=.4; dir.position = new BABYLON.Vector3(10,20,10);

        const ground = BABYLON.MeshBuilder.CreateGround('g',{width:20,height:20},scn);
        ground.material = new BABYLON.StandardMaterial('gmat',scn);
        ground.material.diffuseColor = new BABYLON.Color3(.6,.75,.6);
        ground.isPickable=false;

        scn.clearColor = new BABYLON.Color4(.85,.93,1,1);
        return scn;
    }

    /* ————————————————— food asset loading ————————————————— */
    async function preloadFoods(){
        for(const food of GAME.foods){
            if(foodAssets[food.name]) continue;
            const asset = await loadMesh(food.modelPath,`${food.name}_asset`);
            if(!asset) continue;
            foodAssets[food.name]=asset;
            asset.rootMesh.isVisible=false;
            if(food.scale) asset.rootMesh.scaling = new BABYLON.Vector3(food.scale.x,food.scale.y,food.scale.z);
            asset.meshes.forEach(m=>{ m.isPickable=true; m.foodName=food.name; });
        }
    }
    function loadMesh(path,tag){
        if(!path) return null;
        const dir = path.slice(0,path.lastIndexOf('/')+1);
        const file= path.slice(path.lastIndexOf('/')+1);
        return BABYLON.SceneLoader.ImportMeshAsync(null,dir,file,scene)
            .then(r=>{ r.meshes[0].name=tag; r.animationGroups.forEach(g=>g.stop()); return r; })
            .catch(e=>{ console.error('load error',file,e); return null; });
    }

    /* ————————————————— gameplay loop ————————————————— */
    async function showAnimal(index){
        acceptingInput=false;
        btnNext.style.display='none';
        hideAndDisableFoodMeshes();

        currentIdx = (index+allAnimals.length)%allAnimals.length;
        currentAnimalData = allAnimals[currentIdx];
        updateQueueUI();

        /* dispose previous animal */
        const prev = scene.getMeshByName('currentAnimalRoot');
        if(prev) prev.dispose(false,true);

        /* load current animal */
        const asset = await loadMesh(currentAnimalData.modelPath,'currentAnimalRoot');
        currentAnimalData.asset=asset;
        if(asset){
            asset.rootMesh.position.set(0,0,0);
            if(currentAnimalData.scale)
                asset.rootMesh.scaling = new BABYLON.Vector3(
                    currentAnimalData.scale.x,currentAnimalData.scale.y,currentAnimalData.scale.z);
            asset.rootMesh.rotation.y=currentAnimalData.rotationY||0;
            playAnim(asset,currentAnimalData.idleAnim||'idle',true);
            await setupFoodChoices();
            acceptingInput=true;
        } else {           // failed load—skip animal
            nextAnimal();
        }
    }

    function updateQueueUI(){
        const get = idx => allAnimals[(idx+allAnimals.length)%allAnimals.length].name;
        qSlots.minus2.textContent = get(currentIdx-2);
        qSlots.prev  .textContent = get(currentIdx-1);
        qSlots.current.textContent = get(currentIdx);
        qSlots.next  .textContent = get(currentIdx+1);
        qSlots.plus2 .textContent = get(currentIdx+2);
    }

    /* ————————————————— food choices ————————————————— */
    async function setupFoodChoices(){
        hideAndDisableFoodMeshes();
        const names = buildChoiceNames();
        const positions = [
            new BABYLON.Vector3(-2.4,0,2.8),new BABYLON.Vector3(-1.2,0,2.8),
            new BABYLON.Vector3(0,0,2.8),  new BABYLON.Vector3(1.2,0,2.8),
            new BABYLON.Vector3(2.4,0,2.8)
        ];
        names.forEach((name,i)=>{
            const asset = foodAssets[name];
            if(!asset) return;
            asset.rootMesh.isVisible=true;
            asset.rootMesh.isPickable=true;
            asset.rootMesh.position = positions[i];
            displayedFoodMeshes.push(asset.rootMesh);
        });
    }
    function buildChoiceNames(){
        const correct = currentAnimalData.correctFood;
        const pool = GAME.foods.map(f=>f.name).filter(n=>n!==correct);
        pool.sort(()=>.5-Math.random());
        const names=[correct,...pool.slice(0,4)];
        names.sort(()=>.5-Math.random());
        return names;
    }

    function hideAndDisableFoodMeshes(){
        displayedFoodMeshes.forEach(m=>{
            m.isVisible=false;
            m.isPickable=false;
            glowLayer.removeIncludedMesh(m);
        });
        displayedFoodMeshes=[];
    }

    /* ————————————————— picking & hover ————————————————— */
    function setupPicking(){
        let hovered=null;

        scene.onPointerMove = (_,pick)=>{
            if(hovered && (!pick.hit || pick.pickedMesh!==hovered)){
                glowLayer.removeIncludedMesh(hovered); hovered=null;
            }
            if(pick.hit && pick.pickedMesh && pick.pickedMesh.foodName && acceptingInput){
                if(hovered!==pick.pickedMesh){
                    glowLayer.addIncludedMesh(pick.pickedMesh);
                    hovered = pick.pickedMesh;
                }
                scene.defaultCursor='pointer';
            }else{
                scene.defaultCursor='default';
            }
        };

        scene.onPointerDown = (_,pick)=>{
            if(!acceptingInput || !pick.hit || !pick.pickedMesh) return;
            if(pick.pickedMesh.foodName) handleFoodChoice(pick.pickedMesh.foodName);
        };
    }

    /* ————————————————— food choice handler ————————————————— */
    async function handleFoodChoice(name){
        if(!acceptingInput) return;
        acceptingInput=false;
        const asset = foodAssets[name];
        const mesh  = asset && asset.rootMesh;

        if(mesh){ mesh.isPickable=false; }   // freeze choice

        const correct = name===currentAnimalData.correctFood;

        if(correct){
            animateFoodToAnimal(mesh,()=>{ playCorrectSequence(); });
        }else{
            playAnim(currentAnimalData.asset,currentAnimalData.shrugAnim||'shrug',false,()=>{ setupFoodChoices(); acceptingInput=true; });
        }
    }
    function animateFoodToAnimal(mesh,done){
        if(!mesh){ done(); return; }
        const dst = currentAnimalData.asset.rootMesh.absolutePosition
            .add(currentAnimalData.targetEatPosition||new BABYLON.Vector3(0,1,0.5));
        const anim = new BABYLON.Animation('move','position',60,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                                           BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        anim.setKeys([{frame:0,value:mesh.position.clone()},{frame:30,value:dst}]);
        mesh.animations=[anim];
        const easing=new BABYLON.SineEase();easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);anim.setEasingFunction(easing);
        scene.beginAnimation(mesh,0,30,false,1,()=>{
            mesh.isVisible=false; glowLayer.removeIncludedMesh(mesh); done();
        });
    }
    function playCorrectSequence(){
        playAnim(currentAnimalData.asset,currentAnimalData.eatAnim||'eat',false,()=>{
            playAnim(currentAnimalData.asset,currentAnimalData.happyAnim||'happy',false,()=>{
                btnNext.style.display='block'; acceptingInput=true;
            });
        });
    }

    /* ————————————————— animation util ————————————————— */
    function playAnim(asset,name,loop=true,end=null){
        if(!asset) return;
        const grp = asset.animationGroups.find(g=>g.name.toLowerCase().includes(name.toLowerCase()));
        asset.animationGroups.forEach(g=>g.stop());
        if(grp){
            grp.play(loop);
            if(end && !loop) grp.onAnimationEndObservable.addOnce(end);
        }else if(end){ end(); }
    }

    /* ————————————————— navigation ————————————————— */
    function nextAnimal(){ showAnimal(currentIdx+1); }

    /* ————————————————— listeners ————————————————— */
    window.addEventListener('resize',()=>engine&&engine.resize());
    document.addEventListener('fullscreenchange',()=>engine&&engine.resize());

    btnStart.addEventListener('click',()=>{ goFull(document.documentElement); init(); });
    btnNext .addEventListener('click',()=>{ btnNext.style.display='none'; nextAnimal(); });
});
