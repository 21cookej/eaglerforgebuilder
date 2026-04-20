// ---- Advanced Block Property Blocks ----
// These blocks are used inside the BlockConstructor handler to set properties dynamically.

// Hardness
const blocks_hardness = {
    init: function () {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set block hardness to');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Sets how long it takes to mine the block. -1 = unbreakable. Vanilla: stone=1.5, wood=2.0, obsidian=50.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_hardness: blocks_hardness });
javascript.javascriptGenerator.forBlock['blocks_hardness'] = function () {
    const value = javascript.javascriptGenerator.valueToCode(this, 'VALUE', javascript.Order.ATOMIC);
    return `this.$blockHardness = (${value});\n`;
};

// Resistance (blast resistance)
const blocks_resistance = {
    init: function () {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set block blast resistance to');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Sets explosion resistance. Internally multiplied by 5. Vanilla: stone=10, obsidian=2000.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_resistance: blocks_resistance });
javascript.javascriptGenerator.forBlock['blocks_resistance'] = function () {
    const value = javascript.javascriptGenerator.valueToCode(this, 'VALUE', javascript.Order.ATOMIC);
    return `this.$blockResistance = (${value}) * 5;\n`;
};

// Light level emitted
const blocks_lightlevel = {
    init: function () {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set block light level to (0-15)');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Sets the light emitted by this block. 0 = no light, 15 = max (like glowstone).');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_lightlevel: blocks_lightlevel });
javascript.javascriptGenerator.forBlock['blocks_lightlevel'] = function () {
    const value = javascript.javascriptGenerator.valueToCode(this, 'VALUE', javascript.Order.ATOMIC);
    return `this.$lightValue = Math.max(0, Math.min(15, Math.round(${value})));\n`;
};

// Light opacity
const blocks_lightopacity = {
    init: function () {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set block light opacity to (0-255)');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('How much light is blocked. 0 = transparent (glass), 255 = fully opaque. Default is 255.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_lightopacity: blocks_lightopacity });
javascript.javascriptGenerator.forBlock['blocks_lightopacity'] = function () {
    const value = javascript.javascriptGenerator.valueToCode(this, 'VALUE', javascript.Order.ATOMIC);
    return `this.$lightOpacity = Math.max(0, Math.min(255, Math.round(${value})));\n`;
};

// Slipperiness
const blocks_slipperiness = {
    init: function () {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set block slipperiness to');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Friction on the block. Default = 0.6. Ice = 0.98. Higher = more slippery.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_slipperiness: blocks_slipperiness });
javascript.javascriptGenerator.forBlock['blocks_slipperiness'] = function () {
    const value = javascript.javascriptGenerator.valueToCode(this, 'VALUE', javascript.Order.ATOMIC);
    return `this.$slipperiness = (${value});\n`;
};

// Opacity (is opaque cube - full block rendering)
const blocks_setopaque = {
    init: function () {
        this.appendDummyInput()
            .appendField('set block opaque')
            .appendField(new Blockly.FieldDropdown([
                ['true (solid, full block)', '1'],
                ['false (see-through/non-full)', '0']
            ]), 'VALUE');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Whether this block is a full opaque cube. Set false for glass-like or non-full-cube blocks.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_setopaque: blocks_setopaque });
javascript.javascriptGenerator.forBlock['blocks_setopaque'] = function () {
    const value = this.getFieldValue('VALUE');
    return `this.$$isOpaqueCube = function(){ return ${value}; };\n`;
};

// Full cube (affects neighbor face culling)
const blocks_setfullcube = {
    init: function () {
        this.appendDummyInput()
            .appendField('set block is full cube')
            .appendField(new Blockly.FieldDropdown([
                ['true', '1'],
                ['false', '0']
            ]), 'VALUE');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Whether this block fills its full 1x1x1 cube for face culling purposes.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_setfullcube: blocks_setfullcube });
javascript.javascriptGenerator.forBlock['blocks_setfullcube'] = function () {
    const value = this.getFieldValue('VALUE');
    return `this.$$isFullCube = function(){ return ${value}; };\n`;
};

// Needs random tick
const blocks_setneedsrandomtick = {
    init: function () {
        this.appendDummyInput()
            .appendField('set block needs random tick')
            .appendField(new Blockly.FieldDropdown([
                ['true', '1'],
                ['false', '0']
            ]), 'VALUE');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Whether this block should receive random ticks (like crops or fire).');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_setneedsrandomtick: blocks_setneedsrandomtick });
javascript.javascriptGenerator.forBlock['blocks_setneedsrandomtick'] = function () {
    const value = this.getFieldValue('VALUE');
    return `this.$needsRandomTick = ${value};\n`;
};

// Tick rate
const blocks_tickrate = {
    init: function () {
        this.appendValueInput('VALUE')
            .setCheck('Number')
            .appendField('set block tick rate to');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('How many ticks between each random tick. Higher = slower. Default = 10.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_tickrate: blocks_tickrate });
javascript.javascriptGenerator.forBlock['blocks_tickrate'] = function () {
    const value = javascript.javascriptGenerator.valueToCode(this, 'VALUE', javascript.Order.ATOMIC);
    // tickRate is handled as a prototype method override
    return `this.$$tickRate = function(){ return Math.max(1, Math.floor(${value})); };\n`;
};

// Get block property (getter block - returns a number)
const blocks_getproperty_num = {
    init: function () {
        this.appendDummyInput()
            .appendField('get block')
            .appendField(new Blockly.FieldDropdown([
                ['hardness', '$blockHardness'],
                ['blast resistance (raw)', '$blockResistance'],
                ['light level', '$lightValue'],
                ['light opacity', '$lightOpacity'],
                ['slipperiness', '$slipperiness'],
            ]), 'PROP');
        this.appendValueInput('BLOCK')
            .appendField('of block');
        this.setInputsInline(true);
        this.setOutput(true, 'Number');
        this.setTooltip('Gets a numeric property of a block instance.');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_getproperty_num: blocks_getproperty_num });
javascript.javascriptGenerator.forBlock['blocks_getproperty_num'] = function () {
    const prop = this.getFieldValue('PROP');
    const block = javascript.javascriptGenerator.valueToCode(this, 'BLOCK', javascript.Order.ATOMIC);
    return [`(${block})["${prop}"]`, javascript.Order.NONE];
};

// Set custom display name via L10N (useful at runtime from a handler)
const blocks_setdisplayname = {
    init: function () {
        this.appendValueInput('VALUE')
            .setCheck('String')
            .appendField('set block display name to');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Sets the display name for this block (used in constructor handler).');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_setdisplayname: blocks_setdisplayname });
javascript.javascriptGenerator.forBlock['blocks_setdisplayname'] = function () {
    const value = javascript.javascriptGenerator.valueToCode(this, 'VALUE', javascript.Order.ATOMIC);
    return `this.$setUnlocalizedName(ModAPI.util.str(${value}));\n`;
};

// Unbreakable block (sets hardness to -1)
const blocks_setunbreakable = {
    init: function () {
        this.appendDummyInput()
            .appendField('set block unbreakable');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Makes the block impossible to break in survival mode (hardness = -1).');
        this.setHelpUrl('');
        this.setColour(0);
    }
};
Blockly.common.defineBlocks({ blocks_setunbreakable: blocks_setunbreakable });
javascript.javascriptGenerator.forBlock['blocks_setunbreakable'] = function () {
    return `this.$blockHardness = -1;\n`;
};

// ---- Blockbench JSON model importer helper block ----
// This block doesn't run — it's a UI helper shown in the propviewer.
// The actual embedding happens via the Pack Maker HTML tool.
// We add a read-only info block for clarity.

const blocks_json_model_info = {
    init: function () {
        this.appendDummyInput()
            .appendField('ℹ Use Pack Maker to embed Blockbench JSON into Advanced Block');
        this.setInputsInline(false);
        this.setPreviousStatement(false, null);
        this.setNextStatement(false, null);
        this.setOutput(false);
        this.setTooltip('Use the EaglerForge Pack Maker tool to embed a Blockbench JSON model and its textures. Set textureMode to "json" in the Advanced Block datablock.');
        this.setHelpUrl('');
        this.setColour(120);
    }
};
Blockly.common.defineBlocks({ blocks_json_model_info: blocks_json_model_info });
javascript.javascriptGenerator.forBlock['blocks_json_model_info'] = function () {
    return '/* Embed Blockbench JSON via Pack Maker tool */\n';
};
