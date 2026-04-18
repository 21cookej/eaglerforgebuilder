PRIMITIVES["furnace_recipe"] = {
    name: "Furnace Recipe",
    uses: [],
    type: "furnace_recipe",
    tags: {
        input: VALUE_ENUMS.ABSTRACT_ITEM,   // item/block to smelt
        lf0: VALUE_ENUMS.NEWLINE,
        lf1: VALUE_ENUMS.NEWLINE,
        resultQuantity: 1,                  // output count
        result: VALUE_ENUMS.ABSTRACT_ITEM,  // smelt result
        lf2: VALUE_ENUMS.NEWLINE,
        experience: 0.1,                    // xp gained
    },
    getDependencies: function () {
        const deps = [];
        [this.tags.input, this.tags.result].forEach(entry => {
            if (!entry || entry === "item/air" || entry === VALUE_ENUMS.ABSTRACT_ITEM) return;
            // Strip @meta for dep lookup
            const base = entry.split("@")[0];
            if (base.startsWith("block/")) {
                const id = base.replace("block/", "");
                const dep = state.nodes.find(y => y.type === "block_advanced" && y.tags.id === id);
                if (dep) deps.push(dep);
            } else if (base.startsWith("item/")) {
                const id = base.replace("item/", "");
                const dep = state.nodes.find(y => y.type === "item" && y.tags.id === id);
                if (dep) deps.push(dep);
            }
        });
        return deps;
    },
    asJavaScript: function () {
        const tags = { ...this.tags };
        Object.keys(tags).forEach(k => {
            tags[k] = (tags[k] === VALUE_ENUMS.ABSTRACT_ITEM) ? "item/air" : tags[k];
        });

        /**
         * Parse "item/dye@4" or "block/wool@3" → { type, id, meta }
         */
        function parseEntry(entry) {
            if (!entry || entry === "item/air") return null;
            const atIdx = entry.lastIndexOf("@");
            const meta = atIdx !== -1 ? (parseInt(entry.slice(atIdx + 1)) || 0) : 0;
            const base = atIdx !== -1 ? entry.slice(0, atIdx) : entry;
            const slashIdx = base.indexOf("/");
            const type = slashIdx !== -1 ? base.slice(0, slashIdx) : (base in (window.ModAPI?.blocks || {}) ? "block" : "item");
            const id = slashIdx !== -1 ? base.slice(slashIdx + 1) : base;
            return { type, id, meta };
        }

        const inputStr = tags.input;
        const resultStr = tags.result;
        const experience = parseFloat(tags.experience) || 0.1;
        const resultQuantity = parseInt(tags.resultQuantity) || 1;

        return `(function FurnaceRecipeDatablock() {
    async function $$registerFurnaceRecipe(isServer) {
        await new Promise((res) => {
            if (!isServer) {
                res();
            } else {
                ModAPI.addEventListener("bootstrap", res);
            }
        });

        try {
            const FurnaceRecipesInstance = ModAPI.util.wrap(
                ModAPI.reflect.getClassByName("FurnaceRecipes").staticVariables.smeltingBase
            );

            var $$ItemStackClass = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
            var $$ctor2arg = $$ItemStackClass.constructors[1]; // (Item, count, meta) if len===3
            var $$ctorBlock = $$ItemStackClass.constructors[2]; // (Block, count, meta)
            var $$ctorItem  = $$ItemStackClass.constructors[4]; // (Item, count) fallback

            function $$makeStack(type, id, meta, qty) {
                if (type === "block") {
                    var $$blk = ModAPI.blocks[id]?.getRef();
                    if (!$$blk) { console.warn("EFB Furnace: block not found: " + id); return null; }
                    return $$ctorBlock($$blk, qty, meta);
                } else {
                    var $$itm = ModAPI.items[id]?.getRef();
                    if (!$$itm) { console.warn("EFB Furnace: item not found: " + id); return null; }
                    if (meta !== 0 && $$ctor2arg && $$ctor2arg.length === 3) {
                        return $$ctor2arg($$itm, qty, meta);
                    } else {
                        var $$stk = $$ctorItem($$itm, qty);
                        if (meta !== 0 && $$stk) $$stk.$itemDamage = meta;
                        return $$stk;
                    }
                }
            }

            // Parse input
            var $$inputRaw = "${inputStr}";
            var $$inputAtIdx = $$inputRaw.lastIndexOf("@");
            var $$inputMeta = $$inputAtIdx !== -1 ? (parseInt($$inputRaw.slice($$inputAtIdx + 1)) || 0) : 0;
            var $$inputBase = $$inputAtIdx !== -1 ? $$inputRaw.slice(0, $$inputAtIdx) : $$inputRaw;
            var $$inputType = $$inputBase.startsWith("block/") ? "block" : "item";
            var $$inputId   = $$inputBase.replace("block/", "").replace("item/", "");

            // Parse result
            var $$resultRaw = "${resultStr}";
            var $$resultAtIdx = $$resultRaw.lastIndexOf("@");
            var $$resultMeta = $$resultAtIdx !== -1 ? (parseInt($$resultRaw.slice($$resultAtIdx + 1)) || 0) : 0;
            var $$resultBase = $$resultAtIdx !== -1 ? $$resultRaw.slice(0, $$resultAtIdx) : $$resultRaw;
            var $$resultType = $$resultBase.startsWith("block/") ? "block" : "item";
            var $$resultId   = $$resultBase.replace("block/", "").replace("item/", "");

            var $$outputStack = $$makeStack($$resultType, $$resultId, $$resultMeta, ${resultQuantity});
            if (!$$outputStack) { return; }

            if ($$inputType === "block") {
                var $$inputBlk = ModAPI.blocks[$$inputId]?.getRef();
                if (!$$inputBlk) { console.warn("EFB Furnace: input block not found: " + $$inputId); return; }
                FurnaceRecipesInstance.addSmeltingRecipeForBlock($$inputBlk, $$outputStack, ${experience});
            } else {
                var $$inputItm = ModAPI.items[$$inputId]?.getRef();
                if (!$$inputItm) { console.warn("EFB Furnace: input item not found: " + $$inputId); return; }
                // If the input has metadata, use addSmelting with a metadata-matched stack
                if ($$inputMeta !== 0) {
                    var $$inputStack = $$makeStack("item", $$inputId, $$inputMeta, 1);
                    if ($$inputStack) {
                        FurnaceRecipesInstance.addSmeltingRecipe($$inputStack, $$outputStack, ${experience});
                    } else {
                        FurnaceRecipesInstance.addSmelting($$inputItm, $$outputStack, ${experience});
                    }
                } else {
                    FurnaceRecipesInstance.addSmelting($$inputItm, $$outputStack, ${experience});
                }
            }

            console.log("EFB: Registered furnace recipe: ${inputStr} -> ${resultStr}");
        } catch (e) {
            console.error("EFB: Error registering furnace recipe:", e);
        }
    }
    
    $$registerFurnaceRecipe(false);
    if (ModAPI.dedicatedServer && ModAPI.dedicatedServer.appendCode) {
        ModAPI.dedicatedServer.appendCode(function() { $$registerFurnaceRecipe(true); });
    }
})();`;
    }
}
