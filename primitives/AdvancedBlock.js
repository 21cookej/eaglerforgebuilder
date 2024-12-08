PRIMITIVES["block_advanced"] = {
    name: "Advanced Block",
    uses: ["fixup_block_ids"],
    type: "block_advanced",
    tags: {
        id: "advanced_block",
        name: "Advanced Block",
        texture: VALUE_ENUMS.IMG,
        material: ['air', 'grass', 'ground', 'wood', 'rock', 'iron', 'anvil', 'water', 'lava', 'leaves', 'plants', 'vine', 'sponge', 'cloth', 'fire', 'sand', 'circuits', 'carpet', 'glass', 'redstoneLight', 'tnt', 'coral', 'ice', 'packedIce', 'snow', 'craftedSnow', 'cactus', 'clay', 'gourd', 'dragonEgg', 'portal', 'cake', 'web', 'piston', 'barrier'],
        Constructor: VALUE_ENUMS.ABSTRACT_HANDLER + "BlockConstructor",
    },
    asJavaScript: function () {
        console.log(this);
        var constructorHandler = getHandlerCode("BlockConstructor", this.tags.Constructor);
        return `(function AdvancedBlockDatablock() {
    const blockTexture = "${this.tags.texture}";

    function ServersideBlocks() {
        var itemClass = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        var blockClass = ModAPI.reflect.getClassById("net.minecraft.block.Block");
        var iproperty = ModAPI.reflect.getClassById("net.minecraft.block.properties.IProperty").class;
        var makeBlockState = ModAPI.reflect.getClassById("net.minecraft.block.state.BlockState").constructors.find(x => x.length === 2);
        var blockSuper = ModAPI.reflect.getSuper(blockClass, (x) => x.length === 2);
        var nmb_AdvancedBlock = function nmb_AdvancedBlock() {
            blockSuper(this, ModAPI.materials.${this.tags.material}.getRef());
            this.$defaultBlockState = this.$blockState.$getBaseState();
            ${constructorHandler}
        }
        ModAPI.reflect.prototypeStack(blockClass, nmb_AdvancedBlock);
        nmb_AdvancedBlock.prototype.$isOpaqueCube = function () {
            return 1;
        }
        nmb_AdvancedBlock.prototype.$createBlockState = function () {
            return makeBlockState(this, ModAPI.array.object(iproperty, 0));
        }

        function internal_reg() {
            var cblock = (new nmb_AdvancedBlock()).$setUnlocalizedName(
                ModAPI.util.str("${this.tags.id}")
            );
            blockClass.staticMethods.registerBlock0.method(
                ModAPI.keygen.block("${this.tags.id}"),
                ModAPI.util.str("${this.tags.id}"),
                cblock
            );
            itemClass.staticMethods.registerItemBlock0.method(cblock);
            efb2__fixupBlockIds();
            ModAPI.blocks["${this.tags.id}"] = cblock;
            
            return cblock;
        }

        if (ModAPI.materials) {
            return internal_reg();
        } else {
            ModAPI.addEventListener("bootstrap", internal_reg);
        }
    }
    ModAPI.dedicatedServer.appendCode(ServersideBlocks);
    var cblock = ServersideBlocks();
    ModAPI.addEventListener("lib:asyncsink", async () => {
        ModAPI.addEventListener("custom:asyncsink_reloaded", ()=>{
            ModAPI.mc.renderItem.registerBlock(cblock, ModAPI.util.str("${this.tags.id}"));
        });
        AsyncSink.L10N.set("tile.${this.tags.id}.name", "${this.tags.name}");
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/models/block/${this.tags.id}.json", JSON.stringify(
            {
                "parent": "block/cube_all",
                "textures": {
                    "all": "blocks/${this.tags.id}"
                }
            }
        ));
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/models/item/${this.tags.id}.json", JSON.stringify(
            {
                "parent": "block/${this.tags.id}",
                "display": {
                    "thirdperson": {
                        "rotation": [10, -45, 170],
                        "translation": [0, 1.5, -2.75],
                        "scale": [0.375, 0.375, 0.375]
                    }
                }
            }
        ));
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/blockstates/${this.tags.id}.json", JSON.stringify(
            {
                "variants": {
                    "normal": [
                        { "model": "${this.tags.id}" },
                    ]
                }
            }
        ));
        AsyncSink.setFile("resourcepacks/AsyncSinkLib/assets/minecraft/textures/blocks/${this.tags.id}.png", await (await fetch(
            blockTexture
        )).arrayBuffer());
    });
})();`;
    }
}