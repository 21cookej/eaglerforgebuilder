PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",

        // visuals
        texture: VALUE_ENUMS.IMG,
        modelType: ["CHICKEN", "PIG", "COW", "SHEEP", "WOLF", "ZOMBIE", "SKELETON", "SPIDER"],
        width: 0.4,
        height: 0.7,
        shadowSize: 0.3,

        // attributes
        maxHealth: 10,
        movementSpeed: 0.25,
        swimSpeed: 1.4,

        // AI toggles
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

        // items
        breedingItem: "wheat",
        dropItem: "leather",

        // egg colors
        spawnEggBaseColor: 0x5e3e2d,
        spawnEggSpotColor: 0x269166,

        // spawning
        spawnInBiomes: ["plains", "forest", "swampland", "river", "beach"],
        spawnWeight: 10,
        spawnMinGroup: 2,
        spawnMaxGroup: 4,

        // sound keys
        livingSound: "mob.custom.idle",
        hurtSound: "mob.custom.hurt",
        deathSound: "mob.custom.death",
        stepSound: "mob.custom.step",
        stepVolume: 0.15,

        // files (base64)
        idleAudioFile: VALUE_ENUMS.AUDIO,
        hurtAudioFile: VALUE_ENUMS.AUDIO,
        deathAudioFile: VALUE_ENUMS.AUDIO,
        stepAudioFile: VALUE_ENUMS.AUDIO
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const hasTexture = this.tags.texture && typeof this.tags.texture === "string" && this.tags.texture.startsWith("data:");
        const hasIdleAudio = this.tags.idleAudioFile && typeof this.tags.idleAudioFile === "string" && this.tags.idleAudioFile.startsWith("data:");
        const hasHurtAudio = this.tags.hurtAudioFile && typeof this.tags.hurtAudioFile === "string" && this.tags.hurtAudioFile.startsWith("data:");
        const hasDeathAudio = this.tags.deathAudioFile && typeof this.tags.deathAudioFile === "string" && this.tags.deathAudioFile.startsWith("data:");
        const hasStepAudio = this.tags.stepAudioFile && typeof this.tags.stepAudioFile === "string" && this.tags.stepAudioFile.startsWith("data:");

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

        const biomeMapping = {
            "plains": "plains",
            "desert": "desert",
            "forest": "forest",
            "taiga": "taiga",
            "swampland": "swampland",
            "river": "river",
            "beach": "beach",
            "jungle": "jungle"
        };

        const modelClassId = modelMapping[this.tags.modelType] || "net.minecraft.client.model.ModelChicken";

        return `(function CustomMobDatablock() {
    function waitForRenderManager() {
        return new Promise((res) => {
            function check() {
                if (ModAPI.mc && ModAPI.mc.renderManager) {
                    res();
                } else {
                    setTimeout(check, 50);
                }
            }
            check();
        });
    }

    function registerEntity() {
        // same workaround as Duck mod
        if (ModAPI.hooks && ModAPI.hooks.methods) {
            ModAPI.hooks.methods.jl_String_format = ModAPI.hooks.methods.nlev_HString_format;
        }

        function AITask(name, length) {
            return ModAPI.reflect
                .getClassById("net.minecraft.entity.ai." + name)
                .constructors.find(x => x.length === length);
        }

        const ResourceLocation = ModAPI.reflect
            .getClassByName("ResourceLocation")
            .constructors.find(x => x.length === 1);
        const EntityPlayer = ModAPI.reflect.getClassByName("EntityPlayer");
        const SharedMonsterAttributes = ModAPI.reflect
            .getClassByName("SharedMonsterAttributes")
            .staticVariables;

        // ==== ENTITY CLASS ====
        var entityClass = ModAPI.reflect.getClassById("net.minecraft.entity.passive.EntityAnimal");
        var entitySuper = ModAPI.reflect.getSuper(entityClass, (x) => x.length === 2);

        var CustomEntity = function CustomEntity(worldIn) {
            entitySuper(this, worldIn);
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.setSize(${this.tags.width}, ${this.tags.height});

            var taskId = 0;
            ${this.tags.canSwim ? 'this.wrapped.tasks.addTask(taskId++, AITask("EntityAISwimming", 1)(this));' : ''}
            ${this.tags.canPanic ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIPanic", 2)(this, ${this.tags.panicSpeed}));` : ''}
            ${this.tags.canMate ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIMate", 2)(this, ${this.tags.mateSpeed}));` : ''}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAITempt", 4)(this, 1.5, (ModAPI.items["${this.tags.breedingItem}"] || ModAPI.items.wheat).getRef(), 0));
            ${this.tags.canFollowParent ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIFollowParent", 2)(this, ${this.tags.followParentSpeed}));` : ''}
            ${this.tags.canWander ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWander", 2)(this, ${this.tags.wanderSpeed}));` : ''}
            ${this.tags.canWatchPlayer ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWatchClosest", 3)(this, ModAPI.util.asClass(EntityPlayer.class), ${this.tags.watchDistance}));` : ''}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAILookIdle", 1)(this));
        };

        ModAPI.reflect.prototypeStack(entityClass, CustomEntity);

        CustomEntity.prototype.$getEyeHeight = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            return this.wrapped.height;
        };

        const originalApplyEntityAttributes = CustomEntity.prototype.$applyEntityAttributes;
        CustomEntity.prototype.$applyEntityAttributes = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            originalApplyEntityAttributes.apply(this, []);
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.maxHealth).setBaseValue(${this.tags.maxHealth});
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
        };

        const originalLivingUpdate = CustomEntity.prototype.$onLivingUpdate;
        CustomEntity.prototype.$onLivingUpdate = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            originalLivingUpdate.apply(this, []);
            ${this.tags.canSwim ? `
            if (this.wrapped.isInWater()) {
                this.wrapped.motionY *= 0.5;
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.swimSpeed});
            } else {
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
            }
            ` : ''}
        };

        CustomEntity.prototype.$getLivingSound = function () {
            return ModAPI.util.str("${this.tags.livingSound}");
        };
        CustomEntity.prototype.$getHurtSound = function () {
            return ModAPI.util.str("${this.tags.hurtSound}");
        };
        CustomEntity.prototype.$getDeathSound = function () {
            return ModAPI.util.str("${this.tags.deathSound}");
        };
        CustomEntity.prototype.$playStepSound = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.playSound(ModAPI.util.str("${this.tags.stepSound}"), ${this.tags.stepVolume}, 1);
        };
        CustomEntity.prototype.$getDropItem = function () {
            return (ModAPI.items["${this.tags.dropItem}"] || ModAPI.items.leather).getRef();
        };
        CustomEntity.prototype.$createChild = function (otherParent) {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            return new CustomEntity(this.wrapped.worldObj ? this.wrapped.worldObj.getRef() : null);
        };
        CustomEntity.prototype.$isBreedingItem = function (itemstack) {
            var breedItem = (ModAPI.items["${this.tags.breedingItem}"] || ModAPI.items.wheat).getRef();
            return itemstack !== null && itemstack.$getItem() === breedItem;
        };

        // ==== MODEL ====
        var modelClass = ModAPI.reflect.getClassById("${modelClassId}");
        var modelSuper = ModAPI.reflect.getSuper(modelClass);
        var CustomModel = function CustomModel() {
            modelSuper(this);
        };
        ModAPI.reflect.prototypeStack(modelClass, CustomModel);

        // ==== RENDERER ====
        var renderClass = ModAPI.reflect.getClassById("net.minecraft.client.renderer.entity.RenderLiving");
        var renderSuper = ModAPI.reflect.getSuper(renderClass, (x) => x.length === 4);
        const mobTextures = ResourceLocation(ModAPI.util.str("textures/entity/${this.tags.id}.png"));

        var CustomRender = function CustomRender(renderManager, modelBaseIn, shadowSizeIn) {
            renderSuper(this, renderManager, modelBaseIn, shadowSizeIn);
        };
        ModAPI.reflect.prototypeStack(renderClass, CustomRender);
        CustomRender.prototype.$getEntityTexture = function () {
            return mobTextures;
        };

        // ==== ENTITY REGISTRATION ====
        var ID = ModAPI.keygen.entity("${this.tags.id}");
        ModAPI.reflect
            .getClassById("net.minecraft.entity.EntityList")
            .staticMethods.addMapping0.method(
                ModAPI.util.asClass(CustomEntity),
                { $createEntity: function (w) { return new CustomEntity(w); } },
                ModAPI.util.str("${this.tags.name}"),
                ID,
                ${this.tags.spawnEggBaseColor},
                ${this.tags.spawnEggSpotColor}
            );

        // spawn placement
        const SpawnPlacementType = ModAPI.reflect
            .getClassById("net.minecraft.entity.EntityLiving$SpawnPlacementType")
            .staticVariables;
        const ENTITY_PLACEMENTS = ModAPI.util.wrap(
            ModAPI.reflect
                .getClassById("net.minecraft.entity.EntitySpawnPlacementRegistry")
                .staticVariables.ENTITY_PLACEMENTS
        );
        ENTITY_PLACEMENTS.put(ModAPI.util.asClass(CustomEntity), SpawnPlacementType.ON_GROUND);

        // biome spawning (Duck-style)
        ModAPI.addEventListener("bootstrap", () => {
            const SpawnListEntry = ModAPI.reflect
                .getClassById("net.minecraft.world.biome.BiomeGenBase$SpawnListEntry")
                .constructors.find(x => x.length === 4);

            ${this.tags.spawnInBiomes.map(biome =>
                biomeMapping[biome] ? `
            const Biome_${biome} = ModAPI.util.wrap(
                ModAPI.reflect
                    .getClassById("net.minecraft.world.biome.BiomeGenBase")
                    .staticVariables.${biomeMapping[biome]}
            );
            Biome_${biome}.spawnableCreatureList.add(
                SpawnListEntry(
                    ModAPI.util.asClass(CustomEntity),
                    ${this.tags.spawnWeight},
                    ${this.tags.spawnMinGroup},
                    ${this.tags.spawnMaxGroup}
                )
            );
            ` : ""
            ).join("")}
        });

        // localization key
        ModAPI.addEventListener("lib:asyncsink", () => {
            AsyncSink.L10N.set("entity.${this.tags.id}.name", "${this.tags.name}");
        });

        return { CustomEntity, CustomModel, CustomRender, mobTextures };
    }

    ModAPI.dedicatedServer.appendCode(registerEntity);
    var data = registerEntity();

    // ==== RESOURCES & RENDER MAP ====
    ModAPI.addEventListener("lib:asyncsink", async () => {
        ${hasTexture ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${this.tags.id}.png",
                await (await fetch("${this.tags.texture}")).arrayBuffer()
            );
            AsyncSink.hideFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${this.tags.id}.png.mcmeta");
        } catch(e) {
            console.warn("Failed to load texture for ${this.tags.id}:", e);
        }
        ` : ""}

        await waitForRenderManager();

        ${hasIdleAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/idle.ogg",
                await (await fetch("${this.tags.idleAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${this.tags.livingSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/idle.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch(e) {}
        ` : ""}

        ${hasHurtAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/hurt.ogg",
                await (await fetch("${this.tags.hurtAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${this.tags.hurtSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/hurt.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch(e) {}
        ` : ""}

        ${hasDeathAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/death.ogg",
                await (await fetch("${this.tags.deathAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${this.tags.deathSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/death.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch(e) {}
        ` : ""}

        ${hasStepAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/step.ogg",
                await (await fetch("${this.tags.stepAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${this.tags.stepSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/step.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch(e) {}
        ` : ""}

        try {
            ModAPI.mc.renderManager.entityRenderMap.put(
                ModAPI.util.asClass(data.CustomEntity),
                new data.CustomRender(
                    ModAPI.mc.renderManager.getRef(),
                    new data.CustomModel(),
                    ${this.tags.shadowSize}
                )
            );
            await ModAPI.promisify(ModAPI.mc.renderEngine.bindTexture)(data.mobTextures);
        } catch(e) {
            console.warn("Failed to register renderer for ${this.tags.id}:", e);
        }
    });
})();`;
    }
};
