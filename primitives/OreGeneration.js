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
        const possibleDepsList = new Set([
            this.tags.oreBlock
        ]);
        const deps = [...matchesList.intersection(possibleDepsList)].map(x => {
            x = x.replace("block/", "").split("@");
            x = x[0];
            return state.nodes.find(y => (y.type === "block_advanced") && (y.tags.id === x))
        });
        return deps;
    },
    asJavaScript: function () {
        // Fix: parse blockId and blockMeta correctly from "block/<id>@<meta>"
        var rawBlock = this.tags.oreBlock.replace("block/", "");
        var blockParts = rawBlock.split("@");
        var blockId = blockParts[0];
        var blockMeta = parseInt(blockParts[1]) || 0;

        var salt = "XXXXXX".split("").map(x => Math.floor(Math.random() * 10)).join("");
        var dimension = this.tags.dimension || "overworld";

        // Map dimension name to Minecraft dimension ID integer
        // overworld = 0, nether = -1, end = 1
        var dimensionIdMap = {
            "overworld": 0,
            "nether": -1,
            "end": 1
        };
        var dimensionId = dimensionIdMap[dimension] !== undefined ? dimensionIdMap[dimension] : 0;

        // For nether/end we hook a different world gen class.
        // Nether uses net.minecraft.world.gen.ChunkProviderHell
        // End uses net.minecraft.world.gen.ChunkProviderEnd
        // Overworld uses BiomeDecorator as before.

        if (dimension === "overworld") {
            return `(function OreGenerationDatablock() {
    ModAPI.dedicatedServer.appendCode(()=>{
        const WorldGenMineable = ModAPI.reflect.getClassById("net.minecraft.world.gen.feature.WorldGenMinable").constructors.find(x=>x.length===2);

        const BiomeDecorator_decorate = ModAPI.util.getMethodFromPackage("net.minecraft.world.biome.BiomeDecorator", "decorate");
        const oldDecorate = ModAPI.hooks.methods[BiomeDecorator_decorate];
        ModAPI.hooks.methods[BiomeDecorator_decorate] = function ($this, $world, $random, $biomeGenBase, $blockpos) {
            if (!$this[\`$efb2__${blockId}_${blockMeta}_${salt}_BlockGen\`]) {
                $this[\`$efb2__${blockId}_${blockMeta}_${salt}_BlockGen\`] = WorldGenMineable(
                    ModAPI.blocks[\`${blockId}\`].getStateFromMeta(${blockMeta}).getRef(),
                    ${this.tags.veinSize}
                );
            }
            return oldDecorate.apply(this, [$this, $world, $random, $biomeGenBase, $blockpos]);
        }

        const BiomeDecorator_generateOres = ModAPI.util.getMethodFromPackage("net.minecraft.world.biome.BiomeDecorator", "generateOres");
        const oldGenerateOres = ModAPI.hooks.methods[BiomeDecorator_generateOres];
        ModAPI.hooks.methods[BiomeDecorator_generateOres] = function ($this) {
            $this.$genStandardOre1(
                ${this.tags.veinCount},
                $this[\`$efb2__${blockId}_${blockMeta}_${salt}_BlockGen\`] || null,
                ${this.tags.minGenerationHeight},
                ${this.tags.maxGenerationHeight}
            );
            return oldGenerateOres.apply(this, [$this]);
        }
    });
})();`;
        } else if (dimension === "nether") {
            return `(function OreGenerationDatablock() {
    ModAPI.dedicatedServer.appendCode(()=>{
        const WorldGenMineable = ModAPI.reflect.getClassById("net.minecraft.world.gen.feature.WorldGenMinable").constructors.find(x=>x.length===2);

        // Hook into the nether chunk provider's populate method
        const netherProviderClass = "net.minecraft.world.gen.ChunkProviderHell";
        const netherPopulate = ModAPI.util.getMethodFromPackage(netherProviderClass, "populate");
        const oldNetherPopulate = ModAPI.hooks.methods[netherPopulate];

        ModAPI.hooks.methods[netherPopulate] = function ($this, $chunkProvider, $chunkX, $chunkZ) {
            var $$world = $this.$worldObj;
            if (!$$world) {
                return oldNetherPopulate.apply(this, [$this, $chunkProvider, $chunkX, $chunkZ]);
            }

            var $$random = $this.$rand;
            var $$blockState = ModAPI.blocks[\`${blockId}\`].getStateFromMeta(${blockMeta}).getRef();
            var $$gen = WorldGenMineable($$blockState, ${this.tags.veinSize});

            for (var $$i = 0; $$i < ${this.tags.veinCount}; $$i++) {
                var $$x = $chunkX * 16 + ($$random.$nextInt(16));
                var $$z = $chunkZ * 16 + ($$random.$nextInt(16));
                var $$minY = ${this.tags.minGenerationHeight};
                var $$maxY = ${this.tags.maxGenerationHeight};
                // Clamp to nether safe range (1-126)
                $$minY = Math.max(1, Math.min($$minY, 126));
                $$maxY = Math.max(1, Math.min($$maxY, 126));
                var $$y = $$minY + ($$random.$nextInt(Math.max(1, $$maxY - $$minY)));
                var BlockPos = ModAPI.reflect.getClassById("net.minecraft.util.BlockPos").constructors.find(x=>x.length===3);
                var $$pos = BlockPos($$x, $$y, $$z);
                $$gen.$generate($$world, $$random, $$pos);
            }

            return oldNetherPopulate.apply(this, [$this, $chunkProvider, $chunkX, $chunkZ]);
        }
    });
})();`;
        } else if (dimension === "end") {
            return `(function OreGenerationDatablock() {
    ModAPI.dedicatedServer.appendCode(()=>{
        const WorldGenMineable = ModAPI.reflect.getClassById("net.minecraft.world.gen.feature.WorldGenMinable").constructors.find(x=>x.length===2);

        // Hook into the end chunk provider's populate method
        const endProviderClass = "net.minecraft.world.gen.ChunkProviderEnd";
        const endPopulate = ModAPI.util.getMethodFromPackage(endProviderClass, "populate");
        const oldEndPopulate = ModAPI.hooks.methods[endPopulate];

        ModAPI.hooks.methods[endPopulate] = function ($this, $chunkProvider, $chunkX, $chunkZ) {
            var $$world = $this.$worldObj;
            if (!$$world) {
                return oldEndPopulate.apply(this, [$this, $chunkProvider, $chunkX, $chunkZ]);
            }

            var $$random = $this.$rand;
            var $$blockState = ModAPI.blocks[\`${blockId}\`].getStateFromMeta(${blockMeta}).getRef();
            var $$gen = WorldGenMineable($$blockState, ${this.tags.veinSize});

            for (var $$i = 0; $$i < ${this.tags.veinCount}; $$i++) {
                var $$x = $chunkX * 16 + ($$random.$nextInt(16));
                var $$z = $chunkZ * 16 + ($$random.$nextInt(16));
                var $$minY = ${this.tags.minGenerationHeight};
                var $$maxY = ${this.tags.maxGenerationHeight};
                // Clamp to end safe range (1-255)
                $$minY = Math.max(1, Math.min($$minY, 255));
                $$maxY = Math.max(1, Math.min($$maxY, 255));
                var $$y = $$minY + ($$random.$nextInt(Math.max(1, $$maxY - $$minY)));
                var BlockPos = ModAPI.reflect.getClassById("net.minecraft.util.BlockPos").constructors.find(x=>x.length===3);
                var $$pos = BlockPos($$x, $$y, $$z);
                $$gen.$generate($$world, $$random, $$pos);
            }

            return oldEndPopulate.apply(this, [$this, $chunkProvider, $chunkX, $chunkZ]);
        }
    });
})();`;
        } else {
            // Fallback — should not happen but be safe
            return `/* OreGenerationDatablock: unknown dimension "${dimension}" */`;
        }
    }
}
