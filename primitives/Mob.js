PRIMITIVES["mob"] = {
    name: "Mob",
    description: "Add a custom mob entity to the game",
    uses: [],
    type: "mob",
    list: true,
    tags: {
        id: "custom_mob",
        name: "Custom Mob",
        texture: VALUE_ENUMS.IMG,
        modelType: ["CHICKEN", "PIG", "COW", "SHEEP", "WOLF", "ZOMBIE", "SKELETON", "SPIDER"],
        width: 0.4,
        height: 0.7,
        shadowSize: 0.3,
        maxHealth: 10,
        movementSpeed: 0.25,
        swimSpeed: 1.4,
        canSwim: true,
        canPanic: true,
        panicSpeed: 1.4,
        canMate: true,
        mateSpeed: 1.0,
        canFollowParent: true,
        followParentSpeed: 1.2,
        canWander: true,
        wanderSpeed: 1.0,
        canWatchPlayer: true,
        watchDistance: 6.0,
        breedingItem: "wheat",
        dropItem: "leather",
        spawnEggBaseColor: 0x5e3e2d,
        spawnEggSpotColor: 0x269166,
        spawnInBiomes: ["plains", "forest", "swampland", "river", "beach"],
        spawnWeight: 10,
        spawnMinGroup: 2,
        spawnMaxGroup: 4,
        livingSound: "mob.custom.idle",
        hurtSound: "mob.custom.hurt",
        deathSound: "mob.custom.death",
        stepSound: "mob.custom.step",
        stepVolume: 0.15,
        idleAudioFile: VALUE_ENUMS.AUDIO,
        hurtAudioFile: VALUE_ENUMS.AUDIO,
        deathAudioFile: VALUE_ENUMS.AUDIO,
        stepAudioFile: VALUE_ENUMS.AUDIO,
        Constructor: VALUE_ENUMS.ABSTRACT_HANDLER + "MobConstructor",
        LivingUpdate: VALUE_ENUMS.ABSTRACT_HANDLER + "MobLivingUpdate",
        OnInteract: VALUE_ENUMS.ABSTRACT_HANDLER + "MobInteract",
        GetEyeHeight: VALUE_ENUMS.ABSTRACT_HANDLER + "MobEyeHeight",
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        var constructorHandler = getHandlerCode("MobConstructor", this.tags.Constructor, ["$$entity"]);
        var livingUpdateHandler = getHandlerCode("MobLivingUpdate", this.tags.LivingUpdate, ["$$entity"]);
        var interactHandler = getHandlerCode("MobInteract", this.tags.OnInteract, ["$entity", "$player"], {
            "1_8": function (argNames, code) {
                return `
                nme_CustomEntity.prototype.$interact = function (${argNames[1]}) {
                    this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
                    var ${argNames[0]} = this.wrapped;
                    var ${argNames[1]} = ModAPI.util.wrap(${argNames[1]});
                    ${code};
                    return 0;
                }
                `
            },
            "1_12": function (argNames, code) {
                return `
                var $EnumHand = ModAPI.reflect.getClassById("net.minecraft.util.EnumHand").staticVariables;
                nme_CustomEntity.prototype.$processInteract = function (${argNames[1]}, $handEnum) {
                    this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
                    var ${argNames[0]} = this.wrapped;
                    var ${argNames[1]} = ModAPI.util.wrap(${argNames[1]});
                    ${code};
                    return 0;
                }
                `
            }
        });
        var eyeHeightHandler = getHandlerCode("MobEyeHeight", this.tags.GetEyeHeight, ["$$entity"]);

        const biomeMapping = {
            "plains": "plains",
            "desert": "desert",
            "extremeHills": "extremeHills",
            "forest": "forest",
            "taiga": "taiga",
            "swampland": "swampland",
            "river": "river",
            "hell": "hell",
            "sky": "sky",
            "ocean": "ocean",
            "frozenOcean": "frozenOcean",
            "frozenRiver": "frozenRiver",
            "icePlains": "icePlains",
            "iceMountains": "iceMountains",
            "mushroomIsland": "mushroomIsland",
            "mushroomIslandShore": "mushroomIslandShore",
            "beach": "beach",
            "desertHills": "desertHills",
            "forestHills": "forestHills",
            "taigaHills": "taigaHills",
            "extremeHillsEdge": "extremeHillsEdge",
            "jungle": "jungle",
            "jungleHills": "jungleHills",
            "jungleEdge": "jungleEdge",
            "deepOcean": "deepOcean",
            "stoneBeach": "stoneBeach",
            "coldBeach": "coldBeach",
            "birchForest": "birchForest",
            "birchForestHills": "birchForestHills",
            "roofedForest": "roofedForest",
            "coldTaiga": "coldTaiga",
            "coldTaigaHills": "coldTaigaHills",
            "megaTaiga": "megaTaiga",
            "megaTaigaHills": "megaTaigaHills",
            "extremeHillsPlus": "extremeHillsPlus",
            "savanna": "savanna",
            "savannaPlateau": "savannaPlateau",
            "mesa": "mesa",
            "mesaPlateau_F": "mesaPlateau_F",
            "mesaPlateau": "mesaPlateau"
        };

        const modelMapping = {
            "CHICKEN": "net.minecraft.client.model.ModelChicken",
            "PIG": "net.minecraft.client.model.ModelPig",
            "COW": "net.minecraft.client.model.ModelCow",
            "SHEEP": "net.minecraft.client.model.ModelSheep1",
            "WOLF": "net.minecraft.client.model.ModelWolf",
            "ZOMBIE": "net.minecraft.client.model.ModelZombie",
            "SKELETON": "net.minecraft.client.model.ModelSkeleton",
            "SPIDER": "net.minecraft.client.model.ModelSpider"
        };

        return `(function CustomMobEntity() {
    ModAPI.meta.title("${this.tags.name} Mod");
    ModAPI.meta.description("Adds ${this.tags.name} to the game");

    function waitForRenderManager() {
        return new Promise((res, rej)=>{
            function check() {
                if (ModAPI.mc.renderManager) {
                    res();
                } else {
                    setTimeout(check, 1/20);
                }
            }
            check();
        });
    }

    function registerEntity() {
        ModAPI.hooks.methods.jl_String_format = ModAPI.hooks.methods.nlev_HString_format;
        
        // Utils
        function AITask(name, length) {
            return ModAPI.reflect.getClassById("net.minecraft.entity.ai." + name).constructors.find(x => x.length === length);
        }
        const ResourceLocation = ModAPI.reflect.getClassByName("ResourceLocation").constructors.find(x => x.length === 1);
        const EntityPlayer = ModAPI.reflect.getClassByName("EntityPlayer");
        const SharedMonsterAttributes = ModAPI.reflect.getClassByName("SharedMonsterAttributes").staticVariables;

        // START CUSTOM ENTITY
        var entityClass = ModAPI.reflect.getClassById("net.minecraft.entity.passive.EntityAnimal");
        var entitySuper = ModAPI.reflect.getSuper(entityClass, (x) => x.length === 2);
        
        var nme_CustomEntity = function nme_CustomEntity($worldIn) {
            entitySuper(this, $worldIn);
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            this.wrapped.setSize(${this.tags.width}, ${this.tags.height});
            
            var taskId = 0;
            ${this.tags.canSwim ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAISwimming", 1)(this));` : ''}
            ${this.tags.canPanic ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIPanic", 2)(this, ${this.tags.panicSpeed}));` : ''}
            ${this.tags.canMate ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIMate", 2)(this, ${this.tags.mateSpeed}));` : ''}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAITempt", 4)(this, 1.5, ModAPI.items["${this.tags.breedingItem}"].getRef(), 0));
            ${this.tags.canFollowParent ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIFollowParent", 2)(this, ${this.tags.followParentSpeed}));` : ''}
            ${this.tags.canWander ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWander", 2)(this, ${this.tags.wanderSpeed}));` : ''}
            ${this.tags.canWatchPlayer ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWatchClosest", 3)(this, ModAPI.util.asClass(EntityPlayer.class), ${this.tags.watchDistance}));` : ''}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAILookIdle", 1)(this));
            
            var $$entity = this.wrapped;
            ${constructorHandler.code};
        }
        
        ModAPI.reflect.prototypeStack(entityClass, nme_CustomEntity);
        
        nme_CustomEntity.prototype.$getEyeHeight = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            var $$entity = this.wrapped;
            ${eyeHeightHandler.code || `return this.wrapped.height;`}
        }

        const originalApplyEntityAttributes = nme_CustomEntity.prototype.$applyEntityAttributes;
        nme_CustomEntity.prototype.$applyEntityAttributes = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            originalApplyEntityAttributes.apply(this, []);
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.maxHealth).setBaseValue(${this.tags.maxHealth});
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
        }

        const originalLivingUpdate = nme_CustomEntity.prototype.$onLivingUpdate;
        nme_CustomEntity.prototype.$onLivingUpdate = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            originalLivingUpdate.apply(this, []);
            ${this.tags.canSwim ? `
            if (this.wrapped.isInWater()) {
                this.wrapped.motionY *= 0.5;
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.swimSpeed});
            } else {
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
            }
            ` : ''}
            var $$entity = this.wrapped;
            ${livingUpdateHandler.code};
        }

        nme_CustomEntity.prototype.$interact = function ($player) {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            var $entity = this.wrapped;
            var $player = ModAPI.util.wrap($player);
            ${interactHandler.code};
            return 0;
        }

        nme_CustomEntity.prototype.$getLivingSound = function () {
            return ModAPI.util.str("${this.tags.livingSound}");
        }
        nme_CustomEntity.prototype.$getHurtSound = function () {
            return ModAPI.util.str("${this.tags.hurtSound}");
        }
        nme_CustomEntity.prototype.$getDeathSound = function () {
            return ModAPI.util.str("${this.tags.deathSound}");
        }
        nme_CustomEntity.prototype.$playStepSound = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            this.wrapped.playSound(ModAPI.util.str("${this.tags.stepSound}"), ${this.tags.stepVolume}, 1);
        }
        nme_CustomEntity.prototype.$getDropItem = function () {
            return ModAPI.items["${this.tags.dropItem}"].getRef();
        }
        nme_CustomEntity.prototype.$createChild = function (otherParent) {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            return new nme_CustomEntity(this.wrapped.worldObj?.getRef() ?? null);
        }
        nme_CustomEntity.prototype.$isBreedingItem = function (itemstack) {
            return itemstack !== null && itemstack.$getItem() === ModAPI.items["${this.tags.breedingItem}"].getRef();
        }
        // END CUSTOM ENTITY

        // START CUSTOM MODEL
        var modelClass = ModAPI.reflect.getClassById("${modelMapping[this.tags.modelType]}");
        var modelSuper = ModAPI.reflect.getSuper(modelClass);
        
        var nmcm_CustomModel = function nmcm_CustomModel() {
            modelSuper(this);
        }
        ModAPI.reflect.prototypeStack(modelClass, nmcm_CustomModel);
        // END CUSTOM MODEL

        // START CUSTOM RENDERER
        var renderClass = ModAPI.reflect.getClassById("net.minecraft.client.renderer.entity.RenderLiving");
        var renderSuper = ModAPI.reflect.getSuper(renderClass, (x) => x.length === 4);
        const mobTextures = ResourceLocation(ModAPI.util.str("textures/entity/${this.tags.id}.png"));
        
        var nmcre_CustomRender = function nmcre_CustomRender(renderManager, modelBaseIn, shadowSizeIn) {
            renderSuper(this, renderManager, modelBaseIn, shadowSizeIn);
        }
        ModAPI.reflect.prototypeStack(renderClass, nmcre_CustomRender);
        
        nmcre_CustomRender.prototype.$getEntityTexture = function (entity) {
            return mobTextures;
        }
        ${flags.target === "1_12" ? `
        nmcre_CustomRender.prototype.$handleRotationFloat = function (entity, partialTicks) {
            entity = ModAPI.util.wrap(entity);
            if ((!entity.onGround) && (!entity.isInWater())) {
                return 2;
            } else {
                return 0;
            }
        }
        ` : `
        nmcre_CustomRender.prototype.$func_77044_a = function (entity, partialTicks) {
            entity = ModAPI.util.wrap(entity);
            if ((!entity.onGround) && (!entity.isInWater())) {
                return 2;
            } else {
                return 0;
            }
        }
        `}
        // END CUSTOM RENDERER

        const ID = ModAPI.keygen.entity("${this.tags.id}");
        ModAPI.reflect.getClassById("net.minecraft.entity.EntityList").staticMethods.addMapping0.method(
            ModAPI.util.asClass(nme_CustomEntity),
            {
                $createEntity: function ($worldIn) {
                    return new nme_CustomEntity($worldIn);
                }
            },
            ModAPI.util.str("${this.tags.name}"),
            ID,
            ${this.tags.spawnEggBaseColor},
            ${this.tags.spawnEggSpotColor}
        );

        const SpawnPlacementType = ModAPI.reflect.getClassById("net.minecraft.entity.EntityLiving$SpawnPlacementType").staticVariables;
        const ENTITY_PLACEMENTS = ModAPI.util.wrap(
            ModAPI.reflect.getClassById("net.minecraft.entity.EntitySpawnPlacementRegistry")
                .staticVariables.ENTITY_PLACEMENTS
        );
        ENTITY_PLACEMENTS.put(ModAPI.util.asClass(nme_CustomEntity), SpawnPlacementType.ON_GROUND);
        
        ModAPI.addEventListener('bootstrap', ()=>{
            const SpawnListEntry = ModAPI.reflect
                .getClassById("net.minecraft.world.biome.BiomeGenBase$SpawnListEntry")
                .constructors.find(x => x.length === 4);
            
            ${this.tags.spawnInBiomes.map(biome => `
            const Biome_${biome} = ModAPI.util.wrap(
                ModAPI.reflect.getClassById("net.minecraft.world.biome.BiomeGenBase")
                    .staticVariables.${biomeMapping[biome]}
            );
            const spawnEntry_${biome} = SpawnListEntry(
                ModAPI.util.asClass(nme_CustomEntity), 
                ${this.tags.spawnWeight}, 
                ${this.tags.spawnMinGroup}, 
                ${this.tags.spawnMaxGroup}
            );
            Biome_${biome}.spawnableCreatureList.add(spawnEntry_${biome});
            `).join('\n')}
        });

        ModAPI.addEventListener("lib:asyncsink", async () => {
            AsyncSink.L10N.set("entity.${this.tags.name}.name", "${this.tags.name}");
        });

        return {
            EntityCustom: nme_CustomEntity,
            ModelCustom: nmcm_CustomModel,
            RenderCustom: nmcre_CustomRender,
            mobTextures: mobTextures
        }
    }

    ModAPI.dedicatedServer.appendCode(registerEntity);
    var data = registerEntity();

    ModAPI.addEventListener("lib:asyncsink", async () => {
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${this.tags.id}.png", await (await fetch(
            "${this.tags.texture}"
        )).arrayBuffer());
        AsyncSink.hideFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${this.tags.id}.png.mcmeta");

        await waitForRenderManager();

        // Register sounds
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/idle.ogg", await (await fetch(
            "${this.tags.idleAudioFile}"
        )).arrayBuffer());
        AsyncSink.Audio.register("${this.tags.livingSound}", AsyncSink.Audio.Category.ANIMALS, [{
            path: "sounds/mob/${this.tags.id}/idle.ogg",
            pitch: 1,
            volume: 1,
            streaming: false
        }]);

        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/hurt.ogg", await (await fetch(
            "${this.tags.hurtAudioFile}"
        )).arrayBuffer());
        AsyncSink.Audio.register("${this.tags.hurtSound}", AsyncSink.Audio.Category.ANIMALS, [{
            path: "sounds/mob/${this.tags.id}/hurt.ogg",
            pitch: 1,
            volume: 1,
            streaming: false
        }]);

        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/death.ogg", await (await fetch(
            "${this.tags.deathAudioFile}"
        )).arrayBuffer());
        AsyncSink.Audio.register("${this.tags.deathSound}", AsyncSink.Audio.Category.ANIMALS, [{
            path: "sounds/mob/${this.tags.id}/death.ogg",
            pitch: 1,
            volume: 1,
            streaming: false
        }]);

        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/step.ogg", await (await fetch(
            "${this.tags.stepAudioFile}"
        )).arrayBuffer());
        AsyncSink.Audio.register("${this.tags.stepSound}", AsyncSink.Audio.Category.ANIMALS, [{
            path: "sounds/mob/${this.tags.id}/step.ogg",
            pitch: 1,
            volume: 1,
            streaming: false
        }]);

        ModAPI.mc.renderManager.entityRenderMap.put(ModAPI.util.asClass(data.EntityCustom), new data.RenderCustom(ModAPI.mc.renderManager.getRef(), new data.ModelCustom(), ${this.tags.shadowSize}));
        ModAPI.promisify(ModAPI.mc.renderEngine.bindTexture)(data.mobTextures).then(() => {
            console.log("Loaded ${this.tags.name} texture into cache.");
        });
    });
})();`
    }
}
