PRIMITIVES["custom_dimension"] = {
    name: "Custom Dimension",
    uses: ["fixup_block_ids"],
    type: "custom_dimension",
    tags: {
        // Dimension identity
        dimensionId: 7,          // int — pick a free ID (avoid -1, 0, 1)
        dimensionName: "The Void Realm",

        // Portal frame block — what the portal is built out of
        frameBlock: VALUE_ENUMS.ABSTRACT_BLOCK,
        lf0: VALUE_ENUMS.NEWLINE,

        // Portal interior block (the glowing portal block itself)
        // Leave as abstract — this will be a new registered block
        portalBlockName: "void_portal",

        // Sky / fog colours (hex integers)
        skyColor: 0x080010,
        fogColor: 0x200040,

        // Terrain — all blocks are chosen from the block selector
        terrainMainBlock: VALUE_ENUMS.ABSTRACT_BLOCK,   // fills the world (like end stone)
        lf1: VALUE_ENUMS.NEWLINE,
        terrainSurfaceBlock: VALUE_ENUMS.ABSTRACT_BLOCK, // top layer (like grass)
        lf2: VALUE_ENUMS.NEWLINE,
        terrainFluidBlock: VALUE_ENUMS.ABSTRACT_BLOCK,   // lakes/seas (use air for none)
        lf3: VALUE_ENUMS.NEWLINE,

        // Ore gen in this dimension — uses the ore_generation primitive separately
        // (dimension ID must match what you set above)

        // World shape
        seaLevel: 63,
        buildHeight: 256,
        enableCaves: true,
    },
    getDependencies: function () {
        return []; // portal block is registered by this primitive itself
    },
    asJavaScript: function () {
        // Parse all block tags
        function parseBlock(tag) {
            var raw = (tag || "block/stone").replace("block/", "").replace("item/", "");
            var parts = raw.split("@");
            return { id: parts[0], meta: parseInt(parts[1]) || 0 };
        }

        var frame   = parseBlock(this.tags.frameBlock);
        var main    = parseBlock(this.tags.terrainMainBlock);
        var surface = parseBlock(this.tags.terrainSurfaceBlock);
        var fluid   = parseBlock(this.tags.terrainFluidBlock);

        var dimId       = parseInt(this.tags.dimensionId)  || 7;
        var dimName     = String(this.tags.dimensionName   || "Custom Dimension").replace(/"/g, '');
        var portalId    = String(this.tags.portalBlockName || "void_portal").replace(/[^a-z0-9_]/g, '_');
        var skyColor    = parseInt(this.tags.skyColor)     || 0x080010;
        var fogColor    = parseInt(this.tags.fogColor)     || 0x200040;
        var seaLevel    = parseInt(this.tags.seaLevel)     || 63;
        var enableCaves = this.tags.enableCaves !== false;

        var salt = "XXXXXX".split("").map(() => Math.floor(Math.random() * 10)).join("");

        return `(function CustomDimensionDatablock_${salt}() {
    // ============================================================
    // 1.  PORTAL BLOCK — registered like any advanced block
    //     Lit by flint-and-steel on the correct frame pattern.
    //     Touching the portal teleports entities to the custom dim.
    // ============================================================
    function $$registerPortalBlock() {
        const $$scoped_efb_globals = {};
        var $$itemClass  = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        var $$blockClass = ModAPI.reflect.getClassById("net.minecraft.block.Block");
        var $$iproperty  = ModAPI.reflect.getClassById("net.minecraft.block.properties.IProperty").class;
        var $$makeBS18   = null, $$makeBS112 = null;
        try { $$makeBS18  = ModAPI.reflect.getClassById("net.minecraft.block.state.BlockState").constructors.find(x => x.length === 2); } catch(e){}
        try { $$makeBS112 = ModAPI.reflect.getClassById("net.minecraft.block.state.BlockStateContainer").constructors.find(x => x.length === 2); } catch(e){}
        var $$makeBlockState = $$makeBS112 || $$makeBS18;
        var $$blockSuper = ModAPI.reflect.getSuper($$blockClass, x => x.length === 2);
        var $$breakBlockMethod = $$blockClass.methods.breakBlock.method;

        var $$PortalBlock = function $$PortalBlock() {
            $$blockSuper(this, ModAPI.materials.portal.getRef());
            if (typeof flags !== "undefined" && flags.target !== "1_12") {
                this.$defaultBlockState = this.$blockState.$getBaseState();
            }
            // Portal block properties
            this.$lightValue     = 11;
            this.$translucent    = 1;
            this.$fullBlock      = 0;
        };
        ModAPI.reflect.prototypeStack($$blockClass, $$PortalBlock);

        $$PortalBlock.prototype.$createBlockState = function () {
            return $$makeBlockState(this, ModAPI.array.object($$iproperty, 0));
        };
        $$PortalBlock.prototype.$isOpaqueCube = function () { return 0; };
        $$PortalBlock.prototype.$isFullCube    = function () { return 0; };
        $$PortalBlock.prototype.$getLightValue = function () { return 11; };

        // When an entity walks into the portal, teleport it
        $$PortalBlock.prototype.$onEntityCollidedWithBlock = function ($world, $pos, $state, $entity) {
            if (!$$isEntityPlayer($entity)) return;
            if ($world.$isRemote) return;

            // Cooldown to avoid rapid fire teleports
            if ($entity[\`$$efb_dimPortalCooldown_${salt}\`] > 0) {
                $entity[\`$$efb_dimPortalCooldown_${salt}\`]--;
                return;
            }
            $entity[\`$$efb_dimPortalCooldown_${salt}\`] = 80;

            var $$currentDim = $world.$provider.$dimensionId !== undefined
                ? $world.$provider.$dimensionId
                : ($world.$provider.$getDimensionType ? $world.$provider.$getDimensionType().$getId() : 0);

            var $$targetDim = ($$currentDim === ${dimId}) ? 0 : ${dimId};
            $$teleportToDim($entity, $$targetDim, $world);
        };

        $$PortalBlock.prototype.$breakBlock = function ($world, $pos, $state) {
            return $$breakBlockMethod(this, $world, $pos, $state);
        };

        function $$internal_reg() {
            var $$cblock = (new $$PortalBlock()).$setUnlocalizedName(ModAPI.util.str("${portalId}"));
            $$blockClass.staticMethods.registerBlock0.method(
                ModAPI.keygen.block("${portalId}"),
                ModAPI.util.str("${portalId}"),
                $$cblock
            );
            $$itemClass.staticMethods.registerItemBlock0.method($$cblock);
            efb2__fixupBlockIds();
            ModAPI.blocks["${portalId}"] = $$cblock;
            return $$cblock;
        }

        var $$portalBlock = ModAPI.materials ? $$internal_reg() : null;
        if (!$$portalBlock) ModAPI.addEventListener("bootstrap", $$internal_reg);
        return $$portalBlock;
    }

    // ============================================================
    // 2.  FRAME VALIDATION — check that a 4×5 or 5×4 frame of
    //     frameBlock surrounds the position that was lit.
    //     Returns array of interior positions or null.
    // ============================================================
    function $$validatePortalFrame($world, $litPos) {
        var $$frameId   = "${frame.id}";
        var $$frameMeta = ${frame.meta};
        var $$frameBlock = ModAPI.blocks[$$frameId];
        if (!$$frameBlock) return null;

        var $$px = $litPos.$x, $$py = $litPos.$y, $$pz = $litPos.$z;
        var BlockPos = ModAPI.reflect.getClassById("net.minecraft.util.BlockPos").constructors.find(x => x.length === 3);

        // Try both X-axis and Z-axis orientations
        var $$axes = [{dx:1, dz:0}, {dx:0, dz:1}];
        for (var $$ai = 0; $$ai < $$axes.length; $$ai++) {
            var $$ax = $$axes[$$ai].dx, $$az = $$axes[$$ai].dz;
            // Search for a valid 2-wide 3-tall interior (nether portal shape)
            for (var $$startX = -1; $$startX <= 1; $$startX++) {
                for (var $$startY = -1; $$startY <= 3; $$startY++) {
                    var $$valid = true;
                    var $$interior = [];
                    // Check 2 wide, 3 tall interior + 1 block border
                    for (var $$iy = 0; $$iy < 3; $$iy++) {
                        for (var $$ix = 0; $$ix < 2; $$ix++) {
                            var $$wx = $$px + ($$startX + $$ix) * $$ax;
                            var $$wy = $$py + $$startY + $$iy;
                            var $$wz = $$pz + ($$startX + $$ix) * $$az;
                            $$interior.push(BlockPos($$wx, $$wy, $$wz));
                        }
                    }
                    // Border must be frameBlock, interior must be air
                    var $$borderPositions = [];
                    // Top and bottom rows (3 wide)
                    for (var $$bx = -1; $$bx <= 2; $$bx++) {
                        $$borderPositions.push(BlockPos($$px + ($$startX + $$bx) * $$ax, $$py + $$startY - 1,     $$pz + ($$startX + $$bx) * $$az));
                        $$borderPositions.push(BlockPos($$px + ($$startX + $$bx) * $$ax, $$py + $$startY + 3,     $$pz + ($$startX + $$bx) * $$az));
                    }
                    // Side columns
                    for (var $$by = 0; $$by < 3; $$by++) {
                        $$borderPositions.push(BlockPos($$px + ($$startX - 1) * $$ax, $$py + $$startY + $$by, $$pz + ($$startX - 1) * $$az));
                        $$borderPositions.push(BlockPos($$px + ($$startX + 2) * $$ax, $$py + $$startY + $$by, $$pz + ($$startX + 2) * $$az));
                    }
                    // Validate border = frameBlock
                    for (var $$bi = 0; $$bi < $$borderPositions.length; $$bi++) {
                        try {
                            var $$bs = $world.$getBlockState($$borderPositions[$$bi]);
                            if (!$$bs || $$bs.$getBlock() !== $$frameBlock.getRef()) {
                                $$valid = false; break;
                            }
                        } catch(e) { $$valid = false; break; }
                    }
                    if (!$$valid) continue;
                    // Validate interior = air
                    for (var $$ii = 0; $$ii < $$interior.length; $$ii++) {
                        try {
                            var $$bs2 = $world.$getBlockState($$interior[$$ii]);
                            if ($$bs2 && $$bs2.$getBlock() !== ModAPI.blocks.air.getRef()) {
                                $$valid = false; break;
                            }
                        } catch(e) { $$valid = false; break; }
                    }
                    if ($$valid) return $$interior;
                }
            }
        }
        return null;
    }

    // ============================================================
    // 3.  FLINT AND STEEL HOOK — detect right-click on frameBlock
    //     and fill the interior with portalBlock.
    // ============================================================
    function $$registerFlintSteelHook($portalBlock) {
        var $$flintSteelItem = ModAPI.items["flint_and_steel"];
        if (!$$flintSteelItem) { console.warn("EFB: flint_and_steel not found"); return; }

        // Hook ItemFlintAndSteel.onItemUse (1.8) or onItemUse (1.12)
        var $$onUseKey = null;
        try {
            $$onUseKey = ModAPI.util.getMethodFromPackage("net.minecraft.item.ItemFlintAndSteel", "onItemUse");
        } catch(e) {}
        // 1.12: different method name
        if (!$$onUseKey) {
            try {
                $$onUseKey = ModAPI.util.getMethodFromPackage("net.minecraft.item.ItemFlintAndSteel", "onItemUse0");
            } catch(e) {}
        }
        if (!$$onUseKey || !ModAPI.hooks.methods[$$onUseKey]) {
            console.warn("EFB: Could not hook ItemFlintAndSteel.onItemUse for portal ignition");
            return;
        }

        var $$oldUse = ModAPI.hooks.methods[$$onUseKey];
        ModAPI.hooks.methods[$$onUseKey] = function ($this, $itemstack, $player, $world, $pos, $facing, $fx, $fy, $fz) {
            // Let vanilla run first (so normal nether portals still work)
            var $$ret = $$oldUse.apply(this, arguments);

            if ($world.$isRemote) return $$ret;

            // Check if the clicked block is our frame block
            var $$clickedState = $world.$getBlockState($pos);
            var $$frameBlock   = ModAPI.blocks["${frame.id}"];
            if (!$$frameBlock || !$$clickedState) return $$ret;
            if ($$clickedState.$getBlock() !== $$frameBlock.getRef()) return $$ret;

            // Validate frame shape starting from the clicked face
            var $$BlockPos = ModAPI.reflect.getClassById("net.minecraft.util.BlockPos").constructors.find(x => x.length === 3);
            // Check the block adjacent to the clicked face
            var $$adjacentPos = $$BlockPos($pos.$x, $pos.$y + 1, $pos.$z);
            var $$interior = $$validatePortalFrame($world, $$adjacentPos);
            if (!$$interior) {
                $$adjacentPos = $$BlockPos($pos.$x, $pos.$y, $pos.$z);
                $$interior = $$validatePortalFrame($world, $$adjacentPos);
            }
            if (!$$interior) return $$ret;

            // Fill interior with portal block
            var $$portalState = $portalBlock.$getDefaultState ? $portalBlock.$getDefaultState() : $portalBlock.$blockState.$getBaseState();
            for (var $$pi = 0; $$pi < $$interior.length; $$pi++) {
                $world.$setBlockState($$interior[$$pi], $$portalState, 3);
            }

            // Play portal sound
            try {
                $world.$playSound(null, $pos.$x, $pos.$y, $pos.$z,
                    ModAPI.reflect.getClassById("net.minecraft.util.SoundEvent")
                        ? null
                        : ModAPI.util.str("portal.trigger"),
                    1.0, 1.0
                );
            } catch(e) {}

            return $$ret;
        };
    }

    // ============================================================
    // 4.  TELEPORTATION — transfer player to/from the dimension.
    //     Uses the server's PlayerList transferPlayerToDimension.
    // ============================================================
    function $$isEntityPlayer($entity) {
        try {
            var $$EP = ModAPI.reflect.getClassByName("EntityPlayer");
            return $$EP && $$EP.instanceOf($entity);
        } catch(e) { return false; }
    }

    function $$teleportToDim($entity, $$targetDim, $world) {
        try {
            // Ensure dimension is registered first
            $$ensureDimRegistered();

            var $$server = null;
            try {
                $$server = ModAPI.reflect.getClassById("net.minecraft.server.MinecraftServer").staticMethods.getServer.method();
            } catch(e) {}
            if (!$$server) {
                $$server = ModAPI.reflect.getClassById("net.minecraft.server.MinecraftServer").staticVariables.server;
            }
            if (!$$server) { console.error("EFB: Server not found for teleport"); return; }

            // 1.8: getConfigurationManager()  /  1.12: getPlayerList()
            var $$playerList = null;
            try {
                $$playerList = $$server.$getPlayerList ? $$server.$getPlayerList() : $$server.$getConfigurationManager();
            } catch(e) {}
            if (!$$playerList) { console.error("EFB: PlayerList not found"); return; }

            // Build a basic Teleporter that just places the player at spawn height
            var $$TeleporterClass = ModAPI.reflect.getClassById("net.minecraft.world.Teleporter");
            var $$TeleporterSuper = ModAPI.reflect.getSuper($$TeleporterClass, x => x.length === 1);
            var $$worldServer     = $$server.$worldServerForDimension
                ? $$server.$worldServerForDimension($$targetDim)
                : ($$server.$getWorld ? $$server.$getWorld($$targetDim) : null);

            if (!$$worldServer) { console.error("EFB: WorldServer for dim " + $$targetDim + " not found"); return; }

            function $$CustomTeleporter($$ws) {
                $$TeleporterSuper(this, $$ws);
                this.$$worldServer = $$ws;
            }
            ModAPI.reflect.prototypeStack($$TeleporterClass, $$CustomTeleporter);

            $$CustomTeleporter.prototype.$placeInPortal = function ($$ent, $$rotYaw) {
                // Find a safe Y above the surface
                var $$x = Math.floor($$ent.$posX);
                var $$z = Math.floor($$ent.$posZ);
                var $$y = 64;
                for (var $$sy = 200; $$sy > 1; $$sy--) {
                    try {
                        var $$bpos = ModAPI.reflect.getClassById("net.minecraft.util.BlockPos").constructors.find(c=>c.length===3)($$x, $$sy, $$z);
                        var $$state = this.$$worldServer.$getBlockState($$bpos);
                        if ($$state && $$state.$getBlock() !== ModAPI.blocks.air.getRef()) {
                            $$y = $$sy + 1;
                            break;
                        }
                    } catch(e) {}
                }
                $$ent.$setPositionAndUpdate($$x + 0.5, $$y, $$z + 0.5);
            };
            $$CustomTeleporter.prototype.$makePortal    = function ($$ent) { return true; };
            $$CustomTeleporter.prototype.$isVanilla     = function () { return false; };

            var $$teleporter = new $$CustomTeleporter($$worldServer);
            $$playerList.$transferPlayerToDimension($entity, $$targetDim, $$teleporter);
        } catch ($$e) {
            console.error("EFB: Teleport failed:", $$e);
        }
    }

    // ============================================================
    // 5.  DIMENSION REGISTRATION
    //     Registers dimension ID ${dimId} with the DimensionManager.
    //     Uses a WorldProvider subclass based on WorldProviderSurface
    //     with overridden sky/fog colour and chunk provider.
    // ============================================================
    var $$dimRegistered = false;
    function $$ensureDimRegistered() {
        if ($$dimRegistered) return;
        $$dimRegistered = true;
        try {
            var $$DimManager = ModAPI.reflect.getClassByName("DimensionManager");
            if (!$$DimManager) {
                // 1.12
                $$DimManager = ModAPI.reflect.getClassById("net.minecraftforge.common.DimensionManager");
            }
            if (!$$DimManager) { console.warn("EFB: DimensionManager not found — dim may not load"); return; }

            // Build WorldProvider subclass
            var $$WPS = ModAPI.reflect.getClassByName("WorldProviderSurface");
            if (!$$WPS) $$WPS = ModAPI.reflect.getClassById("net.minecraft.world.WorldProviderSurface");
            if (!$$WPS) { console.warn("EFB: WorldProviderSurface not found"); return; }

            var $$WPSuper = ModAPI.reflect.getSuper($$WPS, x => x.length === 0);
            if (!$$WPSuper) { console.warn("EFB: WorldProviderSurface super not found"); return; }

            function $$CustomProvider() {
                $$WPSuper(this);
                this.$dimensionId = ${dimId};
            }
            ModAPI.reflect.prototypeStack($$WPS, $$CustomProvider);

            // Sky / fog colour
            $$CustomProvider.prototype.$getSkyColor = function ($$entity, $$partial) {
                return ${skyColor};
            };
            $$CustomProvider.prototype.$getFogColor = function ($$celestial, $$partial) {
                return ${fogColor};
            };
            $$CustomProvider.prototype.$isSurfaceWorld = function () { return true; };
            $$CustomProvider.prototype.$getDimensionName = function () {
                return ModAPI.util.str("${dimName}");
            };
            $$CustomProvider.prototype.$doesXZShowFog = function ($$x, $$z) { return false; };

            // Register
            if ($$DimManager.staticMethods && $$DimManager.staticMethods.registerDimension) {
                $$DimManager.staticMethods.registerDimension.method(${dimId}, ModAPI.util.asClass($$CustomProvider));
            } else if ($$DimManager.registerDimension) {
                $$DimManager.registerDimension(${dimId}, ModAPI.util.asClass($$CustomProvider));
            }

            console.log("EFB: Registered dimension ${dimId} '${dimName}'");
        } catch ($$e) {
            console.error("EFB: Dimension registration failed:", $$e);
        }
    }

    // ============================================================
    // 6.  TERRAIN GENERATION — hook ChunkProvider for our dimension
    //     to replace the block palette with the configured blocks.
    //     We hook the overworld's populate and setBlockState chain
    //     to swap blocks when the world is our custom dimension.
    //     This is done by hooking generateChunk / provideChunk.
    // ============================================================
    function $$registerTerrainGen() {
        // We hook the method that sets block states during chunk generation.
        // For the custom dimension the ChunkProvider is the default surface one,
        // but we intercept block placement to replace stone→main, grass→surface,
        // water→fluid.

        var $$genChunkKey = null;
        var $$classes = [
            "net.minecraft.world.gen.ChunkProviderGenerate",
            "net.minecraft.world.gen.ChunkGeneratorOverworld"
        ];
        for (var $$ci = 0; $$ci < $$classes.length && !$$genChunkKey; $$ci++) {
            try {
                var $$k = ModAPI.util.getMethodFromPackage($$classes[$$ci], "provideChunk");
                if ($$k && ModAPI.hooks.methods[$$k]) $$genChunkKey = $$k;
            } catch(e) {}
            try {
                var $$k2 = ModAPI.util.getMethodFromPackage($$classes[$$ci], "generateChunk");
                if ($$k2 && ModAPI.hooks.methods[$$k2]) $$genChunkKey = $$k2;
            } catch(e) {}
        }

        if (!$$genChunkKey) { console.warn("EFB: Could not hook chunk gen for custom dim terrain"); return; }

        var $$mainBlock    = ModAPI.blocks["${main.id}"];
        var $$surfaceBlock = ModAPI.blocks["${surface.id}"];
        var $$fluidBlock   = ModAPI.blocks["${fluid.id}"];
        var $$stoneBlock   = ModAPI.blocks["stone"];
        var $$grassBlock   = ModAPI.blocks["grass"];
        var $$waterBlock   = ModAPI.blocks["water"];
        var $$dirtBlock    = ModAPI.blocks["dirt"];

        var $$oldGen = ModAPI.hooks.methods[$$genChunkKey];
        ModAPI.hooks.methods[$$genChunkKey] = function ($this, $x, $z) {
            // Check dimension
            var $$wld = $this.$worldObj;
            var $$inOurDim = false;
            if ($$wld) {
                var $$p = $$wld.$provider;
                if ($$p) {
                    var $$did = $$p.$dimensionId !== undefined ? $$p.$dimensionId : ($$p.$getDimensionType ? $$p.$getDimensionType().$getId() : -999);
                    $$inOurDim = ($$did === ${dimId});
                }
            }

            var $$chunk = $$oldGen.apply(this, [$x, $z]);
            if (!$$inOurDim || !$$chunk) return $$chunk;

            // Remap blocks inside the chunk's block data
            // We iterate over the chunk's ExtendedBlockStorage array
            try {
                var $$sections = $$chunk.$getBlockStorageArray ? $$chunk.$getBlockStorageArray() : $$chunk.$storageArrays;
                if (!$$sections) return $$chunk;
                var $$sData = $$sections.data || $$sections;
                for (var $$si = 0; $$si < $$sData.length; $$si++) {
                    var $$sec = $$sData[$$si];
                    if (!$$sec) continue;
                    // For each block position in this 16x16x16 section:
                    for (var $$by = 0; $$by < 16; $$by++) {
                        for (var $$bz = 0; $$bz < 16; $$bz++) {
                            for (var $$bx = 0; $$bx < 16; $$bx++) {
                                try {
                                    var $$state = $$sec.$get($$bx, $$by, $$bz);
                                    if (!$$state) continue;
                                    var $$blk   = $$state.$getBlock();
                                    var $$newState = null;
                                    if ($$stoneBlock && $$blk === $$stoneBlock.getRef()) {
                                        $$newState = $$mainBlock ? $$mainBlock.getStateFromMeta(${main.meta}).getRef() : null;
                                    } else if ($$grassBlock && $$blk === $$grassBlock.getRef()) {
                                        $$newState = $$surfaceBlock ? $$surfaceBlock.getStateFromMeta(${surface.meta}).getRef() : null;
                                    } else if ($$dirtBlock && $$blk === $$dirtBlock.getRef()) {
                                        $$newState = $$mainBlock ? $$mainBlock.getStateFromMeta(${main.meta}).getRef() : null;
                                    } else if ($$waterBlock && $$blk === $$waterBlock.getRef()) {
                                        $$newState = $$fluidBlock ? $$fluidBlock.getStateFromMeta(${fluid.meta}).getRef() : $$state;
                                    }
                                    if ($$newState && $$newState !== $$state) {
                                        $$sec.$set($$bx, $$by, $$bz, $$newState);
                                    }
                                } catch(e) {}
                            }
                        }
                    }
                }
            } catch(e) {
                console.error("EFB: Terrain remap error:", e);
            }
            return $$chunk;
        };
    }

    // ============================================================
    // 7.  ASYNC SINK — register portal block texture
    // ============================================================
    function $$registerPortalAssets() {
        ModAPI.addEventListener("lib:asyncsink", () => {
            ModAPI.addEventListener("lib:asyncsink:registeritems", ($$renderItem) => {
                var $$pb = ModAPI.blocks["${portalId}"];
                if ($$pb) $$renderItem.registerBlock($$pb, ModAPI.util.str("${portalId}"));
            });
            AsyncSink.L10N.set("tile.${portalId}.name", "Portal");

            // Simple glowing purple/blue portal model
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/models/block/${portalId}.json",
                JSON.stringify({
                    "parent": "block/portal",
                    "textures": { "all": "blocks/${portalId}" }
                })
            );
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${portalId}.json",
                JSON.stringify({ "parent": "block/${portalId}" })
            );
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/blockstates/${portalId}.json",
                JSON.stringify({ "variants": { "normal": [{ "model": "${portalId}" }] } })
            );

            // Generate a simple procedural portal texture (purple/blue animated look)
            // Uses a 16x16 canvas painted to an ArrayBuffer
            var $$canvas = document.createElement("canvas");
            $$canvas.width = $$canvas.height = 16;
            var $$ctx = $$canvas.getContext("2d");
            for (var $$py = 0; $$py < 16; $$py++) {
                for (var $$px = 0; $$px < 16; $$px++) {
                    var $$n = (Math.sin($$px * 0.9 + $$py * 0.7) + 1) / 2;
                    var $$r = Math.floor(30 + $$n * 60);
                    var $$g = Math.floor(0 + $$n * 20);
                    var $$b = Math.floor(120 + $$n * 100);
                    var $$a = Math.floor(160 + $$n * 80);
                    $$ctx.fillStyle = \`rgba(\${$$r},\${$$g},\${$$b},\${$$a/255})\`;
                    $$ctx.fillRect($$px, $$py, 1, 1);
                }
            }
            $$canvas.toBlob(blob => {
                blob.arrayBuffer().then(ab => {
                    AsyncSink.setFile(
                        "resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${portalId}.png",
                        ab
                    );
                });
            }, "image/png");
        });
    }

    // ============================================================
    // 8.  BOOT SEQUENCE
    // ============================================================
    ModAPI.dedicatedServer.appendCode(() => {
        $$ensureDimRegistered();
        var $$pb = $$registerPortalBlock();
        if ($$pb) {
            $$registerFlintSteelHook($$pb);
            $$registerTerrainGen();
        } else {
            ModAPI.addEventListener("bootstrap", () => {
                var $$pb2 = ModAPI.blocks["${portalId}"];
                if ($$pb2) {
                    $$registerFlintSteelHook($$pb2);
                    $$registerTerrainGen();
                }
            });
        }
    });

    // Client side: just register the portal block visuals
    (function() {
        var $$pb = $$registerPortalBlock();
        $$registerPortalAssets();
    })();
})();`;
    }
}
