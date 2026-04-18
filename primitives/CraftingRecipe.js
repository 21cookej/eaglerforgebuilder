//TODO: quantityDropped, onBlockDestroyedByExplosion, onBlockActivated
PRIMITIVES["recipe"] = {
    name: "Crafting Recipe",
    uses: [],
    type: "recipe",
    tags: {
        slot0: VALUE_ENUMS.ABSTRACT_ITEM,
        slot1: VALUE_ENUMS.ABSTRACT_ITEM,
        slot2: VALUE_ENUMS.ABSTRACT_ITEM,
        lf0: VALUE_ENUMS.NEWLINE,
        slot3: VALUE_ENUMS.ABSTRACT_ITEM,
        slot4: VALUE_ENUMS.ABSTRACT_ITEM,
        slot5: VALUE_ENUMS.ABSTRACT_ITEM,
        lf1: VALUE_ENUMS.NEWLINE,
        slot6: VALUE_ENUMS.ABSTRACT_ITEM,
        slot7: VALUE_ENUMS.ABSTRACT_ITEM,
        slot8: VALUE_ENUMS.ABSTRACT_ITEM,
        lf2: VALUE_ENUMS.NEWLINE,
        lf3: VALUE_ENUMS.NEWLINE,
        resultQuantity: 1,
        result: VALUE_ENUMS.ABSTRACT_ITEM,
        lf4: VALUE_ENUMS.NEWLINE,
        ModifyResult: VALUE_ENUMS.ABSTRACT_HANDLER + "CraftingRecipeModifyResult",
    },
    getDependencies: function () {
        const matchesList = new Set([].bake().dynamicConcat("block_advanced", "id", (x) => {
            return "block/" + x + "@0"
        }).dynamicConcat("item", "id", (x) => {
            return "item/" + x
        }).calculate());

        // We need to strip the @meta suffix when looking up dependencies
        // so "item/dye@4" correctly matches a custom item "item/dye"
        const possibleDepsList = new Set([
            this.tags.slot0,
            this.tags.slot1,
            this.tags.slot2,
            this.tags.slot3,
            this.tags.slot4,
            this.tags.slot5,
            this.tags.slot6,
            this.tags.slot7,
            this.tags.slot8,
            this.tags.result
        ]);

        const deps = [];
        possibleDepsList.forEach(entry => {
            if (!entry || entry === VALUE_ENUMS.ABSTRACT_ITEM || entry === "item/air") return;

            // Strip @meta for dependency lookup
            const baseEntry = entry.split("@")[0];

            if (baseEntry.startsWith("block/")) {
                const id = baseEntry.replace("block/", "");
                const dep = state.nodes.find(y => y.type === "block_advanced" && y.tags.id === id);
                if (dep) deps.push(dep);
            } else if (baseEntry.startsWith("item/")) {
                const id = baseEntry.replace("item/", "");
                const dep = state.nodes.find(y => y.type === "item" && y.tags.id === id);
                if (dep) deps.push(dep);
            }
        });

        return deps;
    },
    asJavaScript: function () {
        Object.keys(this.tags).forEach(k => {
            this.tags[k] = (this.tags[k] === VALUE_ENUMS.ABSTRACT_ITEM) ? "item/air" : this.tags[k];
        });
        const grid = [
            [this.tags.slot0, this.tags.slot1, this.tags.slot2],
            [this.tags.slot3, this.tags.slot4, this.tags.slot5],
            [this.tags.slot6, this.tags.slot7, this.tags.slot8]
        ];
        var minX = 2;
        var minY = 2;
        var maxX = 0;
        var maxY = 0;
        for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            for (let x = 0; x < row.length; x++) {
                const cell = row[x];
                if (cell === "item/air") {
                    continue;
                }
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
        minX = Math.min(minX, maxX);
        minY = Math.min(minY, maxY);
        maxX = Math.max(maxX, minX);
        maxY = Math.max(maxY, minY);
        const newGrid = (new Array((maxY + 1) - minY)).fill([]).map(() => (new Array((maxX + 1) - minX)).fill("item/air"));
        for (let x = minX; x < (maxX + 1); x++) {
            for (let y = minY; y < (maxY + 1); y++) {
                newGrid[y - minY][x - minX] = grid[y][x];
            }
        }
        const uniqueTypesMap = Object.fromEntries([...new Set(newGrid.flat())].filter(x => x !== "item/air").map((x, i) => {
            return [x, String.fromCharCode(65 + i)];
        }));
        const uniqueTypesMapReverse = Object.fromEntries([...new Set(newGrid.flat())].filter(x => x !== "item/air").map((x, i) => {
            return [String.fromCharCode(65 + i), x];
        }));

        /**
         * Parse a slot entry like "item/dye@4" or "block/wool@3" into parts.
         * Returns { type: "item"|"block", id: string, meta: number }
         */
        function parseSlotEntry(entry) {
            if (!entry || entry === "item/air") return { type: "item", id: "air", meta: 0 };
            const atIdx = entry.lastIndexOf("@");
            const meta = atIdx !== -1 ? (parseInt(entry.slice(atIdx + 1)) || 0) : 0;
            const base = atIdx !== -1 ? entry.slice(0, atIdx) : entry;
            const slashIdx = base.indexOf("/");
            const type = base.slice(0, slashIdx);
            const id = base.slice(slashIdx + 1);
            return { type, id, meta };
        }

        var legendStr = "";
        const ks = Object.keys(uniqueTypesMapReverse);
        ks.forEach((k, i) => {
            const parsed = parseSlotEntry(uniqueTypesMapReverse[k]);

            if (flags.target === "1_12") {
                legendStr += `"${k}": {
                item: "minecraft:${parsed.id}",
                ${parsed.meta !== 0 ? `data: ${parsed.meta}` : ""}
            }${ks.length === (i+1) ? "" : ","}`
            } else {
                legendStr += `"${k}": {
                type: "${parsed.type}",
                id: "${parsed.id}",
                ${parsed.meta !== 0 ? `meta: ${parsed.meta}` : ""}
            }${ks.length === (i+1) ? "" : ","}`
            }
        });

        var $$recipePattern = "";
        for (let y = 0; y < newGrid.length; y++) {
            const row = newGrid[y];
            $$recipePattern += '"';
            for (let x = 0; x < row.length; x++) {
                const cell = row[x];
                $$recipePattern += `${cell === "item/air" ? " " : uniqueTypesMap[cell]}`
            }
            $$recipePattern += '"';
            $$recipePattern += ",";
        }

        // Parse the result entry
        const resultParsed = parseSlotEntry(this.tags.result.replace("item/air", "block/air"));

        var modifyResultHandler = getHandlerCode("CraftingRecipeModifyResult", this.tags.ModifyResult, ["$$itemstack"]);

        if (flags.target === "1_12") {
            return `(function CraftingRecipeDatablock112() {

    async function registerRecipe(isServer) {
        if (isServer) {
            await new Promise((res, rej) => {
                ModAPI.addEventListener("bootstrap", res);
            });
        }
        const parseJson = ModAPI.reflect.getClassByName("JSONObject").constructors.findLast(x => x.length === 1);
        const CraftingManager = ModAPI.reflect.getClassByName("CraftingManager");
        const CraftingManagerMethods = CraftingManager.staticMethods;
        const jsonData = parseJson(ModAPI.util.str(\`{
            "type": "crafting_shaped",
            "pattern": [
    ${$$recipePattern}
  ],
  "key": {
    ${legendStr}
  },
  "result": {
    "item": "minecraft:${resultParsed.id}",
    "data": ${resultParsed.meta},
    "count": ${this.tags.resultQuantity}
  }
            }\`.trim()));
        const recipeObj = CraftingManagerMethods.func_193376_a.method(jsonData);
        CraftingManagerMethods.func_193379_a.method(ModAPI.util.str("coolrecipeid"), recipeObj);
    }

    ModAPI.dedicatedServer.appendCode(registerRecipe);
    registerRecipe(false);
})();
`;
        } else {
            // 1.8 recipe — build ingredient list with meta support
            // For each legend entry we need to handle item meta (damage value).
            // ItemStack constructors:
            //   [2] = (Block block, int amount, int meta)  — for blocks
            //   [4] = (Item item, int amount)              — for items (no meta)
            // For items WITH meta we use constructor [1] = (Item item, int amount, int meta)
            //   but to be safe we set itemDamage after construction if [1] doesn't exist.

            // Build per-key ingredient code as a JS snippet that will be evaluated at runtime.
            // We embed a helper that picks the right constructor.
            const legendEntriesCode = ks.map(k => {
                const parsed = parseSlotEntry(uniqueTypesMapReverse[k]);
                if (parsed.type === "block") {
                    return `"${k}": (function(){
                var $$blk = ModAPI.blocks["${parsed.id}"]?.getRef();
                if (!$$blk) return null;
                return $$itemStackFromBlockWithMeta($$blk, 1, ${parsed.meta});
            })()`;
                } else {
                    if (parsed.meta !== 0) {
                        // Item with metadata — use the 3-arg item constructor (index 1: Item, count, meta)
                        // or fall back to setting itemDamage manually
                        return `"${k}": (function(){
                var $$itm = ModAPI.items["${parsed.id}"]?.getRef();
                if (!$$itm) return null;
                var $$stk;
                var $$ctor3 = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack").constructors[1];
                if ($$ctor3 && $$ctor3.length === 3) {
                    $$stk = $$ctor3($$itm, 1, ${parsed.meta});
                } else {
                    $$stk = $$itemStackFromItem($$itm, 1);
                    if ($$stk) $$stk.$itemDamage = ${parsed.meta};
                }
                return $$stk;
            })()`;
                    } else {
                        return `"${k}": (function(){
                var $$itm = ModAPI.items["${parsed.id}"]?.getRef();
                return $$itm ? $$itemStackFromItem($$itm, 1) : null;
            })()`;
                    }
                }
            }).join(",\n");

            return `(function CraftingRecipeDatablock() {
    function $$registerRecipe() {
        function $$internalRegister() {
            const $$scoped_efb_globals = {};
            var $$ObjectClass = ModAPI.reflect.getClassById("java.lang.Object").class;
            function $$ToChar(char) {
                return ModAPI.reflect.getClassById("java.lang.Character").staticMethods.valueOf.method(char[0].charCodeAt(0));
            }
            var $$itemStackFromBlockWithMeta = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack").constructors[2];
            var $$itemStackFromItem = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack").constructors[4];

            // Build ingredient map — each value is an ItemStack (or Item ref for legacy)
            var $$recipeLegendStacks = {
                ${legendEntriesCode}
            };

            var $$recipeInternal = [];
            Object.keys($$recipeLegendStacks).forEach(($$key) => {
                $$recipeInternal.push($$ToChar($$key));
                $$recipeInternal.push($$recipeLegendStacks[$$key]);
            });

            var $$recipeContents = [${$$recipePattern}].map(row => ModAPI.util.str(row));
            var $$recipe = ModAPI.util.makeArray($$ObjectClass, $$recipeContents.concat($$recipeInternal));

            // Build result ItemStack
            var $$resultType = "${resultParsed.type}";
            var $$resultId = "${resultParsed.id}";
            var $$resultMeta = ${resultParsed.meta};
            var $$resultQty = ${this.tags.resultQuantity};
            var $$resultItem;
            if ($$resultType === "block") {
                var $$blk = ModAPI.blocks[$$resultId]?.getRef();
                $$resultItem = $$blk ? $$itemStackFromBlockWithMeta($$blk, $$resultQty, $$resultMeta) : null;
            } else {
                var $$itm = ModAPI.items[$$resultId]?.getRef();
                if ($$itm) {
                    var $$ctor3 = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack").constructors[1];
                    if ($$resultMeta !== 0 && $$ctor3 && $$ctor3.length === 3) {
                        $$resultItem = $$ctor3($$itm, $$resultQty, $$resultMeta);
                    } else {
                        $$resultItem = $$itemStackFromItem($$itm, $$resultQty);
                        if ($$resultMeta !== 0 && $$resultItem) $$resultItem.$itemDamage = $$resultMeta;
                    }
                }
            }

            if (!$$resultItem) {
                console.warn("EFB: Crafting recipe result item not found: " + $$resultId);
                return;
            }
            
            (function (${modifyResultHandler.args.join(",")}) {${modifyResultHandler.code}})($$resultItem);
            
            var $$craftingManager = ModAPI.reflect.getClassById("net.minecraft.item.crafting.CraftingManager").staticMethods.getInstance.method();
            ModAPI.hooks.methods.nmic_CraftingManager_addRecipe($$craftingManager, $$resultItem, $$recipe);
        }

        if (ModAPI.items) {
            $$internalRegister();
        } else {
            ModAPI.addEventListener("bootstrap", $$internalRegister);
        }
    }
    ModAPI.dedicatedServer.appendCode($$registerRecipe);
    $$registerRecipe();
})();`;
        }
    }
}
