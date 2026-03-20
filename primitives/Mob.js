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
        width: 0.9,
        height: 1.4,
        shadowSize: 0.5,

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

        // spawn egg colors (used when no custom egg texture is provided)
        spawnEggBaseColor: 0x5e3e2d,
        spawnEggSpotColor: 0x269166,

        // optional custom spawn egg texture (base64) - leave as VALUE_ENUMS.IMG to use color tint
        spawnEggTexture: VALUE_ENUMS.IMG,

        // spawning
        spawnInBiomes: ["plains", "forest", "swampland", "river", "beach"],
        spawnWeight: 10,
        spawnMinGroup: 2,
        spawnMaxGroup: 4,

        // sound keys (leave empty string to auto-generate from id)
        livingSound: "",
        hurtSound: "",
        deathSound: "",
        stepSound: "",
        stepVolume: 0.15,

        // audio files (base64)
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
        const hasEggTexture = this.tags.spawnEggTexture && typeof this.tags.spawnEggTexture === "string" && this.tags.spawnEggTexture.startsWith("data:");
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

        const modelClassId = modelMapping[this.tags.modelType] || "net.minecraft.client.model.ModelCow";

        const livingSound = this.tags.livingSound || `mob.${this.tags.id}.idle`;
        const hurtSound   = this.tags.hurtSound   || `mob.${this.tags.id}.hurt`;
        const deathSound  = this.tags.deathSound  || `mob.${this.tags.id}.death`;
        const stepSound   = this.tags.stepSound   || `mob.${this.tags.id}.step`;

        const eggId   = `${this.tags.id}_spawn_egg`;
        const eggName = `${this.tags.name} Spawn Egg`;

        return `(function MobDatablock() {

    // ── Shared helpers ──────────────────────────────────────────────────────
    function waitForRenderManager() {
        return new Promise((res) => {
            function check() {
                if (ModAPI.mc && ModAPI.mc.renderManager) res();
                else setTimeout(check, 50);
            }
            check();
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    // MOB: ${this.tags.name}  (${this.tags.id})
    // ══════════════════════════════════════════════════════════════════════
    function registerMob() {
        if (ModAPI.hooks && ModAPI.hooks.methods)
            ModAPI.hooks.methods.jl_String_format = ModAPI.hooks.methods.nlev_HString_format;

        function AITask(name, length) {
            return ModAPI.reflect.getClassById("net.minecraft.entity.ai." + name).constructors.find(x => x.length === length);
        }

        const ResourceLocation = ModAPI.reflect.getClassByName("ResourceLocation").constructors.find(x => x.length === 1);
        const EntityPlayer = ModAPI.reflect.getClassByName("EntityPlayer");
        const SharedMonsterAttributes = ModAPI.reflect.getClassByName("SharedMonsterAttributes").staticVariables;

        // ── Entity class ──────────────────────────────────────────────────
        var entityClass = ModAPI.reflect.getClassById("net.minecraft.entity.passive.EntityAnimal");
        var entitySuper = ModAPI.reflect.getSuper(entityClass, (x) => x.length === 2);

        var CustomEntity = function CustomEntity(worldIn) {
            entitySuper(this, worldIn);
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.setSize(${this.tags.width}, ${this.tags.height});

            var taskId = 0;
            ${this.tags.canSwim ? "this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAISwimming\", 1)(this));" : ""}
            ${this.tags.canPanic ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIPanic", 2)(this, ${this.tags.panicSpeed}));` : ""}
            ${this.tags.canMate  ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIMate", 2)(this, ${this.tags.mateSpeed}));` : ""}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAITempt", 4)(this, 1.5, (ModAPI.items["${this.tags.breedingItem}"] || ModAPI.items.wheat).getRef(), 0));
            ${this.tags.canFollowParent ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIFollowParent", 2)(this, ${this.tags.followParentSpeed}));` : ""}
            ${this.tags.canWander ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWander", 2)(this, ${this.tags.wanderSpeed}));` : ""}
            ${this.tags.canWatchPlayer ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWatchClosest", 3)(this, ModAPI.util.asClass(EntityPlayer.class), ${this.tags.watchDistance}));` : ""}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAILookIdle", 1)(this));
        };

        ModAPI.reflect.prototypeStack(entityClass, CustomEntity);

        CustomEntity.prototype.$getEyeHeight = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            return this.wrapped.height;
        };

        const origApplyEntityAttributes = CustomEntity.prototype.$applyEntityAttributes;
        CustomEntity.prototype.$applyEntityAttributes = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            origApplyEntityAttributes.apply(this, []);
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.maxHealth).setBaseValue(${this.tags.maxHealth});
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
        };

        const origLivingUpdate = CustomEntity.prototype.$onLivingUpdate;
        CustomEntity.prototype.$onLivingUpdate = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            origLivingUpdate.apply(this, []);
            ${this.tags.canSwim ? `
            if (this.wrapped.isInWater()) {
                this.wrapped.motionY *= 0.5;
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.swimSpeed});
            } else {
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
            }` : ""}
        };

        CustomEntity.prototype.$getLivingSound = function () { return ModAPI.util.str("${livingSound}"); };
        CustomEntity.prototype.$getHurtSound   = function () { return ModAPI.util.str("${hurtSound}"); };
        CustomEntity.prototype.$getDeathSound  = function () { return ModAPI.util.str("${deathSound}"); };
        CustomEntity.prototype.$playStepSound  = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.playSound(ModAPI.util.str("${stepSound}"), ${this.tags.stepVolume}, 1);
        };
        CustomEntity.prototype.$getDropItem = function () {
            return (ModAPI.items["${this.tags.dropItem}"] || ModAPI.items.leather).getRef();
        };
        CustomEntity.prototype.$createChild = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            return new CustomEntity(this.wrapped.worldObj ? this.wrapped.worldObj.getRef() : null);
        };
        CustomEntity.prototype.$isBreedingItem = function (itemstack) {
            var breedItem = (ModAPI.items["${this.tags.breedingItem}"] || ModAPI.items.wheat).getRef();
            return itemstack !== null && itemstack.$getItem() === breedItem;
        };

        // ── Model ─────────────────────────────────────────────────────────
        var modelClass = ModAPI.reflect.getClassById("${modelClassId}");
        var modelSuper = ModAPI.reflect.getSuper(modelClass);
        var CustomModel = function CustomModel() { modelSuper(this); };
        ModAPI.reflect.prototypeStack(modelClass, CustomModel);

        // ── Renderer ──────────────────────────────────────────────────────
        var renderClass = ModAPI.reflect.getClassById("net.minecraft.client.renderer.entity.RenderLiving");
        var renderSuper = ModAPI.reflect.getSuper(renderClass, (x) => x.length === 4);
        const mobTextures = ResourceLocation(ModAPI.util.str("textures/entity/${this.tags.id}.png"));
        var CustomRender = function CustomRender(rm, m, s) { renderSuper(this, rm, m, s); };
        ModAPI.reflect.prototypeStack(renderClass, CustomRender);
        CustomRender.prototype.$getEntityTexture = function () { return mobTextures; };

        // ── Registration ──────────────────────────────────────────────────
        var ID = ModAPI.keygen.entity("${this.tags.id}");
        ModAPI.reflect.getClassById("net.minecraft.entity.EntityList")
            .staticMethods.addMapping0.method(
                ModAPI.util.asClass(CustomEntity),
                { $createEntity: function (w) { return new CustomEntity(w); } },
                ModAPI.util.str("${this.tags.name}"),
                ID,
                ${this.tags.spawnEggBaseColor},
                ${this.tags.spawnEggSpotColor}
            );

        const SpawnPlacementType = ModAPI.reflect.getClassById("net.minecraft.entity.EntityLiving$SpawnPlacementType").staticVariables;
        const ENTITY_PLACEMENTS = ModAPI.util.wrap(
            ModAPI.reflect.getClassById("net.minecraft.entity.EntitySpawnPlacementRegistry").staticVariables.ENTITY_PLACEMENTS
        );
        ENTITY_PLACEMENTS.put(ModAPI.util.asClass(CustomEntity), SpawnPlacementType.ON_GROUND);

        ModAPI.addEventListener("bootstrap", () => {
            const SpawnListEntry = ModAPI.reflect
                .getClassById("net.minecraft.world.biome.BiomeGenBase$SpawnListEntry")
                .constructors.find(x => x.length === 4);
            ${this.tags.spawnInBiomes.map(biome => biomeMapping[biome] ? `
            const Biome_${biome} = ModAPI.util.wrap(
                ModAPI.reflect.getClassById("net.minecraft.world.biome.BiomeGenBase").staticVariables.${biomeMapping[biome]}
            );
            Biome_${biome}.spawnableCreatureList.add(SpawnListEntry(
                ModAPI.util.asClass(CustomEntity), ${this.tags.spawnWeight}, ${this.tags.spawnMinGroup}, ${this.tags.spawnMaxGroup}
            ));` : "").join("")}
        });

        ModAPI.addEventListener("lib:asyncsink", () => {
            AsyncSink.L10N.set("entity.${this.tags.id}.name", "${this.tags.name}");
        });

        return { CustomEntity, CustomModel, CustomRender, mobTextures };
    }

    ModAPI.dedicatedServer.appendCode(registerMob);
    var mobData = registerMob();

    ModAPI.addEventListener("lib:asyncsink", async () => {
        ${hasTexture ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${this.tags.id}.png",
                await (await fetch("${this.tags.texture}")).arrayBuffer()
            );
            AsyncSink.hideFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${this.tags.id}.png.mcmeta");
        } catch (e) { console.warn("Failed to load mob texture for ${this.tags.id}:", e); }
        ` : ""}

        ${hasIdleAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/idle.ogg",
                await (await fetch("${this.tags.idleAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${livingSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/idle.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch (e) {}
        ` : ""}
        ${hasHurtAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/hurt.ogg",
                await (await fetch("${this.tags.hurtAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${hurtSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/hurt.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch (e) {}
        ` : ""}
        ${hasDeathAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/death.ogg",
                await (await fetch("${this.tags.deathAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${deathSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/death.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch (e) {}
        ` : ""}
        ${hasStepAudio ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/${this.tags.id}/step.ogg",
                await (await fetch("${this.tags.stepAudioFile}")).arrayBuffer()
            );
            AsyncSink.Audio.register("${stepSound}", AsyncSink.Audio.Category.ANIMALS, [
                { path: "sounds/mob/${this.tags.id}/step.ogg", pitch: 1, volume: 1, streaming: false }
            ]);
        } catch (e) {}
        ` : ""}

        await waitForRenderManager();
        try {
            ModAPI.mc.renderManager.entityRenderMap.put(
                ModAPI.util.asClass(mobData.CustomEntity),
                new mobData.CustomRender(ModAPI.mc.renderManager.getRef(), new mobData.CustomModel(), ${this.tags.shadowSize})
            );
            await ModAPI.promisify(ModAPI.mc.renderEngine.bindTexture)(mobData.mobTextures);
        } catch (e) { console.warn("Failed to register renderer for ${this.tags.id}:", e); }
    });

    // ══════════════════════════════════════════════════════════════════════
    // SPAWN EGG ITEM: ${eggName}  (${eggId})
    // Registered as a normal item — usable in crafting recipes and furnace
    // recipes just like any other item, e.g. result: "item/${eggId}"
    // ══════════════════════════════════════════════════════════════════════
    function registerSpawnEgg() {
        var $$itemClass = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        var $$itemSuper = ModAPI.reflect.getSuper($$itemClass, (x) => x.length === 1);

        function $$SpawnEggItem() {
            $$itemSuper(this);
        }
        ModAPI.reflect.prototypeStack($$itemClass, $$SpawnEggItem);

        $$SpawnEggItem.prototype.$onItemRightClick = function ($$itemstack, $$world, $$player) {
            if (!$$world.$isRemote) {
                try {
                    var $$newMob = ModAPI.reflect
                        .getClassById("net.minecraft.entity.EntityList")
                        .staticMethods.createEntityByName.method(
                            ModAPI.util.str("${this.tags.name}"), $$world
                        );
                    if ($$newMob) {
                        var $$pw = ModAPI.util.wrap($$player);
                        ModAPI.util.wrap($$newMob).setPosition($$pw.posX + 1, $$pw.posY, $$pw.posZ);
                        $$world.$spawnEntityInWorld($$newMob);
                        if (!$$pw.capabilities.$isCreativeMode) {
                            $$itemstack.$stackSize -= 1;
                        }
                    }
                } catch (e) { console.warn("Spawn egg use failed for ${this.tags.id}:", e); }
            }
            return $$itemstack;
        };

        function $$internalReg() {
            var $$egg = (new $$SpawnEggItem()).$setUnlocalizedName(ModAPI.util.str("${eggId}"));
            $$itemClass.staticMethods.registerItem.method(
                ModAPI.keygen.item("${eggId}"),
                ModAPI.util.str("${eggId}"),
                $$egg
            );
            ModAPI.items["${eggId}"] = $$egg;
            return $$egg;
        }

        if (ModAPI.items) return $$internalReg();
        else ModAPI.addEventListener("bootstrap", $$internalReg);
    }

    ModAPI.dedicatedServer.appendCode(registerSpawnEgg);
    var $$egg_item = registerSpawnEgg();

    ModAPI.addEventListener("lib:asyncsink", async () => {
        ModAPI.addEventListener("lib:asyncsink:registeritems", ($$renderItem) => {
            $$renderItem.registerItem($$egg_item, ModAPI.util.str("${eggId}"));
        });
        AsyncSink.L10N.set("item.${eggId}.name", "${eggName}");

        ${hasEggTexture ? `
        // Custom egg texture supplied
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${eggId}.json",
            JSON.stringify({
                "parent": "builtin/generated",
                "textures": { "layer0": "items/${eggId}" },
                "display": {
                    "thirdperson": { "rotation": [-90,0,0], "translation": [0,1,-3], "scale": [0.55,0.55,0.55] },
                    "firstperson": { "rotation": [0,-135,25], "translation": [0,4,2], "scale": [1.7,1.7,1.7] }
                }
            })
        );
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/textures/items/${eggId}.png",
            await (await fetch("${this.tags.spawnEggTexture}")).arrayBuffer()
        );
        ` : `
        // No custom texture — reuse vanilla spawn_egg layers tinted by the mob's egg colors
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${eggId}.json",
            JSON.stringify({
                "parent": "builtin/generated",
                "textures": { "layer0": "items/spawn_egg", "layer1": "items/spawn_egg_overlay" },
                "display": {
                    "thirdperson": { "rotation": [-90,0,0], "translation": [0,1,-3], "scale": [0.55,0.55,0.55] },
                    "firstperson": { "rotation": [0,-135,25], "translation": [0,4,2], "scale": [1.7,1.7,1.7] }
                }
            })
        );
        `}
    });

})();`;
    }
};
