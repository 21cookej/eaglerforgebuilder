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
        GetEyeHeight: VALUE_ENUMS.ABSTRACT_HANDLER + "MobEyeHeight"
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const tags = Object.assign({}, this.tags);
        
        const constructorHandler = getHandlerCode("MobConstructor", tags.Constructor, ["$$entity"]);
        const livingUpdateHandler = getHandlerCode("MobLivingUpdate", tags.LivingUpdate, ["$$entity"]);
        const eyeHeightHandler = getHandlerCode("MobEyeHeight", tags.GetEyeHeight, ["$$entity"]);
        
        const interactHandler = getHandlerCode("MobInteract", tags.OnInteract, ["$$entity", "$$player"], {
            "1_8": function (argNames, code) {
                return "nme_CustomEntity.prototype.$interact = function (" + argNames[1] + ") {\n" +
                    "    this.wrapped ||= ModAPI.util.wrap(this).getCorrective();\n" +
                    "    var " + argNames[0] + " = this.wrapped;\n" +
                    "    var " + argNames[1] + " = ModAPI.util.wrap(" + argNames[1] + ");\n" +
                    "    " + code + ";\n" +
                    "    return 0;\n" +
                    "}";
            },
            "1_12": function (argNames, code) {
                return "var $$EnumHand = ModAPI.reflect.getClassById(\"net.minecraft.util.EnumHand\").staticVariables;\n" +
                    "nme_CustomEntity.prototype.$processInteract = function (" + argNames[1] + ", $handEnum) {\n" +
                    "    this.wrapped ||= ModAPI.util.wrap(this).getCorrective();\n" +
                    "    var " + argNames[0] + " = this.wrapped;\n" +
                    "    var " + argNames[1] + " = ModAPI.util.wrap(" + argNames[1] + ");\n" +
                    "    " + code + ";\n" +
                    "    return 0;\n" +
                    "}";
            }
        });

        const biomeMapping = {
            "plains": "plains",
            "desert": "desert",
            "forest": "forest",
            "taiga": "taiga",
            "swampland": "swampland",
            "river": "river",
            "beach": "beach",
            "jungle": "jungle",
            "ocean": "ocean",
            "extremeHills": "extremeHills"
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

        const hasTexture = tags.texture && typeof tags.texture === 'string' && tags.texture.startsWith('data:');
        const hasIdleAudio = tags.idleAudioFile && typeof tags.idleAudioFile === 'string' && tags.idleAudioFile.startsWith('data:');
        const hasHurtAudio = tags.hurtAudioFile && typeof tags.hurtAudioFile === 'string' && tags.hurtAudioFile.startsWith('data:');
        const hasDeathAudio = tags.deathAudioFile && typeof tags.deathAudioFile === 'string' && tags.deathAudioFile.startsWith('data:');
        const hasStepAudio = tags.stepAudioFile && typeof tags.stepAudioFile === 'string' && tags.stepAudioFile.startsWith('data:');

        let spawnBiomes = "";
        tags.spawnInBiomes.forEach(function(biome) {
            if (biomeMapping[biome]) {
                spawnBiomes += "const Biome_" + biome + " = ModAPI.util.wrap(ModAPI.reflect.getClassById(\"net.minecraft.world.biome.BiomeGenBase\").staticVariables." + biomeMapping[biome] + ");\n";
                spawnBiomes += "const spawnEntry_" + biome + " = SpawnListEntry(ModAPI.util.asClass(nme_CustomEntity), " + tags.spawnWeight + ", " + tags.spawnMinGroup + ", " + tags.spawnMaxGroup + ");\n";
                spawnBiomes += "Biome_" + biome + ".spawnableCreatureList.add(spawnEntry_" + biome + ");\n";
            }
        });

        return "(function CustomMobEntity() {\n" +
            "    ModAPI.meta.title(\"" + tags.name + " Mod\");\n" +
            "    ModAPI.meta.description(\"Adds " + tags.name + " to the game\");\n" +
            "\n" +
            "    function waitForRenderManager() {\n" +
            "        return new Promise(function(res, rej) {\n" +
            "            function check() {\n" +
            "                if (ModAPI.mc.renderManager) {\n" +
            "                    res();\n" +
            "                } else {\n" +
            "                    setTimeout(check, 1/20);\n" +
            "                }\n" +
            "            }\n" +
            "            check();\n" +
            "        });\n" +
            "    }\n" +
            "\n" +
            "    function registerEntity() {\n" +
            "        ModAPI.hooks.methods.jl_String_format = ModAPI.hooks.methods.nlev_HString_format;\n" +
            "        \n" +
            "        function AITask(name, length) {\n" +
            "            return ModAPI.reflect.getClassById(\"net.minecraft.entity.ai.\" + name).constructors.find(function(x) { return x.length === length; });\n" +
            "        }\n" +
            "        const ResourceLocation = ModAPI.reflect.getClassByName(\"ResourceLocation\").constructors.find(function(x) { return x.length === 1; });\n" +
            "        const EntityPlayer = ModAPI.reflect.getClassByName(\"EntityPlayer\");\n" +
            "        const SharedMonsterAttributes = ModAPI.reflect.getClassByName(\"SharedMonsterAttributes\").staticVariables;\n" +
            "\n" +
            "        var entityClass = ModAPI.reflect.getClassById(\"net.minecraft.entity.passive.EntityAnimal\");\n" +
            "        var entitySuper = ModAPI.reflect.getSuper(entityClass, function(x) { return x.length === 2; });\n" +
            "        \n" +
            "        var nme_CustomEntity = function nme_CustomEntity($worldIn) {\n" +
            "            entitySuper(this, $worldIn);\n" +
            "            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();\n" +
            "            this.wrapped.setSize(" + tags.width + ", " + tags.height + ");\n" +
            "            \n" +
            "            var taskId = 0;\n" +
            (tags.canSwim ? "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAISwimming\", 1)(this));\n" : "") +
            (tags.canPanic ? "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAIPanic\", 2)(this, " + tags.panicSpeed + "));\n" : "") +
            (tags.canMate ? "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAIMate\", 2)(this, " + tags.mateSpeed + "));\n" : "") +
            "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAITempt\", 4)(this, 1.5, (ModAPI.items[\"" + tags.breedingItem + "\"] || ModAPI.items.wheat).getRef(), 0));\n" +
            (tags.canFollowParent ? "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAIFollowParent\", 2)(this, " + tags.followParentSpeed + "));\n" : "") +
            (tags.canWander ? "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAIWander\", 2)(this, " + tags.wanderSpeed + "));\n" : "") +
            (tags.canWatchPlayer ? "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAIWatchClosest\", 3)(this, ModAPI.util.asClass(EntityPlayer.class), " + tags.watchDistance + "));\n" : "") +
            "            this.wrapped.tasks.addTask(taskId++, AITask(\"EntityAILookIdle\", 1)(this));\n" +
            "            \n" +
            "            var $$entity = this.wrapped;\n" +
            "            " + constructorHandler.code + ";\n" +
            "        }\n" +
            "        \n" +
            "        ModAPI.reflect.prototypeStack(entityClass, nme_CustomEntity);\n" +
            "        \n" +
            "        nme_CustomEntity.prototype.$getEyeHeight = function () {\n" +
            "            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();\n" +
            "            var $$entity = this.wrapped;\n" +
            "            " + (eyeHeightHandler.code || "return this.wrapped.height;") + "\n" +
            "        }\n" +
            "\n" +
            "        const originalApplyEntityAttributes = nme_CustomEntity.prototype.$applyEntityAttributes;\n" +
            "        nme_CustomEntity.prototype.$applyEntityAttributes = function () {\n" +
            "            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();\n" +
            "            originalApplyEntityAttributes.apply(this, []);\n" +
            "            this.wrapped.getEntityAttribute(SharedMonsterAttributes.maxHealth).setBaseValue(" + tags.maxHealth + ");\n" +
            "            this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(" + tags.movementSpeed + ");\n" +
            "        }\n" +
            "\n" +
            "        const originalLivingUpdate = nme_CustomEntity.prototype.$onLivingUpdate;\n" +
            "        nme_CustomEntity.prototype.$onLivingUpdate = function () {\n" +
            "            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();\n" +
            "            originalLivingUpdate.apply(this, []);\n" +
            (tags.canSwim ? 
            "            if (this.wrapped.isInWater()) {\n" +
            "                this.wrapped.motionY *= 0.5;\n" +
            "                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(" + tags.swimSpeed + ");\n" +
            "            } else {\n" +
            "                this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(" + tags.movementSpeed + ");\n" +
            "            }\n" : "") +
            "            var $$entity = this.wrapped;\n" +
            "            " + livingUpdateHandler.code + ";\n" +
            "        }\n" +
            "\n" +
            "        " + interactHandler + "\n" +
            "\n" +
            "        nme_CustomEntity.prototype.$getLivingSound = function () {\n" +
            "            return ModAPI.util.str(\"" + tags.livingSound + "\");\n" +
            "        }\n" +
            "        nme_CustomEntity.prototype.$getHurtSound = function () {\n" +
            "            return ModAPI.util.str(\"" + tags.hurtSound + "\");\n" +
            "        }\n" +
            "        nme_CustomEntity.prototype.$getDeathSound = function () {\n" +
            "            return ModAPI.util.str(\"" + tags.deathSound + "\");\n" +
            "        }\n" +
            "        nme_CustomEntity.prototype.$playStepSound = function () {\n" +
            "            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();\n" +
            "            this.wrapped.playSound(ModAPI.util.str(\"" + tags.stepSound + "\"), " + tags.stepVolume + ", 1);\n" +
            "        }\n" +
            "        nme_CustomEntity.prototype.$getDropItem = function () {\n" +
            "            return (ModAPI.items[\"" + tags.dropItem + "\"] || ModAPI.items.leather).getRef();\n" +
            "        }\n" +
            "        nme_CustomEntity.prototype.$createChild = function (otherParent) {\n" +
            "            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();\n" +
            "            return new nme_CustomEntity(this.wrapped.worldObj ? this.wrapped.worldObj.getRef() : null);\n" +
            "        }\n" +
            "        nme_CustomEntity.prototype.$isBreedingItem = function (itemstack) {\n" +
            "            var breedItem = (ModAPI.items[\"" + tags.breedingItem + "\"] || ModAPI.items.wheat).getRef();\n" +
            "            return itemstack !== null && itemstack.$getItem() === breedItem;\n" +
            "        }\n" +
            "\n" +
            "        var modelClass = ModAPI.reflect.getClassById(\"" + modelMapping[tags.modelType] + "\");\n" +
            "        var modelSuper = ModAPI.reflect.getSuper(modelClass);\n" +
            "        \n" +
            "        var nmcm_CustomModel = function nmcm_CustomModel() {\n" +
            "            modelSuper(this);\n" +
            "        }\n" +
            "        ModAPI.reflect.prototypeStack(modelClass, nmcm_CustomModel);\n" +
            "\n" +
            "        var renderClass = ModAPI.reflect.getClassById(\"net.minecraft.client.renderer.entity.RenderLiving\");\n" +
            "        var renderSuper = ModAPI.reflect.getSuper(renderClass, function(x) { return x.length === 4; });\n" +
            "        const mobTextures = ResourceLocation(ModAPI.util.str(\"textures/entity/" + tags.id + ".png\"));\n" +
            "        \n" +
            "        var nmcre_CustomRender = function nmcre_CustomRender(renderManager, modelBaseIn, shadowSizeIn) {\n" +
            "            renderSuper(this, renderManager, modelBaseIn, shadowSizeIn);\n" +
            "        }\n" +
            "        ModAPI.reflect.prototypeStack(renderClass, nmcre_CustomRender);\n" +
            "        \n" +
            "        nmcre_CustomRender.prototype.$getEntityTexture = function (entity) {\n" +
            "            return mobTextures;\n" +
            "        }\n" +
            (flags.target === "1_12" ? 
            "        nmcre_CustomRender.prototype.$handleRotationFloat = function (entity, partialTicks) {\n" +
            "            entity = ModAPI.util.wrap(entity);\n" +
            "            if ((!entity.onGround) && (!entity.isInWater())) {\n" +
            "                return 2;\n" +
            "            } else {\n" +
            "                return 0;\n" +
            "            }\n" +
            "        }\n" :
            "        nmcre_CustomRender.prototype.$func_77044_a = function (entity, partialTicks) {\n" +
            "            entity = ModAPI.util.wrap(entity);\n" +
            "            if ((!entity.onGround) && (!entity.isInWater())) {\n" +
            "                return 2;\n" +
            "            } else {\n" +
            "                return 0;\n" +
            "            }\n" +
            "        }\n") +
            "\n" +
            "        const ID = ModAPI.keygen.entity(\"" + tags.id + "\");\n" +
            "        ModAPI.reflect.getClassById(\"net.minecraft.entity.EntityList\").staticMethods.addMapping0.method(\n" +
            "            ModAPI.util.asClass(nme_CustomEntity),\n" +
            "            {\n" +
            "                $createEntity: function ($worldIn) {\n" +
            "                    return new nme_CustomEntity($worldIn);\n" +
            "                }\n" +
            "            },\n" +
            "            ModAPI.util.str(\"" + tags.name + "\"),\n" +
            "            ID,\n" +
            "            " + tags.spawnEggBaseColor + ",\n" +
            "            " + tags.spawnEggSpotColor + "\n" +
            "        );\n" +
            "\n" +
            "        const SpawnPlacementType = ModAPI.reflect.getClassById(\"net.minecraft.entity.EntityLiving$SpawnPlacementType\").staticVariables;\n" +
            "        const ENTITY_PLACEMENTS = ModAPI.util.wrap(\n" +
            "            ModAPI.reflect.getClassById(\"net.minecraft.entity.EntitySpawnPlacementRegistry\")\n" +
            "                .staticVariables.ENTITY_PLACEMENTS\n" +
            "        );\n" +
            "        ENTITY_PLACEMENTS.put(ModAPI.util.asClass(nme_CustomEntity), SpawnPlacementType.ON_GROUND);\n" +
            "        \n" +
            "        ModAPI.addEventListener('bootstrap', function() {\n" +
            "            const SpawnListEntry = ModAPI.reflect\n" +
            "                .getClassById(\"net.minecraft.world.biome.BiomeGenBase$SpawnListEntry\")\n" +
            "                .constructors.find(function(x) { return x.length === 4; });\n" +
            "            \n" +
            "            " + spawnBiomes + "\n" +
            "        });\n" +
            "\n" +
            "        ModAPI.addEventListener(\"lib:asyncsink\", function() {\n" +
            "            AsyncSink.L10N.set(\"entity." + tags.name + ".name\", \"" + tags.name + "\");\n" +
            "        });\n" +
            "\n" +
            "        return {\n" +
            "            EntityCustom: nme_CustomEntity,\n" +
            "            ModelCustom: nmcm_CustomModel,\n" +
            "            RenderCustom: nmcre_CustomRender,\n" +
            "            mobTextures: mobTextures\n" +
            "        }\n" +
            "    }\n" +
            "\n" +
            "    ModAPI.dedicatedServer.appendCode(registerEntity);\n" +
            "    var data = registerEntity();\n" +
            "\n" +
            "    ModAPI.addEventListener(\"lib:asyncsink\", async function() {\n" +
            (hasTexture ? 
            "        try {\n" +
            "            AsyncSink.setFile(\"resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/" + tags.id + ".png\", await (await fetch(\n" +
            "                \"" + tags.texture + "\"\n" +
            "            )).arrayBuffer());\n" +
            "            AsyncSink.hideFile(\"resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/" + tags.id + ".png.mcmeta\");\n" +
            "        } catch(e) {\n" +
            "            console.warn(\"Failed to load mob texture:\", e);\n" +
            "        }\n" : "") +
            "\n" +
            "        await waitForRenderManager();\n" +
            "\n" +
            (hasIdleAudio ?
            "        try {\n" +
            "            AsyncSink.setFile(\"resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/" + tags.id + "/idle.ogg\", await (await fetch(\n" +
            "                \"" + tags.idleAudioFile + "\"\n" +
            "            )).arrayBuffer());\n" +
            "            AsyncSink.Audio.register(\"" + tags.livingSound + "\", AsyncSink.Audio.Category.ANIMALS, [{\n" +
            "                path: \"sounds/mob/" + tags.id + "/idle.ogg\",\n" +
            "                pitch: 1,\n" +
            "                volume: 1,\n" +
            "                streaming: false\n" +
            "            }]);\n" +
            "        } catch(e) {\n" +
            "            console.warn(\"Failed to load idle sound:\", e);\n" +
            "        }\n" : "") +
            (hasHurtAudio ?
            "        try {\n" +
            "            AsyncSink.setFile(\"resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/" + tags.id + "/hurt.ogg\", await (await fetch(\n" +
            "                \"" + tags.hurtAudioFile + "\"\n" +
            "            )).arrayBuffer());\n" +
            "            AsyncSink.Audio.register(\"" + tags.hurtSound + "\", AsyncSink.Audio.Category.ANIMALS, [{\n" +
            "                path: \"sounds/mob/" + tags.id + "/hurt.ogg\",\n" +
            "                pitch: 1,\n" +
            "                volume: 1,\n" +
            "                streaming: false\n" +
            "            }]);\n" +
            "        } catch(e) {\n" +
            "            console.warn(\"Failed to load hurt sound:\", e);\n" +
            "        }\n" : "") +
            (hasDeathAudio ?
            "        try {\n" +
            "            AsyncSink.setFile(\"resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/" + tags.id + "/death.ogg\", await (await fetch(\n" +
            "                \"" + tags.deathAudioFile + "\"\n" +
            "            )).arrayBuffer());\n" +
            "            AsyncSink.Audio.register(\"" + tags.deathSound + "\", AsyncSink.Audio.Category.ANIMALS, [{\n" +
            "                path: \"sounds/mob/" + tags.id + "/death.ogg\",\n" +
            "                pitch: 1,\n" +
            "                volume: 1,\n" +
            "                streaming: false\n" +
            "            }]);\n" +
            "        } catch(e) {\n" +
            "            console.warn(\"Failed to load death sound:\", e);\n" +
            "        }\n" : "") +
            (hasStepAudio ?
            "        try {\n" +
            "            AsyncSink.setFile(\"resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/" + tags.id + "/step.ogg\", await (await fetch(\n" +
            "                \"" + tags.stepAudioFile + "\"\n" +
            "            )).arrayBuffer());\n" +
            "            AsyncSink.Audio.register(\"" + tags.stepSound + "\", AsyncSink.Audio.Category.ANIMALS, [{\n" +
            "                path: \"sounds/mob/" + tags.id + "/step.ogg\",\n" +
            "                pitch: 1,\n" +
            "                volume: 1,\n" +
            "                streaming: false\n" +
            "            }]);\n" +
            "        } catch(e) {\n" +
            "            console.warn(\"Failed to load step sound:\", e);\n" +
            "        }\n" : "") +
            "\n" +
            "        try {\n" +
            "            ModAPI.mc.renderManager.entityRenderMap.put(ModAPI.util.asClass(data.EntityCustom), new data.RenderCustom(ModAPI.mc.renderManager.getRef(), new data.ModelCustom(), " + tags.shadowSize + "));\n" +
            "            ModAPI.promisify(ModAPI.mc.renderEngine.bindTexture)(data.mobTextures).then(function() {\n" +
            "                console.log(\"Loaded " + tags.name + " texture into cache.\");\n" +
            "            });\n" +
            "        } catch(e) {\n" +
            "            console.warn(\"Failed to register renderer:\", e);\n" +
            "        }\n" +
            "    });\n" +
            "})();";
    }
}
