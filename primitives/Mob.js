PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",

        // visuals
        texture: VALUE_ENUMS.IMG, // mob texture (entity)
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

        // spawn egg as a NORMAL item
        eggId: "custom_mob_spawn_egg",
        eggName: "Custom Mob Spawn Egg",
        eggTexture: VALUE_ENUMS.IMG, // item texture for the egg
        eggMaxStackSize: 64,
        eggCreativeTab: [
            "tabMisc",
            "tabBlock",
            "tabDecorations",
            "tabRedstone",
            "tabTransport",
            "tabAllSearch",
            "tabFood",
            "tabTools",
            "tabCombat",
            "tabBrewing",
            "tabMaterials",
            "tabInventory"
        ]
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const hasTexture = this.tags.texture && typeof this.tags.texture === "string" && this.tags.texture.startsWith("data:");
        const hasEggTexture = this.tags.eggTexture && typeof this.tags.eggTexture === "string" && this.tags.eggTexture.startsWith("data:");

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

        // vanilla-like sound keys for each model type
        const soundMapping = {
            "CHICKEN": {
                living: "mob.chicken.say",
                hurt: "mob.chicken.hurt",
                death: "mob.chicken.hurt",
                step: "mob.chicken.step",
                stepVolume: 0.15
            },
            "PIG": {
                living: "mob.pig.say",
                hurt: "mob.pig.say",
                death: "mob.pig.death",
                step: "mob.pig.step",
                stepVolume: 0.15
            },
            "COW": {
                living: "mob.cow.say",
                hurt: "mob.cow.hurt",
                death: "mob.cow.hurt",
                step: "mob.cow.step",
                stepVolume: 0.15
            },
            "SHEEP": {
                living: "mob.sheep.say",
                hurt: "mob.sheep.say",
                death: "mob.sheep.say",
                step: "mob.sheep.step",
                stepVolume: 0.15
            },
            "WOLF": {
                living: "mob.wolf.bark",
                hurt: "mob.wolf.hurt",
                death: "mob.wolf.death",
                step: "mob.wolf.step",
                stepVolume: 0.15
            },
            "ZOMBIE": {
                living: "mob.zombie.say",
                hurt: "mob.zombie.hurt",
                death: "mob.zombie.death",
                step: "mob.zombie.step",
                stepVolume: 0.15
            },
            "SKELETON": {
                living: "mob.skeleton.say",
                hurt: "mob.skeleton.hurt",
                death: "mob.skeleton.death",
                step: "mob.skeleton.step",
                stepVolume: 0.15
            },
            "SPIDER": {
                living: "mob.spider.say",
                hurt: "mob.spider.say",
                death: "mob.spider.death",
                step: "mob.spider.step",
                stepVolume: 0.15
            }
        };

        const modelClassId = modelMapping[this.tags.modelType] || "net.minecraft.client.model.ModelChicken";
        const sounds = soundMapping[this.tags.modelType] || soundMapping["CHICKEN"];

        const eggId = this.tags.eggId || (this.tags.id + "_spawn_egg");
        const eggName = this.tags.eggName || (this.tags.name + " Spawn Egg");

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

        // vanilla-like sounds for chosen model
        CustomEntity.prototype.$getLivingSound = function () {
            return ModAPI.util.str("${sounds.living}");
        };
        CustomEntity.prototype.$getHurtSound = function () {
            return ModAPI.util.str("${sounds.hurt}");
        };
        CustomEntity.prototype.$getDeathSound = function () {
            return ModAPI.util.str("${sounds.death}");
        };
        CustomEntity.prototype.$playStepSound = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.playSound(ModAPI.util.str("${sounds.step}"), ${sounds.stepVolume}, 1);
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
                ModAPI.util.str("${this.tags.id}"),
                ID,
                0, // egg colors unused now
                0
            );

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

(function SpawnEggDatablock() {
    const $$eggTexture = "${this.tags.eggTexture}";

    function $$ServersideItem() {
        const $$scoped_efb_globals = {};
        var $$itemClass = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        var $$itemSuper = ModAPI.reflect.getSuper($$itemClass, (x) => x.length === 1);

        function $$CustomItem() {
            $$itemSuper(this);
            // creative tab (same logic as items_creativetab)
            var tabName = "${this.tags.eggCreativeTab}";
            if (flags.target === "1_12") {
                tabName = tabName.replace("tab", "").toUpperCase();
            }
            this.$setCreativeTab(
                ModAPI.reflect.getClassById("net.minecraft.creativetab.CreativeTabs").staticVariables[tabName]
            );
            this.$maxStackSize = ${this.tags.eggMaxStackSize};
        }
        ModAPI.reflect.prototypeStack($$itemClass, $$CustomItem);

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
                        ModAPI.util.wrap($$newMob).setPosition($$pw.posX + 1, $$pw.posY, $$pw.posZ);
                        $$world.$spawnEntityInWorld($$newMob);
                        if (!$$pw.capabilities.$isCreativeMode) {
                            $$itemstack.$stackSize -= 1;
                        }
                    }
                } catch(e) {
                    console.warn("Spawn egg use failed for ${this.tags.id}:", e);
                }
            }
            return $$itemstack;
        };

        function $$internal_reg() {
            var $$custom_item = (new $$CustomItem()).$setUnlocalizedName(
                ModAPI.util.str("${eggId}")
            );
            $$itemClass.staticMethods.registerItem.method(
                ModAPI.keygen.item("${eggId}"),
                ModAPI.util.str("${eggId}"),
                $$custom_item
            );
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

        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${eggId}.json",
            JSON.stringify({
                "parent": "builtin/generated",
                "textures": {
                    "layer0": "items/${eggId}"
                }
            })
        );

        ${hasEggTexture ? `
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/textures/items/${eggId}.png",
            await (await fetch($$eggTexture)).arrayBuffer()
        );
        ` : ""}
    });
})();`;
    }
};
