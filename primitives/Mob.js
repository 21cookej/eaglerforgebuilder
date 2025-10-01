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
        baseMob: ["Zombie", "Cow", "Pig", "Sheep", "Skeleton", "Creeper"], // dropdown of base mobs
        creativeTab: ["Misc", "Combat", "Spawn Eggs"], // tab for spawn egg
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        return `
(async function MobDatablock() {
    const $$mobId = "${this.tags.id}";
    const $$mobName = "${this.tags.name}";
    const $$eggPrimary = 0x${this.tags.eggPrimary.replace("#", "")};
    const $$eggSecondary = 0x${this.tags.eggSecondary.replace("#", "")};
    const $$mobTexture = "${this.tags.texture}";
    const $$baseMob = "${this.tags.baseMob}";
    const $$creativeTab = "${this.tags.creativeTab}";

    // ===== REGISTRATION =====
    function $$internal_reg() {
        // Register entity (reuse base mob's AI/behavior/model)
        ModAPI.entities.register($$mobId, ModAPI.entities.getBaseClass($$baseMob), {
            name: $$mobName,
            egg: [$$eggPrimary, $$eggSecondary],
            trackingRange: ${this.tags.trackingRange},
            width: ${this.tags.width},
            height: ${this.tags.height},
            health: ${this.tags.health},
            creativeTab: $$creativeTab
        });

        // Register renderer (client only)
        if (ModAPI.isClient()) {
            ModAPI.entities.registerRenderer($$mobId, "RenderLiving", "Model" + $$baseMob, 0.5);

            // Register custom texture for this mob
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/" + $$mobId + ".png",
                await (await fetch($$mobTexture)).arrayBuffer()
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
