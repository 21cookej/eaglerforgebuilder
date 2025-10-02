PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
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
        // Create a copy of tags to avoid modifying the original
        const tags = { ...this.tags };
        
        var constructorHandler = getHandlerCode("MobConstructor", tags.Constructor, ["$entity"]);
        var livingUpdateHandler = getHandlerCode("MobLivingUpdate", tags.LivingUpdate, ["$entity"]);
        var interactHandler = getHandlerCode("MobInteract", tags.OnInteract, ["$entity", "$player"], {
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
                var $$EnumHand = ModAPI.reflect.getClassById("net.minecraft.util.EnumHand").staticVariables;
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
        var eyeHeightHandler = getHandlerCode("MobEyeHeight", tags.GetEyeHeight, ["$entity"]);

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

        // Check if resources are defined (not the default VALUE_ENUM values)
        const hasTexture = tags.texture && typeof tags.texture === 'string' && !tags.texture.includes('VALUE_ENUMS');
        const hasIdleAudio = tags.idleAudioFile && typeof tags.idleAudioFile === 'string' && !tags.idleAudioFile.includes('VALUE_ENUMS');
        const hasHurtAudio = tags.hurtAudioFile && typeof tags.hurtAudioFile === 'string' && !tags.hurtAudioFile.includes('VALUE_ENUMS');
        const hasDeathAudio = tags.deathAudioFile && typeof tags.deathAudioFile === 'string' && !tags.deathAudioFile.includes('VALUE_ENUMS');
        const hasStepAudio = tags.stepAudioFile && typeof tags.stepAudioFile === 'string' && !tags.stepAudioFile.includes('VALUE_ENUMS');

        return `(function CustomMobEntity() {
    ModAPI.meta.title("${tags.name} Mod");
    ModAPI.meta.description("Adds ${tags.name} to the game");

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
            this.wrapped.setSize(${tags.width}, ${tags.height});
            
            var taskId = 0;
            ${tags.canSwim ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAISwimming", 1)(this));` : ''}
            ${tags.canPanic ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIPanic", 2)(this, ${tags.panicSpeed}));` : ''}
            ${tags.canMate ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIMate", 2)(this, ${tags.mateSpeed}));` : ''}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAITempt", 4)(this, 1.5, ModAPI.items["${tags.breedingItem}"]?.getRef() || ModAPI.items.wheat.getRef(), 0));
            ${tags.canFollowParent ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIFollowParent", 2)(this, ${tags.followParentSpeed}));` : ''}
            ${tags.canWander ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWander", 2)(this, ${tags.wanderSpeed}));` : ''}
            ${tags.canWatchPlayer ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWatchClosest", 3)(this, ModAPI.util.asClass(EntityPlayer.class), ${tags.watchDistance}));` : ''}
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
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.maxHealth).setBaseValue(${tags.maxHealth});
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${tags.movementSpeed});
        }

        const originalLivingUpdate = nme_CustomEntity.prototype.$onLivingUpdate;
        nme_CustomEntity.prototype.$onLivingUpdate = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            originalLivingUpdate.apply(this, []);
            ${tags.canSwim ? `
            if (this.wrapped.isInWater()) {
                this.wrapped.motionY *= 0.5;
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${tags.swimSpeed});
            } else {
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${tags.movementSpeed});
            }
            ` : ''}
            var $$entity = this.wrapped;
            ${livingUpdateHandler.code};
        }

        ${interactHandler}

        nme_CustomEntity.prototype.$getLivingSound = function () {
            return ModAPI.util.str("${tags.livingSound}");
        }
        nme_CustomEntity.prototype.$getHurtSound = function () {
            return ModAPI.util.str("${tags.hurtSound}");
        }
        nme_CustomEntity.prototype.$getDeathSound = function () {
            return ModAPI.util.str("${tags.deathSound}");
        }
        nme_CustomEntity.prototype.$playStepSound = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            this.wrapped.playSound(ModAPI.util.str("${tags.stepSound}"), ${tags.stepVolume}, 1);
        }
        nme_CustomEntity.prototype.$getDropItem = function () {
            return ModAPI.items["${tags.dropItem}"]?.getRef() || ModAPI.items.leather.getRef();
        }
        nme_CustomEntity.prototype.$createChild = function (otherParent) {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            return new nme_CustomEntity(this.wrapped.worldObj?.getRef() ?? null);
        }
        nme_CustomEntity.prototype.$isBreedingItem = function (itemstack) {
            var breedItem = ModAPI.items["${tags.breedingItem}"]?.getRef() || ModAPI.items.wheat.getRef();
            return itemstack !== null && itemstack.$getItem() === breedItem;
        }
        // END CUSTOM ENTITY

        // START CUSTOM MODEL
        var modelClass = ModAPI.reflect.getClassById("${modelMapping[tags.modelType]}");
        var modelSuper = ModAPI.reflect.getSuper(modelClass);
        
        var nmcm_CustomModel = function nmcm_CustomModel() {
            modelSuper(this);
        }
        ModAPI.reflect.prototypeStack(modelClass, nmcm_CustomModel);
        // END CUSTOM MODEL

        // START CUSTOM RENDERER
        var renderClass = ModAPI.reflect.getClassById("net.minecraft.client.renderer.entity.RenderLiving");
        var renderSuper = ModAPI.reflect.getSuper(renderClass, (x) => x.length === 4);
        const mobTextures = ResourceLocation(ModAPI.util.str("textures/entity/${tags.id}.png"));
        
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

        const ID = ModAPI.keygen.entity("${tags.id}");
        ModAPI.reflect.getClassById("net.minecraft.entity.EntityList").staticMethods.addMapping0.method(
            ModAPI.util.asClass(nme_CustomEntity),
            {
                $createEntity: function ($worldIn) {
                    return new nme_CustomEntity($worldIn);
                }
            },
            ModAPI.util.str("${tags.name}"),
            ID,
            ${tags.spawnEggBaseColor},
            ${tags.spawnEggSpotColor}
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
            
            ${tags.spawnInBiomes.map(biome => `
            const Biome_${biome} = ModAPI.util.wrap(
                ModAPI.reflect.getClassById("net.minecraft.world.biome.BiomeGenBase")
                    .staticVariables.${biomeMapping[biome]}
            );
            const spawnEntry_${biome} = SpawnListEntry(
                ModAPI.util.asClass(nme_CustomEntity), 
                ${tags.spawnWeight}, 
                ${tags.spawnMinGroup}, 
                ${tags.spawnMaxGroup}
            );
            Biome_${biome}.spawnableCreatureList.add(spawnEntry_${biome});
            `).join('\n')}
        });

        ModAPI.addEventListener("lib:asyncsink", async () => {
            AsyncSink.L10N.set("entity.${tags.name}.name", "${tags.name}");
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
        ${hasTexture ? `
        try {
            AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${tags.id}.png", await (await fetch(
                "${tags.texture}"
            )).arrayBuffer());
            AsyncSink.hideFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${tags.id}.png.mcmeta");
        } catch(e) {
            console.warn("Failed to load mob texture:", e);
        }
        ` : ''}

        await waitForRenderManager();

        ${hasIdleAudio ? `
        try {
            AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${tags.id}/idle.ogg", await (await fetch(
                "${tags.idleAudioFile}"
            )).arrayBuffer());
            AsyncSink.Audio.register("${tags.livingSound}", AsyncSink.Audio.Category.ANIMALS, [{
                path: "sounds/mob/${tags.id}/idle.ogg",
                pitch: 1,
                volume: 1,
                streaming: false
            }]);
        } catch(e) {
            console.warn("Failed to load idle sound:", e);
        }
        ` : ''}

        ${hasHurtAudio ? `
        try {
            AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${tags.id}/hurt.ogg", await (await fetch(
                "${tags.hurtAudioFile}"
            )).arrayBuffer());
            AsyncSink.Audio.register("${tags.hurtSound}", AsyncSink.Audio.Category.ANIMALS, [{
                path: "sounds/mob/${tags.id}/hurt.ogg",
                pitch: 1,
                volume: 1,
                streaming: false
            }]);
        } catch(e) {
            console.warn("Failed to load hurt sound:", e);
        }
        ` : ''}

        ${hasDeathAudio ? `
        try {
            AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${tags.id}/death.ogg", await (await fetch(
                "${tags.deathAudioFile}"
            )).arrayBuffer());
            AsyncSink.Audio.register("${tags.deathSound}", AsyncSink.Audio.Category.ANIMALS, [{
                path: "sounds/mob/${tags.id}/death.ogg",
                pitch: 1,
                volume: 1,
                streaming: false
            }]);
        } catch(e) {
            console.warn("Failed to load death sound:", e);
        }
        ` : ''}

        ${hasStepAudio ? `
        try {
            AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${tags.id}/step.ogg", await (await fetch(
                "${tags.stepAudioFile}"
            )).arrayBuffer());
            AsyncSink.Audio.register("${tags.stepSound}", AsyncSink.Audio.Category.ANIMALS, [{
                path: "sounds/mob/${tags.id}/step.ogg",
                pitch: 1,
                volume: 1,
                streaming: false
            }]);
        } catch(e) {
            console.warn("Failed to load step sound:", e);
        }
        ` : ''}

        try {
            ModAPI.mc.renderManager.entityRenderMap.put(ModAPI.util.asClass(data.EntityCustom), new data.RenderCustom(ModAPI.mc.renderManager.getRef(), new data.ModelCustom(), ${tags.shadowSize}));
            ModAPI.promisify(ModAPI.mc.renderEngine.bindTexture)(data.mobTextures).then(() => {
                console.log("Loaded ${tags.name} texture into cache.");
            });
        } catch(e) {
            console.warn("Failed to register renderer:", e);
        }
    });
})();`
    }
}
