window.addEventListener('DOMContentLoaded', () => {
    /* ————————————————— DOM shortcuts ————————————————— */
    const $ = id => document.getElementById(id);
    const dom = {
        wrap   : $('startScreenWrapper'),
        area   : $('gameArea'),
        start  : $('startGameButton'),
        canvas : $('renderCanvas'),
        htmlBar: $('foodChoicesBar'),
        nextBt : $('nextAnimalButton'),
        qSlots : {
            m2  : $('slot-2'),
            prev: $('slot-prev'),
            cur : $('slot-current'),
            next: $('slot-next'),
            p2  : $('slot-plus2')
        }
    };

    /* ————————————————— Babylon vars ————————————————— */
    let engine, scene, camera, glow;
    let animals = [], idx = 0, curAnimal = null;
    let foodAssets = {}, shownFoodMeshes = [];
    let ready = false;

    /* ————————————————— Asset paths ————————————————— */
    const PATH = {
        monkey : "assets/models/monkey/monkey.glb",
        cat    : "assets/models/cat/cat.glb",
        mouse  : "assets/models/mouse/mouse.glb",
        dog    : "assets/models/dog/dog.glb",
        whale  : "assets/models/whale/whale.glb",
        banana : "assets/models/banana/banana.glb",
        milk   : "assets/models/milk/milk.glb",
        fish   : "assets/models/fish/fish.glb",
        pizza  : "assets/models/pizza/pizza.glb",
        hay    : "assets/models/hay/hay.glb",
        croissant:"assets/models/croissant/croissant.glb",
        truck  : "assets/models/truck/truck.glb",
        flower : "assets/models/flower/flower.glb",
        bone   : "assets/models/bone/bone.glb",
        cheese : "assets/models/cheese/cheese.glb"
    };

    /* ————————————————— Game data ————————————————— */
    const DATA = {
        animals: [
            { name:"Monkey", model:PATH.monkey, food:"Banana",
              idle:"idle", eat:"Eating", happy:"Gallop", shrug:"Death",
              scale:{x:1,y:1,z:1}, rotY:0, eatPos:new BABYLON.Vector3(0,1.2,0.5) },
            { name:"Dog", model:PATH.dog, food:"Bone",
              idle:"idle", eat:"Eating", happy:"Gallop", shrug:"Death",
              scale:{x:1,y:1,z:1}, rotY:Math.PI, eatPos:new BABYLON.Vector3(0,0.8,0.6) },
            { name:"Cat", model:PATH.cat, food:"Milk",
              idle:"idle", eat:"Eating", happy:"Gallop", shrug:"Death",
              scale:{x:1,y:1,z:1}, rotY:0, eatPos:new BABYLON.Vector3(0,0.6,0.4) },
            { name:"Whale", model:PATH.whale, food:"Fish",
              idle:"idle", eat:"Eating", happy:"Gallop", shrug:"Death",
              scale:{x:2,y:2,z:2}, rotY:0, eatPos:new BABYLON.Vector3(0,1.5,1) },
            { name:"Mouse", model:PATH.mouse, food:"Cheese",
              idle:"idle", eat:"Eating", happy:"Gallop", shrug:"Death",
              scale:{x:0.5,y:0.5,z:0.5}, rotY:0, eatPos:new BABYLON.Vector3(0,0.2,0.2) },
        ],
        foods: [
            {name:"Banana", model:PATH.banana, scale:{x:.5,y:.5,z:.5}},
            {name:"Milk"  , model:PATH.milk  , scale:{x:.5,y:.5,z:.5}},
            {name:"Fish"  , model:PATH.fish  , scale:{x:.5,y:.5,z:.5}},
            {name:"Bone"  , model:PATH.bone  , scale:{x:.5,y:.5,z:.5}},
            {name:"Cheese", model:PATH.cheese, scale:{x:.5,y:.5,z:.5}},
            {name:"Pizza" , model:PATH.pizza , scale:{x:.3,y:.3,z:.3}},
            {name:"Hay"   , model:PATH.hay   , scale:{x:.4,y:.4,z:.4}},
            {name:"Croissant",model:PATH.croissant,scale:{x:.3,y:.3,z:.3}},
            {name:"Truck" , model:PATH.truck , scale:{x:.4,y:.4,z:.4}},
            {name:"Flower", model:PATH.flower, scale:{x:.3,y:.3,z:.3}},
        ]
    };

    /* ————————————————— Full-screen helper ————————————————— */
    const goFull = el => (el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen).call(el);

    /* ————————————————— Init ————————————————— */
    async function startGame(){
        dom.wrap.style.display='none';
        dom.area.style.display='flex';
        dom.htmlBar.style.display='none';
        dom.nextBt.style.display='none';
        ready=false;

        engine = new BABYLON.Engine(dom.canvas,true,{stencil:true,preserveDrawingBuffer:true},true);
        scene  = makeScene();
        glow   = new BABYLON.GlowLayer('hoverGlow',scene,{mainTextureSamples:2,blurKernelSize:32});
        setPicking();

        engine.runRenderLoop(()=>scene.render());

        animals = DATA.animals;
        await preloadFoods();
        await showAnimal(0);
        ready=true;
    }

    /* ————————————————— Scene ————————————————— */
    function makeScene(){
        const sc = new BABYLON.Scene(engine);
        camera = new BABYLON.ArcRotateCamera('cam',-Math.PI/2,Math.PI/2.8,6,new BABYLON.Vector3(0,1.2,0),sc);
        camera.lowerRadiusLimit=3;camera.upperRadiusLimit=10;camera.lowerBetaLimit=Math.PI/4;camera.upperBetaLimit=Math.PI/1.9;

        new BABYLON.HemisphericLight('h1',new BABYLON.Vector3(.5,1,.25),sc).intensity=.9;
        const dl=new BABYLON.DirectionalLight('h2',new BABYLON.Vector3(-.5,-1,-.5),sc);
        dl.intensity=.4;dl.position=new BABYLON.Vector3(10,20,10);

        const g = BABYLON.MeshBuilder.CreateGround('g',{width:20,height:20},sc);
        g.material=new BABYLON.StandardMaterial('gmat',sc);g.material.diffuseColor=new BABYLON.Color3(.6,.75,.6);g.isPickable=false;
        sc.clearColor=new BABYLON.Color4(.85,.93,1,1);
        return sc;
    }

    /* ————————————————— Loading helpers ————————————————— */
    async function preloadFoods(){
        for(const f of DATA.foods){
            if(foodAssets[f.name]) continue;
            const asset = await loadMesh(f.model,`${f.name}_asset`);
            if(!asset) continue;
            foodAssets[f.name]=asset;
            asset.rootMesh.isVisible=false;
            if(f.scale) asset.rootMesh.scaling=new BABYLON.Vector3(f.scale.x,f.scale.y,f.scale.z);
            asset.meshes.forEach(m=>{m.isPickable=true;m.foodName=f.name;});
        }
    }
    function loadMesh(path,tag){
        if(!path) return null;
        const dir=path.slice(0,path.lastIndexOf('/')+1),file=path.slice(path.lastIndexOf('/')+1);
        return BABYLON.SceneLoader.ImportMeshAsync(null,dir,file,scene)
            .then(r=>{r.meshes[0].name=tag;r.rootMesh=r.meshes[0];r.animationGroups.forEach(g=>g.stop());return r;})
            .catch(e=>{console.error('load fail',file,e);return null;});
    }

    /* ————————————————— Gameplay loop ————————————————— */
    async function showAnimal(i){
        ready=false;dom.nextBt.style.display='none';hideFoodMeshes();

        idx=(i+animals.length)%animals.length;
        curAnimal=animals[idx];
        updateQueue();

        scene.getMeshByName('animalRoot')?.dispose(false,true);

        const asset=await loadMesh(curAnimal.model,'animalRoot');
        curAnimal.asset=asset;
        if(asset){
            asset.rootMesh.position.set(0,0,0);
            if(curAnimal.scale) asset.rootMesh.scaling=new BABYLON.Vector3(curAnimal.scale.x,curAnimal.scale.y,curAnimal.scale.z);
            asset.rootMesh.rotation.y=curAnimal.rotY||0;
            playAnim(asset,curAnimal.idle,true);
            await setupFood();
            ready=true;
        }else{ nextAnimal(); }
    }

    function updateQueue(){
        const get=n=>animals[(n+animals.length)%animals.length].name;
        dom.qSlots.m2.textContent=get(idx-2);
        dom.qSlots.prev.textContent=get(idx-1);
        dom.qSlots.cur .textContent=get(idx);
        dom.qSlots.next.textContent=get(idx+1);
        dom.qSlots.p2 .textContent=get(idx+2);
    }

    /* ————————————————— Food choices ————————————————— */
    async function setupFood(){
        hideFoodMeshes();
        const names=buildChoices(),pos=[
            new BABYLON.Vector3(-2.4,0,2.8),new BABYLON.Vector3(-1.2,0,2.8),
            new BABYLON.Vector3(0,0,2.8),new BABYLON.Vector3(1.2,0,2.8),
            new BABYLON.Vector3(2.4,0,2.8)
        ];
        names.forEach((n,i)=>{
            const a=foodAssets[n];if(!a)return;
            a.rootMesh.isVisible=true;a.rootMesh.isPickable=true;a.rootMesh.position=pos[i];
            shownFoodMeshes.push(a.rootMesh);
        });
    }
    function buildChoices(){
        const right=curAnimal.food, pool=DATA.foods.map(f=>f.name).filter(n=>n!==right);
        pool.sort(()=>.5-Math.random());
        const arr=[right,...pool.slice(0,4)];
        return arr.sort(()=>.5-Math.random());
    }
    function hideFoodMeshes(){
        shownFoodMeshes.forEach(m=>{m.isVisible=false;m.isPickable=false;glow.removeIncludedOnlyMesh(m);});
        shownFoodMeshes=[];
    }

    /* ————————————————— Picking / Hover ————————————————— */
    function setPicking(){
        let over=null;
        scene.onPointerMove=(_,pick)=>{
            if(over && (!pick.hit||pick.pickedMesh!==over)){glow.removeIncludedOnlyMesh(over);over=null;}
            if(pick.hit&&pick.pickedMesh&&pick.pickedMesh.foodName&&ready){
                if(over!==pick.pickedMesh){glow.addIncludedOnlyMesh(pick.pickedMesh);over=pick.pickedMesh;}
                scene.defaultCursor='pointer';
            }else{scene.defaultCursor='default';}
        };
        scene.onPointerDown=(_,pick)=>{
            if(!ready||!pick.hit||!pick.pickedMesh||!pick.pickedMesh.foodName)return;
            chooseFood(pick.pickedMesh.foodName);
        };
    }

    /* ————————————————— Food selection ————————————————— */
    async function chooseFood(name){
        ready=false;const asset=foodAssets[name],mesh=asset?.rootMesh;if(mesh)mesh.isPickable=false;
        const correct=name===curAnimal.food;
        if(correct){
            flyFood(mesh,()=>{playAnim(curAnimal.asset,curAnimal.eat,false,()=>{
                playAnim(curAnimal.asset,curAnimal.happy,false,()=>{dom.nextBt.style.display='block';ready=true;});
            });});
        }else{
            playAnim(curAnimal.asset,curAnimal.shrug,false,()=>{setupFood();ready=true;});
        }
    }
    function flyFood(mesh,done){
        if(!mesh){done();return;}
        const dst=curAnimal.asset.rootMesh.absolutePosition.add(curAnimal.eatPos);
        const anim=new BABYLON.Animation('move','position',60,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        anim.setKeys([{frame:0,value:mesh.position.clone()},{frame:30,value:dst}]);
        const ease=new BABYLON.SineEase();ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);anim.setEasingFunction(ease);
        mesh.animations=[anim];
        scene.beginAnimation(mesh,0,30,false,1,()=>{mesh.isVisible=false;glow.removeIncludedOnlyMesh(mesh);done();});
    }

    /* ————————————————— Animation helper ————————————————— */
    function playAnim(asset,name,loop=true,end=null){
        if(!asset)return;
        const g=asset.animationGroups.find(a=>a.name.toLowerCase().includes((name||'').toLowerCase()));
        asset.animationGroups.forEach(a=>a.stop());
        if(g){g.play(loop);if(end&&!loop)g.onAnimationEndObservable.addOnce(end);}else if(end){end();}
    }

    /* ————————————————— Navigation ————————————————— */
    const nextAnimal=()=>showAnimal(idx+1);

    /* ————————————————— System listeners ————————————————— */
    window.addEventListener('resize',()=>engine&&engine.resize());
    document.addEventListener('fullscreenchange',()=>engine&&engine.resize());

    dom.start.addEventListener('click',()=>{goFull(document.documentElement);startGame();});
    dom.nextBt.addEventListener('click',()=>{dom.nextBt.style.display='none';nextAnimal();});
});
