PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",

        // visuals
        texture: VALUE_ENUMS.IMG,
        modelType: ["CHICKEN", "PIG", "COW", "SHEEP", "WOLF", "ZOMBIE", "SKELETON", "SPIDER", "CREEPER"],
        width: 0.4,
        height: 0.7,
        shadowSize: 0.3,

        // attributes
        maxHealth: 10,
        movementSpeed: 0.25,
        swimSpeed: 1.4,
        glideSpeed: 1.0,          // 1.0 = normal fall, <1 slower, >1 faster

        // riding
        canBeRidden: false,

        // spider climbing
        spiderClimbSpeed: 0.3,    // only used when modelType === "SPIDER"

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

        // sound keys (can be overridden, but default to vanilla per model)
        livingSound: "",
        hurtSound: "",
        deathSound: "",
        stepSound: "",
        stepVolume: 0.15,

        // audio files (base64) - optional overrides
        idleAudioFile: VALUE_ENUMS.FILE,
        hurtAudioFile: VALUE_ENUMS.FILE,
        deathAudioFile: VALUE_ENUMS.FILE,
        stepAudioFile: VALUE_ENUMS.FILE,

        // spawn item texture (base64 IMG) - behaves like a normal item
        spawnItemTexture: VALUE_ENUMS.IMG
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const hasTexture = this.tags.texture && typeof this.tags.texture === "string" && this.tags.texture.startsWith("data:");
        const hasSpawnItemTexture = this.tags.spawnItemTexture && typeof this.tags.spawnItemTexture === "string" && this.tags.spawnItemTexture.startsWith("data:");
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
            "SPIDER": "net.minecraft.client.model.ModelSpider",
            "CREEPER": "net.minecraft.client.model.ModelCreeper"
        };

        // vanilla-like presets per model
        const modelPresets = {
            "CHICKEN": {
                livingSound: "mob.chicken.say",
                hurtSound: "mob.chicken.hurt",
                deathSound: "mob.chicken.hurt",
                stepSound: "mob.chicken.step",
                dropItem: "chicken",
                breedingItem: "seeds"
            },
            "PIG": {
                livingSound: "mob.pig.say",
                hurtSound: "mob.pig.say",
                deathSound: "mob.pig.death",
                stepSound: "mob.pig.step",
                dropItem: "porkchop",
                breedingItem: "carrot"
            },
            "COW": {
                livingSound: "mob.cow.say",
                hurtSound: "mob.cow.hurt",
                deathSound: "mob.cow.hurt",
                stepSound: "mob.cow.step",
                dropItem: "beef",
                breedingItem: "wheat"
            },
            "SHEEP": {
                livingSound: "mob.sheep.say",
                hurtSound: "mob.sheep.say",
                deathSound: "mob.sheep.say",
                stepSound: "mob.sheep.step",
                dropItem: "mutton",
                breedingItem: "wheat"
            },
            "WOLF": {
                livingSound: "mob.wolf.bark",
                hurtSound: "mob.wolf.hurt",
                deathSound: "mob.wolf.death",
                stepSound: "mob.wolf.step",
                dropItem: "bone",
                breedingItem: "beef"
            },
            "ZOMBIE": {
                livingSound: "mob.zombie.say",
                hurtSound: "mob.zombie.hurt",
                deathSound: "mob.zombie.death",
                stepSound: "mob.zombie.step",
                dropItem: "rotten_flesh"
            },
            "SKELETON": {
                livingSound: "mob.skeleton.say",
                hurtSound: "mob.skeleton.hurt",
                deathSound: "mob.skeleton.death",
                stepSound: "mob.skeleton.step",
                dropItem: "bone",
                heldItem: "bow"
            },
            "SPIDER": {
                livingSound: "mob.spider.say",
                hurtSound: "mob.spider.say",
                deathSound: "mob.spider.death",
                stepSound: "mob.spider.step",
                dropItem: "string"
            },
            "CREEPER": {
                livingSound: "mob.creeper.say",
                hurtSound: "mob.creeper.say",
                deathSound: "mob.creeper.death",
                stepSound: "mob.creeper.step",
                dropItem: "gunpowder"
            }
        };

        const preset = modelPresets[this.tags.modelType] || {};
        const modelClassId = modelMapping[this.tags.modelType] || "net.minecraft.client.model.ModelChicken";

        const livingSound = this.tags.livingSound || preset.livingSound || "mob.custom.idle";
        const hurtSound = this.tags.hurtSound || preset.hurtSound || "mob.custom.hurt";
        const deathSound = this.tags.deathSound || preset.deathSound || "mob.custom.death";
        const stepSound = this.tags.stepSound || preset.stepSound || "mob.custom.step";
        const dropItemId = this.tags.dropItem || preset.dropItem || "leather";
        const breedingItemId = this.tags.breedingItem || preset.breedingItem || "wheat";
        const heldItemId = preset.heldItem || null;

        const eggId = this.tags.id + "_spawn_item";
        const eggName = this.tags.name + " Spawn Item";

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
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAITempt", 4)(this, 1.5, (ModAPI.items["${breedingItemId}"] || ModAPI.items.wheat).getRef(), 0));
            ${this.tags.canFollowParent ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIFollowParent", 2)(this, ${this.tags.followParentSpeed}));` : ''}
            ${this.tags.canWander ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWander", 2)(this, ${this.tags.wanderSpeed}));` : ''}
            ${this.tags.canWatchPlayer ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWatchClosest", 3)(this, ModAPI.util.asClass(EntityPlayer.class), ${this.tags.watchDistance}));` : ''}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAILookIdle", 1)(this));

            ${heldItemId ? `
            try {
                var ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
                var held = new ItemStack((ModAPI.items["${heldItemId}"] || ModAPI.items.stick).getRef(), 1, 0);
                this.wrapped.setCurrentItemOrArmor(0, held);
            } catch(e) {
                console.warn("Failed to set held item for ${this.tags.id}:", e);
            }
            ` : ''}
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

            // swimming
            ${this.tags.canSwim ? `
            if (this.wrapped.isInWater()) {
                this.wrapped.motionY *= 0.5;
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.swimSpeed});
            } else {
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
            }
            ` : ''}

            // glide control
            if (!this.wrapped.onGround && !this.wrapped.isInWater() && this.wrapped.motionY < 0) {
                this.wrapped.motionY *= ${this.tags.glideSpeed};
            }

            // spider climbing
            ${this.tags.modelType === "SPIDER" ? `
            if (this.wrapped.isCollidedHorizontally) {
                this.wrapped.motionY = ${this.tags.spiderClimbSpeed};
            }
            ` : ''}
        };

        // riding
        CustomEntity.prototype.$interact = function (player) {
            ${this.tags.canBeRidden ? `
            try {
                var pw = ModAPI.util.wrap(player);
                pw.mountEntity(this.wrapped);
                return true;
            } catch(e) {
                console.warn("Ride interaction failed for ${this.tags.id}:", e);
            }
            ` : ''}
            return false;
        };

        // middle-click pick result -> custom spawn item
        CustomEntity.prototype.$getPickedResult = function (hit) {
            return (ModAPI.items["${eggId}"] || ModAPI.items.spawn_egg)?.getRef() || null;
        };

        CustomEntity.prototype.$getLivingSound = function () {
            return ModAPI.util.str("${livingSound}");
        };
        CustomEntity.prototype.$getHurtSound = function () {
            return ModAPI.util.str("${hurtSound}");
        };
        CustomEntity.prototype.$getDeathSound = function () {
            return ModAPI.util.str("${deathSound}");
        };
        CustomEntity.prototype.$playStepSound = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.playSound(ModAPI.util.str("${stepSound}"), ${this.tags.stepVolume}, 1);
        };
        CustomEntity.prototype.$getDropItem = function () {
            return (ModAPI.items["${dropItemId}"] || ModAPI.items.leather).getRef();
        };
        CustomEntity.prototype.$createChild = function (otherParent) {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            return new CustomEntity(this.wrapped.worldObj ? this.wrapped.worldObj.getRef() : null);
        };
        CustomEntity.prototype.$isBreedingItem = function (itemstack) {
            var breedItem = (ModAPI.items["${breedingItemId}"] || ModAPI.items.wheat).getRef();
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
        // chicken wing / falling animation tweak (duck-style)
        CustomRender.prototype.$handleRotationFloat = function (entity, partialTicks) {
            entity = ModAPI.util.wrap(entity);
            if ((!entity.onGround) && (!entity.isInWater())) {
                return 2;
            } else {
                return 0;
            }
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
                0x000000,
                0xFFFFFF
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

        // no biome spawning here (purely spawn-item based)

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
            AsyncSink.Audio.register("${livingSound}", AsyncSink.Audio.Category.ANIMALS, [
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
            AsyncSink.Audio.register("${hurtSound}", AsyncSink.Audio.Category.ANIMALS, [
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
            AsyncSink.Audio.register("${deathSound}", AsyncSink.Audio.Category.ANIMALS, [
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
            AsyncSink.Audio.register("${stepSound}", AsyncSink.Audio.Category.ANIMALS, [
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
})();
(function SpawnItemDatablock() {
    const $$itemTexture = "${this.tags.spawnItemTexture}";

    function $$ServersideItem() {
        const $$scoped_efb_globals = {};
        var $$itemClass = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        var $$itemSuper = ModAPI.reflect.getSuper($$itemClass, (x) => x.length === 1);

        function $$CustomItem() {
            $$itemSuper(this);
        }
        ModAPI.reflect.prototypeStack($$itemClass, $$CustomItem);

        // right click: spawn mob at clicked block
        $$CustomItem.prototype.$onItemRightClick = function ($$itemstack, $$world, $$player) {
            if (!$$world.$isRemote) {
                try {
                    var $$newMob = ModAPI.reflect
                        .getClassById("net.minecraft.entity.EntityList")
                        .staticMethods.createEntityByName.method(
                            ModAPI.util.str("${this.tags.id}"), $$world
                        );
                    if ($$newMob) {
                        var $$pw = ModAPI.util.wrap($$player);
                        var hit = $$pw.rayTrace(5.0, 1.0);
                        if (hit && hit.$typeOfHit === "BLOCK") {
                            var pos = hit.$getBlockPos();
                            ModAPI.util.wrap($$newMob).setPosition(
                                pos.$getX() + 0.5,
                                pos.$getY() + 1,
                                pos.$getZ() + 0.5
                            );
                        } else {
                            ModAPI.util.wrap($$newMob).setPosition($$pw.posX, $$pw.posY, $$pw.posZ);
                        }
                        $$world.$spawnEntityInWorld($$newMob);
                        if (!$$pw.capabilities.$isCreativeMode) {
                            $$itemstack.$stackSize -= 1;
                        }
                    }
                } catch(e) {
                    console.warn("Spawn item use failed for ${this.tags.id}:", e);
                }
            }
            return $$itemstack;
        };

        function $$internal_reg() {
            var $$custom_item = (new $$CustomItem()).$setUnlocalizedName(
                ModAPI.util.str("${eggId}")
            );
            $$itemClass.staticMethods.registerItem.method(ModAPI.keygen.item("${eggId}"), ModAPI.util.str("${eggId}"), $$custom_item);
            ModAPI.items["${eggId}"] = $$custom_item;
            return $$custom_item;
        }
        if (ModAPI.items) {
            return $$internal_reg();
        } else {
            ModAPI.addEventListener("bootstrap", $$internal_reg);
        }
    }

    ModAPI.dedicatedServer.appendCode($$ServersideItem);
    var $$custom_item = $$ServersideItem();

    ModAPI.addEventListener("lib:asyncsink", async () => {
        ModAPI.addEventListener("lib:asyncsink:registeritems", ($$renderItem) => {
            $$renderItem.registerItem($$custom_item, ModAPI.util.str("${eggId}"));
        });
        AsyncSink.L10N.set("item.${eggId}.name", "${eggName}");
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${eggId}.json", JSON.stringify(
            {
                "parent": "builtin/generated",
                "textures": {
                    "layer0": "items/${eggId}"
                },
                "display": {
                    "thirdperson": { "rotation": [-90, 0, 0], "translation": [0, 1, -3], "scale": [0.55, 0.55, 0.55] },
                    "firstperson": { "rotation": [0, -135, 25], "translation": [0, 4, 2], "scale": [1.7, 1.7, 1.7] }
                }
            }
        ));
        ${hasSpawnItemTexture ? `
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/items/${eggId}.png", await (await fetch(
            $$itemTexture
        )).arrayBuffer());
        ` : ""}
    });
})();`;
    }
};
