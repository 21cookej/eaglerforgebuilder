PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",
        health: 20,
        width: 0.6,
        height: 1.8,
        trackingRange: 64,
        eggPrimary: "#00FF00",
        eggSecondary: "#000000",
        texture: VALUE_ENUMS.IMG,
        AI: [],
        Constructor: VALUE_ENUMS.ABSTRACT_HANDLER + "MobConstructor",
        Tick: VALUE_ENUMS.ABSTRACT_HANDLER + "MobTick",
        Interact: VALUE_ENUMS.ABSTRACT_HANDLER + "MobInteract",
        Attack: VALUE_ENUMS.ABSTRACT_HANDLER + "MobAttack",
        Death: VALUE_ENUMS.ABSTRACT_HANDLER + "MobDeath",
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        return `
(function MobDatablock() {
    // ===== ENTITY CLASS =====
    function $$CustomMob(world) {
        var $$EntityLiving = ModAPI.reflect.getClassById("net.minecraft.entity.EntityLiving");
        var $$EntitySuper = ModAPI.reflect.getSuper($$EntityLiving, (x)=>x.length===1);
        $$EntitySuper(this, world);

        this.$setSize(${this.tags.width}, ${this.tags.height});
        this.$setHealth(${this.tags.health});

        ${getHandlerCode("MobConstructor", this.tags.Constructor, ["this", "world"]).code}
    }

    ModAPI.reflect.prototypeStack(ModAPI.reflect.getClassById("net.minecraft.entity.EntityLiving"), $$CustomMob);

    // ===== TICK =====
    $$CustomMob.prototype.$onLivingUpdate = function () {
        ${getHandlerCode("MobTick", this.tags.Tick, ["this"]).code}
        this.super$onLivingUpdate();
    };

    // ===== INTERACT =====
    $$CustomMob.prototype.$interact = function ($$player) {
        ${getHandlerCode("MobInteract", this.tags.Interact, ["this", "$$player"]).code}
        return true;
    };

    // ===== ATTACK =====
    $$CustomMob.prototype.$attackEntityAsMob = function ($$target) {
        ${getHandlerCode("MobAttack", this.tags.Attack, ["this", "$$target"]).code}
        return true;
    };

    // ===== DEATH =====
    $$CustomMob.prototype.$onDeath = function ($$damageSource) {
        ${getHandlerCode("MobDeath", this.tags.Death, ["this", "$$damageSource"]).code}
        this.super$onDeath($$damageSource);
    };

    // ===== REGISTRATION =====
    function $$internal_reg() {
        // Register entity
        ModAPI.entities.register("${this.tags.id}", $$CustomMob, {
            name: "${this.tags.name}",
            egg: [
                0x${this.tags.eggPrimary.replace("#", "")},
                0x${this.tags.eggSecondary.replace("#", "")}
            ],
            trackingRange: ${this.tags.trackingRange}
        });

        // Register renderer (client only)
        if (ModAPI.isClient()) {
            var $$Renderer = "RenderLiving";
            var $$Model = "ModelZombie"; // default model, can be changed
            ModAPI.entities.registerRenderer("${this.tags.id}", $$Renderer, $$Model, 0.5);

            // Register texture
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${this.tags.id}.png",
                await (await fetch("${this.tags.texture}")).arrayBuffer()
            );
        }
    }

    if (ModAPI.entities) {
        $$internal_reg();
    } else {
        ModAPI.addEventListener("bootstrap", $$internal_reg);
    }
})();`;
    }
};
