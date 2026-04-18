PRIMITIVES["ore_generation"] = {
    name: "Ore Generation",
    type: "ore_generation",
    tags: {
        oreBlock: VALUE_ENUMS.ABSTRACT_BLOCK,
        lf0: VALUE_ENUMS.NEWLINE,
        veinSize: 4,
        veinCount: 105,
        minGenerationHeight: 0,
        maxGenerationHeight: 256,
        lf1: VALUE_ENUMS.NEWLINE,
        dimension: ["overworld", "nether", "end"]
    },
    getDependencies: function () {
        const matchesList = new Set([].bake().dynamicConcat("block_advanced", "id", (x) => {
            return "block/" + x + "@0"
        }).calculate());
        const possibleDepsList = new Set([this.tags.oreBlock]);
        const deps = [...matchesList.intersection(possibleDepsList)].map(x => {
            x = x.replace("block/", "").split("@")[0];
            return state.nodes.find(y => (y.type === "block_advanced") && (y.tags.id === x));
        });
        return deps;
    },
    asJavaScript: function () {
        // FIX: correctly split "block/<id>@<meta>" — original code accidentally
        // took index [0] of the split for both id and meta, so meta was always 0.
        var rawBlock = this.tags.oreBlock.replace("block/", "");
        var blockParts = rawBlock.split("@");
        var blockId   = blockParts[0];
        var blockMeta = parseInt(blockParts[1]) || 0;

        var salt      = "XXXXXX".split("").map(() => Math.floor(Math.random() * 10)).join("");
        var dimension = this.tags.dimension || "overworld";

        // ----------------------------------------------------------------
        // OVERWORLD — use BiomeDecorator hook (same pattern as before)
        // ----------------------------------------------------------------
        if (dimension === "overworld") {
            return `(function OreGenerationDatablock() {
    ModAPI.dedicatedServer.appendCode(() => {
        const WorldGenMineable = ModAPI.reflect.getClassById("net.minecraft.world.gen.feature.WorldGenMinable").constructors.find(x => x.length === 2);

        const $$decorateKey  = ModAPI.util.getMethodFromPackage("net.minecraft.world.biome.BiomeDecorator", "decorate");
        const $$oldDecorate  = ModAPI.hooks.methods[$$decorateKey];
        ModAPI.hooks.methods[$$decorateKey] = function ($this, $world, $random, $biomeGenBase, $blockpos) {
            if (!$this[\`$efb2__${blockId}_${blockMeta}_${salt}_gen\`]) {
                $this[\`$efb2__${blockId}_${blockMeta}_${salt}_gen\`] = WorldGenMineable(
                    ModAPI.blocks["${blockId}"].getStateFromMeta(${blockMeta}).getRef(),
                    ${this.tags.veinSize}
                );
            }
            return $$oldDecorate.apply(this, [$this, $world, $random, $biomeGenBase, $blockpos]);
        };

        const $$genOresKey  = ModAPI.util.getMethodFromPackage("net.minecraft.world.biome.BiomeDecorator", "generateOres");
        const $$oldGenOres  = ModAPI.hooks.methods[$$genOresKey];
        ModAPI.hooks.methods[$$genOresKey] = function ($this) {
            $this.$genStandardOre1(
                ${this.tags.veinCount},
                $this[\`$efb2__${blockId}_${blockMeta}_${salt}_gen\`] || null,
                ${this.tags.minGenerationHeight},
                ${this.tags.maxGenerationHeight}
            );
            return $$oldGenOres.apply(this, [$this]);
        };
    });
})();`;
        }

        // ----------------------------------------------------------------
        // NETHER / END — hook the chunk provider's populate method.
        //
        // Class names differ between 1.8 and 1.12:
        //   1.8  nether: net.minecraft.world.gen.ChunkProviderHell
        //   1.8  end:    net.minecraft.world.gen.ChunkProviderEnd
        //   1.12 nether: net.minecraft.world.gen.ChunkGeneratorHell
        //   1.12 end:    net.minecraft.world.gen.ChunkGeneratorEnd
        //
        // Dimension ID guard (also differs by version):
        //   1.8:  $world.$provider.$dimensionId  (-1 = nether, 1 = end)
        //   1.12: $world.$provider.$getDimensionType().$getId()
        // ----------------------------------------------------------------

        var dimId = dimension === "nether" ? -1 : 1;

        // Safe Y clamping per dimension
        var clampMinY = dimension === "nether"
            ? "Math.max(1,   Math.min($$cfgMinY, 125))"
            : "Math.max(1,   Math.min($$cfgMinY, 254))";
        var clampMaxY = dimension === "nether"
            ? "Math.max($$clampedMin + 1, Math.min($$cfgMaxY, 126))"
            : "Math.max($$clampedMin + 1, Math.min($$cfgMaxY, 255))";

        // Try both class name styles; whichever resolves will be used
        var class18  = dimension === "nether"
            ? "net.minecraft.world.gen.ChunkProviderHell"
            : "net.minecraft.world.gen.ChunkProviderEnd";
        var class112 = dimension === "nether"
            ? "net.minecraft.world.gen.ChunkGeneratorHell"
            : "net.minecraft.world.gen.ChunkGeneratorEnd";

        return `(function OreGenerationDatablock() {
    ModAPI.dedicatedServer.appendCode(() => {
        const WorldGenMineable = ModAPI.reflect.getClassById("net.minecraft.world.gen.feature.WorldGenMinable").constructors.find(x => x.length === 2);
        const MkBlockPos = ModAPI.reflect.getClassById("net.minecraft.util.BlockPos").constructors.find(x => x.length === 3);

        // Resolve populate method key — try 1.8 class name first, then 1.12
        var $$populateKey = null;
        var $$candidates = ["${class18}", "${class112}"];
        for (var $$ci = 0; $$ci < $$candidates.length && !$$populateKey; $$ci++) {
            try {
                var $$k = ModAPI.util.getMethodFromPackage($$candidates[$$ci], "populate");
                if ($$k && ModAPI.hooks.methods[$$k]) $$populateKey = $$k;
            } catch ($$e) {}
        }

        if (!$$populateKey) {
            console.warn("EFB OreGen: Could not resolve populate hook for dimension '${dimension}'. Skipping.");
            return;
        }

        var $$oldPopulate = ModAPI.hooks.methods[$$populateKey];
        ModAPI.hooks.methods[$$populateKey] = function ($this, $chunkProvider, $chunkX, $chunkZ) {
            // Always call vanilla populate first
            var $$ret = $$oldPopulate.apply(this, [$this, $chunkProvider, $chunkX, $chunkZ]);

            var $$world = $this.$worldObj;
            if (!$$world) return $$ret;

            // === Dimension guard ===
            // We are hooked into a specific chunk provider class, so in practice
            // we're already in the right dimension. But double-check to be safe
            // in case multiple instances share the hook.
            var $$dimOk = false;
            try {
                var $$prov = $$world.$provider;
                if ($$prov) {
                    if (typeof $$prov.$dimensionId !== "undefined") {
                        // 1.8 style
                        $$dimOk = ($$prov.$dimensionId === ${dimId});
                    } else {
                        // 1.12 style
                        var $$dt = $$prov.$getDimensionType ? $$prov.$getDimensionType() : null;
                        $$dimOk = $$dt ? ($$dt.$getId() === ${dimId}) : true;
                    }
                }
            } catch ($$e) {
                $$dimOk = true; // If guard throws, trust the hook context
            }
            if (!$$dimOk) return $$ret;

            var $$rand = $this.$rand;
            if (!$$rand) return $$ret;

            // === Ore placement ===
            try {
                var $$state = ModAPI.blocks["${blockId}"].getStateFromMeta(${blockMeta}).getRef();
                var $$gen   = WorldGenMineable($$state, ${this.tags.veinSize});
                var $$cfgMinY = ${this.tags.minGenerationHeight};
                var $$cfgMaxY = ${this.tags.maxGenerationHeight};
                var $$clampedMin = ${clampMinY};
                var $$clampedMax = ${clampMaxY};
                var $$range = $$clampedMax - $$clampedMin;

                for (var $$i = 0; $$i < ${this.tags.veinCount}; $$i++) {
                    var $$x = ($chunkX * 16) + $$rand.$nextInt(16);
                    var $$z = ($chunkZ * 16) + $$rand.$nextInt(16);
                    var $$y = $$clampedMin + $$rand.$nextInt($$range);
                    $$gen.$generate($$world, $$rand, MkBlockPos($$x, $$y, $$z));
                }
            } catch ($$e) {
                console.error("EFB OreGen error in ${dimension}:", $$e);
            }

            return $$ret;
        };

        console.log("EFB: Registered ${dimension} ore gen for ${blockId}@${blockMeta}");
    });
})();`;
    }
}
