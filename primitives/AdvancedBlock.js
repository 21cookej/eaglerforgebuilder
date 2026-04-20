//TODO: quantityDropped, onBlockDestroyedByExplosion, onBlockActivated
PRIMITIVES["block_advanced"] = {
    name: "Advanced Block",
    uses: ["fixup_block_ids", "str2ab"],
    type: "block_advanced",
    tags: {
        id: "advanced_block",
        name: "Advanced Block",
        // Texture mode: "single" = one texture all sides, "multi" = per-face textures, "json" = custom Blockbench JSON model
        textureMode: ["single", "multi", "json"],
        // Single texture (used when textureMode = "single")
        texture: VALUE_ENUMS.IMG,
        // Per-face textures (used when textureMode = "multi")
        textureTop: VALUE_ENUMS.IMG,
        textureBottom: VALUE_ENUMS.IMG,
        textureNorth: VALUE_ENUMS.IMG,
        textureSouth: VALUE_ENUMS.IMG,
        textureEast: VALUE_ENUMS.IMG,
        textureWest: VALUE_ENUMS.IMG,
        textureParticle: VALUE_ENUMS.IMG,
        // Custom JSON model (used when textureMode = "json")
        // Stores embedded JSON model string; textures are inlined as data URIs in the JSON
        customModelJson: "",
        lf_tex: VALUE_ENUMS.NEWLINE,
        animatedSpritesheetTexture: false,
        animatedTextureFrameDuration: 1,
        animatedTextureInterpolate: false,
        lf_anim: VALUE_ENUMS.NEWLINE,
        // Block properties
        hardness: 3.0,
        resistance: 10.0,
        lightLevel: 0,
        lightOpacity: 255,
        slipperiness: 0.6,
        tickRatio: 10,
        isOpaque: true,
        needsRandomTick: false,
        lf_props: VALUE_ENUMS.NEWLINE,
        material: ['rock', 'air', 'grass', 'ground', 'wood', 'iron', 'anvil', 'water', 'lava', 'leaves', 'plants', 'vine', 'sponge', 'cloth', 'fire', 'sand', 'circuits', 'carpet', 'glass', 'redstoneLight', 'tnt', 'coral', 'ice', 'packedIce', 'snow', 'craftedSnow', 'cactus', 'clay', 'gourd', 'dragonEgg', 'portal', 'cake', 'web', 'piston', 'barrier'],
        soundType: ['stone', 'wood', 'gravel', 'grass', 'metal', 'glass', 'cloth', 'sand', 'snow', 'ladder', 'anvil', 'slime'],
        lf_handlers: VALUE_ENUMS.NEWLINE,
        Constructor: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockConstructor",
        Break: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockBreak",
        Added: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockAdded",
        NeighborChange: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockNeighbourChange",
        BrokenByPlayer: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockBrokenByPlayer",
        RandomTick: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockRandomTick",
        EntityCollided: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockEntityCollision",
        GetDroppedItem: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockGetDroppedItem",
        QuantityDropped: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockQuantityDropped",
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        var constructorHandler = getHandlerCode("BlockConstructor", this.tags.Constructor, []);
        var breakHandler = getHandlerCode("BlockBreak", this.tags.Break, ["$$world", "$$blockpos", "$$blockstate"]);
        var addedHandler = getHandlerCode("BlockAdded", this.tags.Added, ["$$world", "$$blockpos", "$$blockstate"]);
        var neighborHandler = getHandlerCode("BlockNeighbourChange", this.tags.NeighborChange, ["$$world", "$$blockpos", "$$blockstate"], {
            "1_8": function (args, code) {
                return `
                var $$onNeighborBlockChangeMethod = $$blockClass.methods.onNeighborBlockChange.method;
                $$nmb_AdvancedBlock.prototype.$onNeighborBlockChange = function (${args.join(", ")}) {
                    ${code};
                    return $$onNeighborBlockChangeMethod(this, ${args.join(", ")});
                }
                `;
            },
            "1_12": function (args, code) {
                const copy = [...args];
                copy[0] = args[1];
                copy[1] = args[2];
                copy[2] = args[0];
                return `
                var $$onNeighborBlockChangeMethod = $$blockClass.methods.neighborChanged.method;
                $$nmb_AdvancedBlock.prototype.$neighborChanged = function (${copy.join(", ")}) {
                    ${code};
                    return $$onNeighborBlockChangeMethod(this, ${copy.join(", ")});
                }
                `;
            }
        });
        var brokenByPlayerHandler = getHandlerCode("BlockBrokenByPlayer", this.tags.BrokenByPlayer, ["$$world", "$$blockpos", "$$blockstate"]);
        var randomTickHandler = getHandlerCode("BlockRandomTick", this.tags.RandomTick, ["$$world", "$$blockpos", "$$blockstate", "$$random"]);
        var entityCollisionHandler = getHandlerCode("BlockEntityCollision", this.tags.EntityCollided, ["$$world", "$$blockpos", "$$entity"], {
            "1_8": function (args, code) {
                return `
                var $$entityCollisionMethod = $$blockClass.methods.onEntityCollidedWithBlock.method;
                $$nmb_AdvancedBlock.prototype.$onEntityCollidedWithBlock = function (${args.join(", ")}) {
                    ${code};
                    return $$entityCollisionMethod(this, ${args.join(", ")});
                }`;
            },
            "1_12": function (args, code) {
                const argList = `${args.slice(0,2).join(", ")},$$blockstate,${args[2]}`;
                return `
                var $$entityCollisionMethod = $$blockClass.methods.onEntityCollidedWithBlock.method;
                $$nmb_AdvancedBlock.prototype.$onEntityCollidedWithBlock = function (${argList}) {
                    ${code};
                    return $$entityCollisionMethod(this, ${argList});
                }`;
            }
        });
        var getDroppedItemHandler = getHandlerCode("BlockGetDroppedItem", this.tags.GetDroppedItem, ["$$blockstate", "$$random", "$$forture"]);
        var quantityDroppedHandler = getHandlerCode("BlockQuantityDropped", this.tags.QuantityDropped, ["$$random", "$$fortune"]);

        // ---- Texture Mode Logic ----
        const texMode = this.tags.textureMode || "single";
        const blockId = this.tags.id;
        const isOpaque = this.tags.isOpaque !== false ? 1 : 0;
        const lightLevel = Math.max(0, Math.min(15, Math.round(this.tags.lightLevel || 0)));
        const lightOpacity = Math.max(0, Math.min(255, Math.round(this.tags.lightOpacity !== undefined ? this.tags.lightOpacity : 255)));
        const hardness = parseFloat(this.tags.hardness || 3.0);
        const resistance = parseFloat(this.tags.resistance || 10.0);
        const slipperiness = parseFloat(this.tags.slipperiness || 0.6);
        const needsRandomTick = this.tags.needsRandomTick ? 1 : 0;

        // Sound type mapping for 1.8 vs 1.12
        const soundType = this.tags.soundType || 'stone';
        const soundType18Map = {
            stone: 'soundTypeStone',
            wood: 'soundTypeWood',
            gravel: 'soundTypeGravel',
            grass: 'soundTypeGrass',
            metal: 'soundTypeMetal',
            glass: 'soundTypeGlass',
            cloth: 'soundTypeCloth',
            sand: 'soundTypeSand',
            snow: 'soundTypeSnow',
            ladder: 'soundTypeLadder',
            anvil: 'soundTypeAnvil',
            slime: 'SLIME_SOUND'
        };
        const soundType112 = soundType.toUpperCase();
        const soundType18 = soundType18Map[soundType] || 'soundTypeStone';

        const animationCode = `
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}.png.mcmeta", efb2__str2ab(
\`{
    "animation": {
        "frametime": ${Math.max(1, Math.round(this.tags.animatedTextureFrameDuration)) || 1},
        "interpolate": ${this.tags.animatedTextureInterpolate}
    }
}\`));
        `;

        // Build the AsyncSink resource section based on texture mode
        let asyncSinkResourceSection = "";

        if (texMode === "single") {
            // Original single-texture cube_all logic
            asyncSinkResourceSection = `
        const $$rawTex = await (await fetch($$blockTexture)).arrayBuffer();
        const $$img = await AsyncSink.imageInfo($$rawTex);
        const $$isPerFace = ($$img.width === $$img.height * 6);

        if (!$$isPerFace) {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/models/block/${blockId}.json",
                JSON.stringify({
                    parent: "block/cube_all",
                    textures: { all: "blocks/${blockId}" }
                })
            );
        } else {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/models/block/${blockId}.json",
                JSON.stringify({
                    parent: "block/cube",
                    textures: {
                        up:    "blocks/${blockId}_top",
                        down:  "blocks/${blockId}_bottom",
                        north: "blocks/${blockId}_north",
                        east:  "blocks/${blockId}_east",
                        south: "blocks/${blockId}_south",
                        west:  "blocks/${blockId}_west"
                    }
                })
            );
        }

        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${blockId}.json",
            JSON.stringify({
                parent: "block/${blockId}",
                display: {
                    thirdperson: {
                        rotation: [10, -45, 170],
                        translation: [0, 1.5, -2.75],
                        scale: [0.375, 0.375, 0.375]
                    }
                }
            })
        );
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/blockstates/${blockId}.json",
            JSON.stringify({
                variants: { normal: [{ model: "${blockId}" }] }
            })
        );

        if (!$$isPerFace) {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}.png",
                $$rawTex
            );
            ${this.tags.animatedSpritesheetTexture ? animationCode : ""}
        } else {
            const $$faceNames = ["top","bottom","north","east","south","west"];
            const $$slices = [];
            for (let i = 0; i < 6; i++) {
                const $$slice = await AsyncSink.sliceImage($$rawTex, {
                    x: i * $$img.height,
                    y: 0,
                    width: $$img.height,
                    height: $$img.height
                });
                $$slices.push($$slice);
                AsyncSink.setFile(
                    \`resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_\${$$faceNames[i]}.png\`,
                    $$slice
                );
            }
            const $$northIndex = 2;
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}.png",
                $$slices[$$northIndex]
            );
        }`;

        } else if (texMode === "multi") {
            // Per-face individual textures
            const faceMap = {
                top: this.tags.textureTop,
                bottom: this.tags.textureBottom,
                north: this.tags.textureNorth,
                south: this.tags.textureSouth,
                east: this.tags.textureEast,
                west: this.tags.textureWest,
            };
            const particleTex = this.tags.textureParticle;

            // Check which faces have textures
            const hasFaces = Object.values(faceMap).some(v => v && v !== VALUE_ENUMS.IMG && v.startsWith("data:"));

            // Build texture entries in model — use particle for all undefined faces
            const textures = { particle: `blocks/${blockId}_particle` };
            const faceTexNames = {};
            for (const [face, val] of Object.entries(faceMap)) {
                const hasTex = val && val !== VALUE_ENUMS.IMG && val.startsWith("data:");
                faceTexNames[face] = hasTex ? `blocks/${blockId}_${face}` : `blocks/${blockId}_particle`;
                textures[face] = faceTexNames[face];
            }

            asyncSinkResourceSection = `
        // Per-face multi-texture mode
        const $$faceDataMap = {
            particle: "${(particleTex && particleTex.startsWith("data:")) ? particleTex : ""}",
            top: "${(faceMap.top && faceMap.top.startsWith("data:")) ? faceMap.top : ""}",
            bottom: "${(faceMap.bottom && faceMap.bottom.startsWith("data:")) ? faceMap.bottom : ""}",
            north: "${(faceMap.north && faceMap.north.startsWith("data:")) ? faceMap.north : ""}",
            south: "${(faceMap.south && faceMap.south.startsWith("data:")) ? faceMap.south : ""}",
            east: "${(faceMap.east && faceMap.east.startsWith("data:")) ? faceMap.east : ""}",
            west: "${(faceMap.west && faceMap.west.startsWith("data:")) ? faceMap.west : ""}",
        };
        // Determine fallback: use first non-empty face as fallback for missing faces
        const $$faceKeys = ["particle","top","bottom","north","south","east","west"];
        let $$fallbackDataUri = $$faceDataMap.particle || $$faceDataMap.top || $$faceDataMap.north || "";
        for(const $$k of $$faceKeys){ if($$faceDataMap[$$k]){$$fallbackDataUri=$$faceDataMap[$$k]; break;} }

        async function $$fetchFace(dataUri) {
            if(!dataUri) dataUri = $$fallbackDataUri;
            if(!dataUri) return null;
            return (await fetch(dataUri)).arrayBuffer();
        }

        const $$particleBuf = await $$fetchFace($$faceDataMap.particle);
        const $$topBuf    = await $$fetchFace($$faceDataMap.top);
        const $$bottomBuf = await $$fetchFace($$faceDataMap.bottom);
        const $$northBuf  = await $$fetchFace($$faceDataMap.north);
        const $$southBuf  = await $$fetchFace($$faceDataMap.south);
        const $$eastBuf   = await $$fetchFace($$faceDataMap.east);
        const $$westBuf   = await $$fetchFace($$faceDataMap.west);

        if($$particleBuf) AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_particle.png", $$particleBuf);
        if($$topBuf)    AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_top.png", $$topBuf);
        if($$bottomBuf) AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_bottom.png", $$bottomBuf);
        if($$northBuf)  AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_north.png", $$northBuf);
        if($$southBuf)  AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_south.png", $$southBuf);
        if($$eastBuf)   AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_east.png", $$eastBuf);
        if($$westBuf)   AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_west.png", $$westBuf);

        // Also save fallback as main texture for particle effects
        if($$particleBuf || $$northBuf || $$topBuf) {
            AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}.png", $$particleBuf||$$northBuf||$$topBuf);
        }

        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/block/${blockId}.json",
            JSON.stringify({
                parent: "block/cube",
                textures: {
                    particle: "blocks/${blockId}_particle",
                    up:    "blocks/${blockId}_top",
                    down:  "blocks/${blockId}_bottom",
                    north: "blocks/${blockId}_north",
                    south: "blocks/${blockId}_south",
                    east:  "blocks/${blockId}_east",
                    west:  "blocks/${blockId}_west"
                }
            })
        );
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${blockId}.json",
            JSON.stringify({
                parent: "block/${blockId}",
                display: {
                    thirdperson: {
                        rotation: [10, -45, 170],
                        translation: [0, 1.5, -2.75],
                        scale: [0.375, 0.375, 0.375]
                    }
                }
            })
        );
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/blockstates/${blockId}.json",
            JSON.stringify({
                variants: { normal: [{ model: "${blockId}" }] }
            })
        );`;

        } else if (texMode === "json") {
            // Custom Blockbench JSON model — textures are stored as data URIs embedded in customModelJson
            // The customModelJson field stores a JSON string where texture values are data URIs
            const rawModelJson = this.tags.customModelJson || "{}";
            let parsedModel = {};
            try { parsedModel = JSON.parse(rawModelJson); } catch(e) { parsedModel = {}; }

            // Extract texture entries and replace data URIs with resource path references
            const texKeys = Object.keys((parsedModel.textures) || {});
            const texEntries = texKeys.map(k => ({
                key: k,
                dataUri: (parsedModel.textures && parsedModel.textures[k]) || ""
            }));

            // Build cleaned model with paths
            const cleanedModel = JSON.parse(JSON.stringify(parsedModel));
            if (cleanedModel.textures) {
                texKeys.forEach(k => {
                    const val = cleanedModel.textures[k];
                    if (val && val.startsWith("data:")) {
                        const safeName = k.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
                        cleanedModel.textures[k] = `blocks/${blockId}_${safeName}`;
                    }
                });
            }

            // Generate code to upload each texture
            const texUploadLines = texEntries.map(({key, dataUri}) => {
                if (!dataUri || !dataUri.startsWith("data:")) return "";
                const safeName = key.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
                return `
        {
            const $$texBuf_${safeName} = await (await fetch(${JSON.stringify(dataUri)})).arrayBuffer();
            AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}_${safeName}.png", $$texBuf_${safeName});
            ${key === "particle" || key === "0" ? `AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${blockId}.png", $$texBuf_${safeName});` : ""}
        }`;
            }).join("\n");

            asyncSinkResourceSection = `
        // Custom JSON model mode
        ${texUploadLines}
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/block/${blockId}.json",
            JSON.stringify(${JSON.stringify(cleanedModel)})
        );
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${blockId}.json",
            JSON.stringify({
                parent: "block/${blockId}",
                display: {
                    thirdperson: {
                        rotation: [10, -45, 170],
                        translation: [0, 1.5, -2.75],
                        scale: [0.375, 0.375, 0.375]
                    }
                }
            })
        );
        AsyncSink.setFile(
            "resourcepacks/AsyncSinkLib/assets/minecraft/blockstates/${blockId}.json",
            JSON.stringify({
                variants: { normal: [{ model: "${blockId}" }] }
            })
        );`;
        }

        // Pick correct texture variable for existing code (single mode compat)
        const singleTexureVar = (texMode === "single") ? `const $$blockTexture = "${this.tags.texture}";` : `const $$blockTexture = "";`;

        return `(function AdvancedBlockDatablock() {
    ${singleTexureVar}

    function $$ServersideBlocks() {
        const $$scoped_efb_globals = {};
        var $$itemClass = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        var $$blockClass = ModAPI.reflect.getClassById("net.minecraft.block.Block");
        var $$iproperty = ModAPI.reflect.getClassById("net.minecraft.block.properties.IProperty").class;
        var $$makeBlockState = ModAPI.reflect.getClassById("${flags.target === "1_12" ? "net.minecraft.block.state.BlockStateContainer" : "net.minecraft.block.state.BlockState"}").constructors.find(x => x.length === 2);
        var $$blockSuper = ModAPI.reflect.getSuper($$blockClass, (x) => x.length === 2);

        var $$breakBlockMethod = $$blockClass.methods.breakBlock.method;
        var $$onBlockAddedMethod = $$blockClass.methods.onBlockAdded.method;
        var $$onBlockDestroyedByPlayerMethod = $$blockClass.methods.onBlockDestroyedByPlayer.method;
        var $$randomTickMethod = $$blockClass.methods.randomTick.method;
        var $$getDroppedItem = $$blockClass.methods.getItemDropped.method;
        var $$quantityDropped = $$blockClass.methods.quantityDropped.method;

        var $$nmb_AdvancedBlock = function $$nmb_AdvancedBlock() {
            $$blockSuper(this, ModAPI.materials.${this.tags.material}.getRef());
            ${flags.target === "1_12" ? "//" : ""}this.$defaultBlockState = this.$blockState.$getBaseState();
            // --- Block Properties ---
            this.$blockHardness = ${hardness};
            this.$blockResistance = ${resistance * 5};
            this.$lightValue = ${lightLevel};
            this.$lightOpacity = ${lightOpacity};
            this.$slipperiness = ${slipperiness};
            this.$needsRandomTick = ${needsRandomTick};
            ${constructorHandler.code};
        }
        ModAPI.reflect.prototypeStack($$blockClass, $$nmb_AdvancedBlock);
        $$nmb_AdvancedBlock.prototype.$isOpaqueCube = function () {
            return ${isOpaque};
        }
        $$nmb_AdvancedBlock.prototype.$createBlockState = function () {
            return $$makeBlockState(this, ModAPI.array.object($$iproperty, 0));
        }
        $$nmb_AdvancedBlock.prototype.$breakBlock = function (${breakHandler.args.join(", ")}) {
            ${breakHandler.code};
            return $$breakBlockMethod(this, ${breakHandler.args.join(", ")});
        }
        $$nmb_AdvancedBlock.prototype.$onBlockAdded = function (${addedHandler.args.join(", ")}) {
            ${addedHandler.code};
            return $$onBlockAddedMethod(this, ${addedHandler.args.join(", ")});
        }
        
        ${neighborHandler}

        $$nmb_AdvancedBlock.prototype.$onBlockDestroyedByPlayer = function (${brokenByPlayerHandler.args.join(", ")}) {
            ${brokenByPlayerHandler.code};
            return $$onBlockDestroyedByPlayerMethod(this, ${brokenByPlayerHandler.args.join(", ")});
        }
        $$nmb_AdvancedBlock.prototype.$randomTick = function (${randomTickHandler.args.join(", ")}) {
            ${randomTickHandler.code};
            return $$randomTickMethod(this, ${randomTickHandler.args.join(", ")});
        }
        $$nmb_AdvancedBlock.prototype.$tickRate = function () {
            return ${Math.max(1, Math.floor(this.tags.tickRatio || 10))};
        }
        
        ${entityCollisionHandler}

        $$nmb_AdvancedBlock.prototype.$getItemDropped = function (${getDroppedItemHandler.args.join(", ")}) {
            ${getDroppedItemHandler.code};
            return $$getDroppedItem(this, ${getDroppedItemHandler.args.join(", ")});
        }
        $$nmb_AdvancedBlock.prototype.$quantityDropped = function (${quantityDroppedHandler.args.join(", ")}) {
            ${quantityDroppedHandler.code};
            return $$quantityDropped(this, ${quantityDroppedHandler.args.join(", ")});
        }
        $$nmb_AdvancedBlock.prototype.$quantityDroppedWithBonus = function (${quantityDroppedHandler.args.reverse().join(", ")}) {
            ${quantityDroppedHandler.code};
            return $$quantityDropped(this, ${quantityDroppedHandler.args.reverse().join(", ")});
        }

        function $$internal_reg() {
            var $$cblock = (new $$nmb_AdvancedBlock()).$setUnlocalizedName(
                ModAPI.util.str("${this.tags.id}")
            );
            // Apply sound type
            ${flags.target === "1_12"
                ? `try { $$cblock.$setSoundType(ModAPI.blockSounds.${soundType112}.getRef()); } catch(e) {}`
                : `try { $$cblock.$setStepSound($$blockClass.staticVariables.${soundType18}); } catch(e) {}`
            }
            $$blockClass.staticMethods.registerBlock0.method(
                ModAPI.keygen.block("${this.tags.id}"),
                ModAPI.util.str("${this.tags.id}"),
                $$cblock
            );
            $$itemClass.staticMethods.registerItemBlock0.method($$cblock);
            efb2__fixupBlockIds();
            ModAPI.blocks["${this.tags.id}"] = $$cblock;
            return $$cblock;
        }

        if (ModAPI.materials) {
            return $$internal_reg();
        } else {
            ModAPI.addEventListener("bootstrap", $$internal_reg);
        }
    }
    ModAPI.dedicatedServer.appendCode($$ServersideBlocks);
    var $$cblock = $$ServersideBlocks();
    ModAPI.addEventListener("lib:asyncsink", async () => {
        ModAPI.addEventListener("lib:asyncsink:registeritems", ($$renderItem)=>{
            $$renderItem.registerBlock($$cblock, ModAPI.util.str("${this.tags.id}"));
        });
        AsyncSink.L10N.set("tile.${this.tags.id}.name", "${this.tags.name}");

        ${asyncSinkResourceSection}
    });
})();`;
    }
};
