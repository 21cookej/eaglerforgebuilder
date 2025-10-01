PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",
        baseClass: "EntityAnimal", // EntityAnimal, EntityMob, etc.
        size: [0.6, 1.8],
        health: 20,
        speed: 0.25,
        ai: [
            { type: "swimming" },
            { type: "wander", speed: 1.0 },
            { type: "watchClosest", target: "EntityPlayer", range: 6 },
            { type: "lookIdle" }
        ],
        sounds: {
            living: "mob.cow.say",
            hurt: "mob.cow.hurt",
            death: "mob.cow.death",
            step: "mob.cow.step"
        },
        Constructor: VALUE_ENUMS.ABSTRACT_HANDLER + "MobConstructor",
        Tick: VALUE_ENUMS.ABSTRACT_HANDLER + "MobTick",
        OnDeath: VALUE_ENUMS.ABSTRACT_HANDLER + "MobDeath"
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const t = this.tags;
        const mobId = t.id;

        var constructorHandler = getHandlerCode("MobConstructor", this.tags.Constructor, ["$$world"]);
        var tickHandler = getHandlerCode("MobTick", this.tags.Tick, ["$$world"]);
        var deathHandler = getHandlerCode("MobDeath", this.tags.OnDeath, ["$$damageSource"]);

        // AI generator
        function buildAI(ai) {
            return ai.map((task, i) => {
                switch(task.type) {
                    case "swimming": return `this.wrapped.tasks.addTask(${i}, AITask("EntityAISwimming", 1)(this));`;
                    case "wander": return `this.wrapped.tasks.addTask(${i}, AITask("EntityAIWander", 2)(this, ${task.speed||1.0}));`;
                    case "watchClosest": return `this.wrapped.tasks.addTask(${i}, AITask("EntityAIWatchClosest", 3)(this, ModAPI.util.asClass(EntityPlayer.class), ${task.range||6}));`;
                    case "lookIdle": return `this.wrapped.tasks.addTask(${i}, AITask("EntityAILookIdle", 1)(this));`;
                    default: return `// Unknown AI: ${JSON.stringify(task)}`;
                }
            }).join("\n");
        }

        return `(function MobDatablock() {
    function $$ServersideMob() {
        var entityClass = ModAPI.reflect.getClassById("net.minecraft.entity.passive.${t.baseClass}");
        var entitySuper = ModAPI.reflect.getSuper(entityClass, (x) => x.length === 2);
        const SharedMonsterAttributes = ModAPI.reflect.getClassByName("SharedMonsterAttributes").staticVariables;
        const EntityPlayer = ModAPI.reflect.getClassByName("EntityPlayer");

        function $$CustomMob($$world) {
            entitySuper(this, $$world);
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            this.wrapped.setSize(${t.size[0]}, ${t.size[1]});
            ${constructorHandler.code};
            ${buildAI(t.ai)}
        }
        ModAPI.reflect.prototypeStack(entityClass, $$CustomMob);

        // Attributes
        const originalApplyEntityAttributes = $$CustomMob.prototype.$applyEntityAttributes;
        $$CustomMob.prototype.$applyEntityAttributes = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            originalApplyEntityAttributes.apply(this, []);
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.maxHealth).setBaseValue(${t.health});
            this.wrapped.getEntityAttribute(SharedMonsterAttributes.movementSpeed).setBaseValue(${t.speed});
        }

        // Tick handler
        const originalLivingUpdate = $$CustomMob.prototype.$onLivingUpdate;
        $$CustomMob.prototype.$onLivingUpdate = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            originalLivingUpdate.apply(this, []);
            ${tickHandler.code};
        }

        // Death handler
        const originalOnDeath = $$CustomMob.prototype.$onDeath;
        $$CustomMob.prototype.$onDeath = function (${deathHandler.args.join(", ")}) {
            originalOnDeath.apply(this, [${deathHandler.args.join(", ")}]);
            ${deathHandler.code};
        }

        // Sounds
        $$CustomMob.prototype.$getLivingSound = function () { return ModAPI.util.str("${t.sounds.living}"); }
        $$CustomMob.prototype.$getHurtSound = function () { return ModAPI.util.str("${t.sounds.hurt}"); }
        $$CustomMob.prototype.$getDeathSound = function () { return ModAPI.util.str("${t.sounds.death}"); }
        $$CustomMob.prototype.$playStepSound = function () {
            this.wrapped ||= ModAPI.util.wrap(this).getCorrective();
            this.wrapped.playSound(ModAPI.util.str("${t.sounds.step}"), 0.2, 1);
        }

        // TODO: Register mob properly with ModAPI.entities
    }

    ModAPI.dedicatedServer.appendCode($$ServersideMob); 
    $$ServersideMob();
})();`;
    }
};
