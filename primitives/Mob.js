PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",

        // ==== GENERIC VISUALS ====
        texture: VALUE_ENUMS.IMG,
        modelType: ["CHICKEN", "PIG", "COW", "SHEEP", "WOLF", "ZOMBIE", "SKELETON", "SPIDER", "CREEPER"],
        width: 0.6,
        height: 1.8,
        shadowSize: 0.3,

        // ==== GENERIC BEHAVIOUR ====
        isPassive: true,          // true = passive, false = hostile
        canBreed: true,

        maxHealth: 20,
        movementSpeed: 0.25,
        swimSpeed: 1.4,
        glideSpeed: 1.0,          // 1.0 = vanilla fall, <1 slower, >1 faster

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

        // generic items
        breedingItem: "wheat",
        dropItem: "leather",

        // sounds (defaulted per model if empty)
        livingSound: "",
        hurtSound: "",
        deathSound: "",
        stepSound: "",
        stepVolume: 0.15,

        // audio overrides
        idleAudioFile: VALUE_ENUMS.FILE,
        hurtAudioFile: VALUE_ENUMS.FILE,
        deathAudioFile: VALUE_ENUMS.FILE,
        stepAudioFile: VALUE_ENUMS.FILE,

        // vanilla spawn egg colors
        eggBaseColor: 0xC1C1C1,
        eggSpotColor: 0x494949,

        // ==== SKELETON SECTION ====
        skeletonHeldItem: "bow",  // item id to hold in hand

        // ==== SPIDER SECTION ====
        spiderClimbSpeed: 0.3,

        // ==== SHEEP SECTION ====
        sheepGrazingBlock: "grass",      // block eaten
        sheepGrazingResultBlock: "dirt", // block it becomes
        sheepCanBeSheared: true,
        sheepShearDrop: "wool",
        sheepShearDropCount: 1,
        sheepEatGroundTime: 40,          // ticks between eating

        // ==== COW SECTION ====
        cowMilkingItem: "bucket",        // item used to milk
        cowMilkResultItem: "milk_bucket",// item given to player
        cowMilkCooldown: 200,            // ticks between milks

        // ==== CREEPER SECTION ====
        creeperFuseTime: 30,             // ticks
        creeperExplosionPower: 3         // TNT = 4
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const hasTexture = this.tags.texture && typeof this.tags.texture === "string" && this.tags.texture.startsWith("data:");
        const hasIdleAudio = this.tags.idleAudioFile && this.tags.idleAudioFile.startsWith("data:");
        const hasHurtAudio = this.tags.hurtAudioFile && this.tags.hurtAudioFile.startsWith("data:");
        const hasDeathAudio = this.tags.deathAudioFile && this.tags.deathAudioFile.startsWith("data:");
        const hasStepAudio = this.tags.stepAudioFile && this.tags.stepAudioFile.startsWith("data:");

        const modelMapping = {
            CHICKEN:  "net.minecraft.client.model.ModelChicken",
            PIG:      "net.minecraft.client.model.ModelPig",
            COW:      "net.minecraft.client.model.ModelCow",
            SHEEP:    "net.minecraft.client.model.ModelSheep1",
            WOLF:     "net.minecraft.client.model.ModelWolf",
            ZOMBIE:   "net.minecraft.client.model.ModelZombie",
            SKELETON: "net.minecraft.client.model.ModelSkeleton",
            SPIDER:   "net.minecraft.client.model.ModelSpider",
            CREEPER:  "net.minecraft.client.model.ModelCreeper"
        };

        const defaultSizes = {
            CHICKEN:  { w: 0.4, h: 0.7 },
            PIG:      { w: 0.9, h: 0.9 },
            COW:      { w: 0.9, h: 1.4 },
            SHEEP:    { w: 0.9, h: 1.3 },
            WOLF:     { w: 0.6, h: 0.85 },
            ZOMBIE:   { w: 0.6, h: 1.95 },
            SKELETON: { w: 0.6, h: 1.99 },
            SPIDER:   { w: 1.4, h: 0.9 },
            CREEPER:  { w: 0.6, h: 1.7 }
        };

        const presets = {
            CHICKEN: {
                livingSound: "mob.chicken.say",
                hurtSound:   "mob.chicken.hurt",
                deathSound:  "mob.chicken.hurt",
                stepSound:   "mob.chicken.step",
                dropItem:    "chicken",
                breedingItem:"seeds",
                isPassive:   true
            },
            PIG: {
                livingSound: "mob.pig.say",
                hurtSound:   "mob.pig.say",
                deathSound:  "mob.pig.death",
                stepSound:   "mob.pig.step",
                dropItem:    "porkchop",
                breedingItem:"carrot",
                isPassive:   true
            },
            COW: {
                livingSound: "mob.cow.say",
                hurtSound:   "mob.cow.hurt",
                deathSound:  "mob.cow.hurt",
                stepSound:   "mob.cow.step",
                dropItem:    "beef",
                breedingItem:"wheat",
                isPassive:   true
            },
            SHEEP: {
                livingSound: "mob.sheep.say",
                hurtSound:   "mob.sheep.say",
                deathSound:  "mob.sheep.say",
                stepSound:   "mob.sheep.step",
                dropItem:    "mutton",
                breedingItem:"wheat",
                isPassive:   true
            },
            WOLF: {
                livingSound: "mob.wolf.bark",
                hurtSound:   "mob.wolf.hurt",
                deathSound:  "mob.wolf.death",
                stepSound:   "mob.wolf.step",
                dropItem:    "bone",
                breedingItem:"beef",
                isPassive:   false
            },
            ZOMBIE: {
                livingSound: "mob.zombie.say",
                hurtSound:   "mob.zombie.hurt",
                deathSound:  "mob.zombie.death",
                stepSound:   "mob.zombie.step",
                dropItem:    "rotten_flesh",
                isPassive:   false
            },
            SKELETON: {
                livingSound: "mob.skeleton.say",
                hurtSound:   "mob.skeleton.hurt",
                deathSound:  "mob.skeleton.death",
                stepSound:   "mob.skeleton.step",
                dropItem:    "bone",
                breedingItem:null,
                isPassive:   false
            },
            SPIDER: {
                livingSound: "mob.spider.say",
                hurtSound:   "mob.spider.say",
                deathSound:  "mob.spider.death",
                stepSound:   "mob.spider.step",
                dropItem:    "string",
                breedingItem:null,
                isPassive:   false
            },
            CREEPER: {
                livingSound: "mob.creeper.say",
                hurtSound:   "mob.creeper.say",
                deathSound:  "mob.creeper.death",
                stepSound:   "mob.creeper.step",
                dropItem:    "gunpowder",
                breedingItem:null,
                isPassive:   false
            }
        };

        const preset = presets[this.tags.modelType] || {};
        const modelClassId = modelMapping[this.tags.modelType] || "net.minecraft.client.model.ModelChicken";

        const livingSound = this.tags.livingSound || preset.livingSound || "mob.custom.idle";
        const hurtSound   = this.tags.hurtSound   || preset.hurtSound   || "mob.custom.hurt";
        const deathSound  = this.tags.deathSound  || preset.deathSound  || "mob.custom.death";
        const stepSound   = this.tags.stepSound   || preset.stepSound   || "mob.custom.step";

        const dropItemId     = this.tags.dropItem     || preset.dropItem     || "leather";
        const breedingItemId = this.tags.canBreed ? (this.tags.breedingItem || preset.breedingItem || "wheat") : null;
        const isPassive      = (typeof this.tags.isPassive === "boolean") ? this.tags.isPassive : (preset.isPassive ?? true);

        const eggBaseColor = this.tags.eggBaseColor >>> 0;
        const eggSpotColor = this.tags.eggSpotColor >>> 0;

        const skeletonHeldItem = this.tags.skeletonHeldItem || "bow";

        const sheepGrazingBlock       = this.tags.sheepGrazingBlock || "grass";
        const sheepGrazingResultBlock = this.tags.sheepGrazingResultBlock || "dirt";
        const sheepCanBeSheared       = !!this.tags.sheepCanBeSheared;
        const sheepShearDrop          = this.tags.sheepShearDrop || "wool";
        const sheepShearDropCount     = this.tags.sheepShearDropCount | 0;
        const sheepEatGroundTime      = this.tags.sheepEatGroundTime | 0;

        const cowMilkingItem      = this.tags.cowMilkingItem || "bucket";
        const cowMilkResultItem   = this.tags.cowMilkResultItem || "milk_bucket";
        const cowMilkCooldown     = this.tags.cowMilkCooldown | 0;

        const creeperFuseTime     = this.tags.creeperFuseTime | 0;
        const creeperExplosionPower = this.tags.creeperExplosionPower | 0;

        return `(function CustomMobDatablock() {
    function waitForRenderManager() {
        return new Promise((res) => {
            function check() {
                if (ModAPI.mc && ModAPI.mc.renderManager) res();
                else setTimeout(check, 50);
            }
            check();
        });
    }

    function registerEntity() {
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

        var entityClass = ModAPI.reflect.getClassById("net.minecraft.entity.passive.EntityAnimal");
        var entitySuper = ModAPI.reflect.getSuper(entityClass, (x) => x.length === 2);

        var CustomEntity = function CustomEntity(worldIn) {
            entitySuper(this, worldIn);
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();

            // default size per model (builder should also sync these when modelType changes)
            this.wrapped.setSize(${(defaultSizes[this.tags.modelType] || {w:this.tags.width,h:this.tags.height}).w}, ${(defaultSizes[this.tags.modelType] || {w:this.tags.width,h:this.tags.height}).h});

            var taskId = 0;
            ${this.tags.canSwim ? 'this.wrapped.tasks.addTask(taskId++, AITask("EntityAISwimming", 1)(this));' : ''}
            ${this.tags.canPanic ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIPanic", 2)(this, ${this.tags.panicSpeed}));` : ''}
            ${this.tags.canMate && this.tags.canBreed ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIMate", 2)(this, ${this.tags.mateSpeed}));` : ''}
            ${breedingItemId ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAITempt", 4)(this, 1.5, (ModAPI.items["${breedingItemId}"] || ModAPI.items.wheat).getRef(), 0));` : ''}
            ${this.tags.canFollowParent ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIFollowParent", 2)(this, ${this.tags.followParentSpeed}));` : ''}
            ${this.tags.canWander ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWander", 2)(this, ${this.tags.wanderSpeed}));` : ''}
            ${this.tags.canWatchPlayer ? `this.wrapped.tasks.addTask(taskId++, AITask("EntityAIWatchClosest", 3)(this, ModAPI.util.asClass(EntityPlayer.class), ${this.tags.watchDistance}));` : ''}
            this.wrapped.tasks.addTask(taskId++, AITask("EntityAILookIdle", 1)(this));

            // hostile attack AI
            ${!isPassive ? `
            var EntityAINearestAttackableTarget = AITask("EntityAINearestAttackableTarget", 3);
            var EntityAIAttackOnCollide = AITask("EntityAIAttackOnCollide", 3);
            this.wrapped.targetTasks.addTask(1, EntityAINearestAttackableTarget(this, ModAPI.util.asClass(EntityPlayer.class), true));
            this.wrapped.tasks.addTask(2, EntityAIAttackOnCollide(this, ModAPI.util.asClass(EntityPlayer.class), 1.0, false));
            ` : ''}

            // skeleton held item
            ${this.tags.modelType === "SKELETON" ? `
            try {
                var ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
                var heldRef = (ModAPI.items["${skeletonHeldItem}"] || ModAPI.items.bow).getRef();
                var held = new ItemStack(heldRef, 1, 0);
                this.wrapped.setCurrentItemOrArmor(0, held);
            } catch(e) {
                console.warn("Failed to set skeleton held item for ${this.tags.id}:", e);
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

            ${this.tags.canSwim ? `
            if (this.wrapped.isInWater()) {
                this.wrapped.motionY *= 0.5;
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.swimSpeed});
            } else {
                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${this.tags.movementSpeed});
            }
            ` : ''}

            // glide
            if (!this.wrapped.onGround && !this.wrapped.isInWater() && this.wrapped.motionY < 0) {
                this.wrapped.motionY *= ${this.tags.glideSpeed};
            }

            // spider climb
            ${this.tags.modelType === "SPIDER" ? `
            if (this.wrapped.isCollidedHorizontally) {
                if (this.wrapped.motionY < ${this.tags.spiderClimbSpeed}) {
                    this.wrapped.motionY = ${this.tags.spiderClimbSpeed};
                }
            }
            ` : ''}
        };

        // interaction: cow milking & sheep shearing
        CustomEntity.prototype.$interact = function (player) {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            var pw = ModAPI.util.wrap(player);
            var held = pw.getHeldItem();

            // cow milking
            ${this.tags.modelType === "COW" ? `
            if (held && held.$getItem() === (ModAPI.items["${cowMilkingItem}"] || ModAPI.items.bucket).getRef()) {
                try {
                    var ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
                    var milkRef = (ModAPI.items["${cowMilkResultItem}"] || ModAPI.items.milk_bucket).getRef();
                    var milk = new ItemStack(milkRef, 1, 0);
                    pw.setCurrentItemOrArmor(0, milk);
                    return true;
                } catch(e) {
                    console.warn("Cow milking failed for ${this.tags.id}:", e);
                }
            }
            ` : ''}

            // sheep shearing
            ${this.tags.modelType === "SHEEP" && sheepCanBeSheared ? `
            if (held && held.$getItem() === (ModAPI.items.shears || ModAPI.items.shears).getRef()) {
                try {
                    var ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
                    var dropRef = (ModAPI.items["${sheepShearDrop}"] || ModAPI.items.wool).getRef();
                    var count = Math.max(1, ${sheepShearDropCount});
                    for (var i = 0; i < count; i++) {
                        var drop = new ItemStack(dropRef, 1, 0);
                        this.wrapped.entityDropItem(drop, 0.5);
                    }
                    return true;
                } catch(e) {
                    console.warn("Sheep shearing failed for ${this.tags.id}:", e);
                }
            }
            ` : ''}

            return false;
        };

        // breeding
        CustomEntity.prototype.$isBreedingItem = function (itemstack) {
            if (!${!!this.tags.canBreed} || !${!!breedingItemId}) return false;
            var breedItem = ModAPI.items["${breedingItemId}"]?.getRef();
            return !!(itemstack && breedItem && itemstack.$getItem() === breedItem);
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
            if (!${!!this.tags.canBreed}) return null;
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            return new CustomEntity(this.wrapped.worldObj ? this.wrapped.worldObj.getRef() : null);
        };

        // creeper behaviour (simple fuse + explosion)
        ${this.tags.modelType === "CREEPER" ? `
        CustomEntity.prototype.$onUpdate = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.onUpdate();
            if (!this.wrapped.worldObj.$isRemote) {
                var EntityPlayer = ModAPI.reflect.getClassByName("EntityPlayer");
                var nearest = this.wrapped.worldObj.$getClosestPlayerToEntity(this.wrapped, 3.0);
                if (nearest) {
                    if (!this._fuse) this._fuse = 0;
                    this._fuse++;
                    if (this._fuse >= ${creeperFuseTime}) {
                        this.wrapped.worldObj.$createExplosion(this.wrapped, this.wrapped.posX, this.wrapped.posY, this.wrapped.posZ, ${creeperExplosionPower}, true);
                        this.wrapped.$setDead();
                    }
                } else {
                    this._fuse = 0;
                }
            }
        };
        ` : ''}

        // middle-click: vanilla spawn egg
        var ID = ModAPI.keygen.entity("${this.tags.id}");
        CustomEntity.prototype.$getPickedResult = function (hit) {
            try {
                var ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
                var Items = ModAPI.reflect.getClassById("net.minecraft.init.Items").staticVariables;
                var spawnEgg = Items.spawn_egg;
                return new ItemStack(spawnEgg, 1, ID);
            } catch(e) {
                console.warn("getPickedResult failed for ${this.tags.id}:", e);
                return null;
            }
        };

        // MODEL
        var modelClass = ModAPI.reflect.getClassById("${modelClassId}");
        var modelSuper = ModAPI.reflect.getSuper(modelClass);
        var CustomModel = function CustomModel() {
            modelSuper(this);
        };
        ModAPI.reflect.prototypeStack(modelClass, CustomModel);

        // RENDERER
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
        CustomRender.prototype.$handleRotationFloat = function (entity, partialTicks) {
            entity = ModAPI.util.wrap(entity);
            if ((!entity.onGround) && (!entity.isInWater())) return 2;
            return 0;
        };
        // render held items (skeleton etc.)
        CustomRender.prototype.$renderEquippedItems = function(entity, partialTicks) {
            try {
                var wrap = ModAPI.util.wrap(entity);
                var item = wrap.getHeldItem();
                if (item) {
                    this.renderManager.itemRenderer.renderItem(wrap, item, 0);
                }
            } catch(e) {}
        };

        // ENTITY REGISTRATION
        ModAPI.reflect
            .getClassById("net.minecraft.entity.EntityList")
            .staticMethods.addMapping0.method(
                ModAPI.util.asClass(CustomEntity),
                { $createEntity: function (w) { return new CustomEntity(w); } },
                ModAPI.util.str("${this.tags.name}"),
                ID,
                ${eggBaseColor},
                ${eggSpotColor}
            );

        const SpawnPlacementType = ModAPI.reflect
            .getClassById("net.minecraft.entity.EntityLiving$SpawnPlacementType")
            .staticVariables;
        const ENTITY_PLACEMENTS = ModAPI.util.wrap(
            ModAPI.reflect
                .getClassById("net.minecraft.entity.EntitySpawnPlacementRegistry")
                .staticVariables.ENTITY_PLACEMENTS
        );
        ENTITY_PLACEMENTS.put(ModAPI.util.asClass(CustomEntity), SpawnPlacementType.ON_GROUND);

        ModAPI.addEventListener("lib:asyncsink", () => {
            AsyncSink.L10N.set("entity.${this.tags.id}.name", "${this.tags.name}");
        });

        return { CustomEntity, CustomModel, CustomRender, mobTextures };
    }

    ModAPI.dedicatedServer.appendCode(registerEntity);
    var data = registerEntity();

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
})();`;
    }
};
