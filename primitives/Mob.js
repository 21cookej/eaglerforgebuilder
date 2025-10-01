PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "duck",
        name: "Duck",
        health: 10,
        width: 0.5,
        height: 0.9,
        trackingRange: 64,
        eggPrimary: "#FFFF00",
        eggSecondary: "#000000",
        texture: VALUE_ENUMS.IMG, // base64 image
        baseMob: ["Chicken"], // fallback base mob
        creativeTab: ["Misc"],
        sounds: {
            quack: "mob.duck.quack",
            step: "mob.duck.step"
        }
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: async function () {
        const $$mobId = this.tags.id;
        const $$mobName = this.tags.name;
        const $$eggPrimary = 0x${this.tags.eggPrimary.replace("#", "")};
        const $$eggSecondary = 0x${this.tags.eggSecondary.replace("#", "")};
        const $$mobTexture = "${this.tags.texture}";
        const $$baseMob = this.tags.baseMob[0];
        const $$creativeTab = ${JSON.stringify(this.tags.creativeTab)};
        const $$width = ${this.tags.width};
        const $$height = ${this.tags.height};
        const $$health = ${this.tags.health};
        const $$trackingRange = ${this.tags.trackingRange};

        async function $$registerMob() {
            // Register entity
            ModAPI.entities.register($$mobId, ModAPI.entities.getBaseClass($$baseMob), {
                name: $$mobName,
                egg: [$$eggPrimary, $$eggSecondary],
                trackingRange: $$trackingRange,
                width: $$width,
                height: $$height,
                health: $$health,
                creativeTab: $$creativeTab
            });

            // Register renderer
            if (ModAPI.isClient()) {
                ModAPI.entities.registerRenderer($$mobId, "RenderLiving", "Model" + $$baseMob, 0.5);

                // Load base64 texture
                AsyncSink.setFile(
                    "resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/" + $$mobId + ".png",
                    Uint8Array.from(atob($$mobTexture), c => c.charCodeAt(0))
                );

                // Load sounds (example base64 audio strings)
                AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/duck/quack.ogg", await (await fetch(
                    "data:audio/ogg;base64,T2dnUwACAAAAAAAAAADVPQAAAAAAAMgAfuEBHgF2b3JiaXMAAAAA...YOUR_BASE64_QUACK..."
                )).arrayBuffer());
                AsyncSink.Audio.register("mob.duck.quack", AsyncSink.Audio.Category.ANIMALS, [
                    { path: "sounds/mob/duck/quack.ogg", pitch: 1, volume: 1, streaming: false }
                ]);

                AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/sounds/mob/duck/step.ogg", await (await fetch(
                    "data:audio/ogg;base64,T2dnUwACAAAAAAAAAAAbPQAAAAAAALYZWdIBHgF2b3JiaXMAAAAA...YOUR_BASE64_STEP..."
                )).arrayBuffer());
                AsyncSink.Audio.register("mob.duck.step", AsyncSink.Audio.Category.ANIMALS, [
                    { path: "sounds/mob/duck/step.ogg", pitch: 1, volume: 1, streaming: false }
                ]);
            }
        }

        if (ModAPI.entities) {
            await $$registerMob();
        } else {
            ModAPI.addEventListener("bootstrap", $$registerMob);
        }
    }
};
