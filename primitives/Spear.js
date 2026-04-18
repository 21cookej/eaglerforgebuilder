PRIMITIVES["spear"] = {
    name: "Spear",
    uses: [],
    type: "item",
    tags: {
        id: "custom_spear",
        name: "Spear",

        // item textures (you provide)
        itemTexture: VALUE_ENUMS.IMG,      // inventory icon
        entityTexture: VALUE_ENUMS.IMG,    // in‑world spear model/texture (flat quad)

        // combat stats
        attackDamage: 7.0,
        attackSpeed: -2.8,                 // ignored in 1.8, used in 1.9+ style
        throwDamage: 9.0,
        maxDurability: 250,

        // throw behaviour
        throwVelocity: 1.6,
        throwInaccuracy: 0.01,
        gravity: 0.05,
        drag: 0.99,
        stickInGroundTicks: 200,           // how long it can sit in ground before despawn

        // pickup
        canPickupCreativeOnly: false       // if true, only creative players can pick it up
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const hasItemTexture = this.tags.itemTexture && this.tags.itemTexture.startsWith("data:");
        const hasEntityTexture = this.tags.entityTexture && this.tags.entityTexture.startsWith("data:");

        const id = this.tags.id;
        const name = this.tags.name;

        const attackDamage = this.tags.attackDamage;
        const throwDamage = this.tags.throwDamage;
        const maxDurability = this.tags.maxDurability | 0;
        const throwVelocity = this.tags.throwVelocity;
        const throwInaccuracy = this.tags.throwInaccuracy;
        const gravity = this.tags.gravity;
        const drag = this.tags.drag;
        const stickInGroundTicks = this.tags.stickInGroundTicks | 0;
        const canPickupCreativeOnly = !!this.tags.canPickupCreativeOnly;

        return `(function CustomSpearDatablock() {
    function waitForRenderManager() {
        return new Promise((res) => {
            function check() {
                if (ModAPI.mc && ModAPI.mc.renderManager) res();
                else setTimeout(check, 50);
            }
            check();
        });
    }

    function registerSpear() {
        if (ModAPI.hooks && ModAPI.hooks.methods) {
            ModAPI.hooks.methods.jl_String_format = ModAPI.hooks.methods.nlev_HString_format;
        }

        const ResourceLocation = ModAPI.reflect
            .getClassByName("ResourceLocation")
            .constructors.find(x => x.length === 1);

        const ItemClass = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        const ItemStackClass = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
        const WorldClass = ModAPI.reflect.getClassById("net.minecraft.world.World");
        const EntityLivingBaseClass = ModAPI.reflect.getClassById("net.minecraft.entity.EntityLivingBase");
        const EntityPlayerClass = ModAPI.reflect.getClassByName("EntityPlayer");
        const DamageSourceClass = ModAPI.reflect.getClassById("net.minecraft.util.DamageSource");
        const MovingObjectPositionClass = ModAPI.reflect.getClassById("net.minecraft.util.MovingObjectPosition");
        const EnumMovingObjectType = ModAPI.reflect.getClassById("net.minecraft.util.MovingObjectPosition$MovingObjectType").staticVariables;

        const SharedMonsterAttributes = ModAPI.reflect
            .getClassByName("SharedMonsterAttributes")
            .staticVariables;

        // ===== SPEAR ITEM =====
        var itemSuper = ModAPI.reflect.getSuper(ItemClass);
        var CustomSpearItem = function CustomSpearItem() {
            itemSuper(this);
            this.$maxStackSize = 1;
            this.$setMaxDamage(${maxDurability});
        };
        ModAPI.reflect.prototypeStack(ItemClass, CustomSpearItem);

        // melee damage (1.8 uses attribute modifiers on ItemSword, but we fake it here)
        CustomSpearItem.prototype.$hitEntity = function (stack, target, attacker) {
            try {
                var wrapTarget = ModAPI.util.wrap(target);
                var wrapAttacker = ModAPI.util.wrap(attacker);
                var DamageSource = DamageSourceClass.staticMethods.causePlayerDamage
                    ? DamageSourceClass.staticMethods.causePlayerDamage
                    : DamageSourceClass.staticMethods.causeMobDamage;
                var src = DamageSource(wrapAttacker.getRef ? wrapAttacker.getRef() : attacker);
                wrapTarget.attackEntityFrom(src, ${attackDamage});
                stack.$damageItem(1, attacker);
            } catch(e) {
                console.warn("Spear melee hit failed:", e);
            }
            return true;
        };

        // right‑click: throw spear
        CustomSpearItem.prototype.$onItemRightClick = function (stack, worldIn, playerIn) {
            var w = ModAPI.util.wrap(worldIn);
            var p = ModAPI.util.wrap(playerIn);

            if (!w.isRemote()) {
                try {
                    var EntitySpear = registerSpear.EntitySpear;
                    var spear = new EntitySpear(worldIn, playerIn, stack);
                    w.spawnEntityInWorld(spear);
                    if (!p.capabilities || !p.capabilities.isCreativeMode) {
                        stack.$damageItem(1, playerIn);
                        if (stack.$getItemDamage() >= stack.$getMaxDamage()) {
                            stack.$stackSize = 0;
                        }
                    }
                } catch(e) {
                    console.warn("Failed to spawn spear entity:", e);
                }
            }

            return stack;
        };

        // ===== SPEAR ENTITY =====
        var entityClass = ModAPI.reflect.getClassById("net.minecraft.entity.Entity");
        var entitySuper = ModAPI.reflect.getSuper(entityClass, (x) => x.length === 1 || x.length === 2);

        var EntitySpear = function EntitySpear(worldIn, thrower, stack) {
            entitySuper(this, worldIn);
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.inGround = false;
            this.ticksInGround = 0;
            this.spearStack = stack ? stack : null;
            this.thrower = thrower || null;

            if (thrower) {
                var p = ModAPI.util.wrap(thrower);
                this.wrapped.setLocationAndAngles(p.posX, p.posY + p.getEyeHeight() - 0.1, p.posZ, p.rotationYaw, p.rotationPitch);

                var yaw = p.rotationYaw / 180.0 * Math.PI;
                var pitch = p.rotationPitch / 180.0 * Math.PI;

                var vx = -Math.sin(yaw) * Math.cos(pitch);
                var vy = -Math.sin(pitch);
                var vz =  Math.cos(yaw) * Math.cos(pitch);

                var f = ${throwVelocity};
                vx += (Math.random() - 0.5) * ${throwInaccuracy};
                vy += (Math.random() - 0.5) * ${throwInaccuracy};
                vz += (Math.random() - 0.5) * ${throwInaccuracy};

                this.wrapped.motionX = vx * f;
                this.wrapped.motionY = vy * f;
                this.wrapped.motionZ = vz * f;
            }
        };

        ModAPI.reflect.prototypeStack(entityClass, EntitySpear);

        EntitySpear.prototype.$entityInit = function () {};
        EntitySpear.prototype.$canBeCollidedWith = function () { return true; };
        EntitySpear.prototype.$canBeAttackedWithItem = function () { return false; };

        EntitySpear.prototype.$onUpdate = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.onEntityUpdate();

            if (this.inGround) {
                this.ticksInGround++;
                if (this.ticksInGround > ${stickInGroundTicks}) {
                    this.wrapped.$setDead();
                }
                return;
            }

            // motion
            this.wrapped.posX += this.wrapped.motionX;
            this.wrapped.posY += this.wrapped.motionY;
            this.wrapped.posZ += this.wrapped.motionZ;

            this.wrapped.motionX *= ${drag};
            this.wrapped.motionY *= ${drag};
            this.wrapped.motionZ *= ${drag};
            this.wrapped.motionY -= ${gravity};

            // rotation
            var f = Math.sqrt(this.wrapped.motionX * this.wrapped.motionX + this.wrapped.motionZ * this.wrapped.motionZ);
            this.wrapped.rotationYaw = (Math.atan2(this.wrapped.motionX, this.wrapped.motionZ) * 180.0 / Math.PI);
            this.wrapped.rotationPitch = (Math.atan2(this.wrapped.motionY, f) * 180.0 / Math.PI);

            // ray trace
            try {
                var hit = this.wrapped.worldObj.$rayTraceBlocks(
                    ModAPI.util.asVec3(this.wrapped.posX, this.wrapped.posY, this.wrapped.posZ),
                    ModAPI.util.asVec3(this.wrapped.posX + this.wrapped.motionX, this.wrapped.posY + this.wrapped.motionY, this.wrapped.posZ + this.wrapped.motionZ),
                    false,
                    true,
                    false
                );
                if (hit) {
                    this.onImpact(hit);
                }
            } catch(e) {}
        };

        EntitySpear.prototype.onImpact = function (mop) {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();

            try {
                if (mop.$typeOfHit === EnumMovingObjectType.ENTITY) {
                    var ent = mop.$entityHit;
                    if (ent) {
                        var DamageSource = DamageSourceClass.staticMethods.causeThrownDamage
                            ? DamageSourceClass.staticMethods.causeThrownDamage
                            : DamageSourceClass.staticMethods.generic;
                        var src = DamageSource(this, this.thrower || this);
                        ModAPI.util.wrap(ent).attackEntityFrom(src, ${throwDamage});
                    }
                    this.dropSelf();
                    this.wrapped.$setDead();
                } else if (mop.$typeOfHit === EnumMovingObjectType.BLOCK) {
                    this.inGround = true;
                    this.wrapped.motionX = 0;
                    this.wrapped.motionY = 0;
                    this.wrapped.motionZ = 0;
                }
            } catch(e) {
                console.warn("Spear impact failed:", e);
                this.wrapped.$setDead();
            }
        };

        EntitySpear.prototype.dropSelf = function () {
            if (!this.spearStack) {
                try {
                    var stack = new ItemStackClass(registerSpear.CustomSpearItemRef, 1, 0);
                    this.wrapped.entityDropItem(stack, 0.1);
                } catch(e) {}
            } else {
                this.wrapped.entityDropItem(this.spearStack, 0.1);
            }
        };

        EntitySpear.prototype.$onCollideWithPlayer = function (player) {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            var p = ModAPI.util.wrap(player);
            if (this.inGround) {
                if (${canPickupCreativeOnly} && (!p.capabilities || !p.capabilities.isCreativeMode)) return;
                try {
                    var stack = new ItemStackClass(registerSpear.CustomSpearItemRef, 1, 0);
                    if (p.inventory && p.inventory.addItemStackToInventory(stack)) {
                        this.wrapped.$setDead();
                    }
                } catch(e) {}
            }
        };

        // ===== ENTITY RENDERER (simple flat quad with texture) =====
        var renderClass = ModAPI.reflect.getClassById("net.minecraft.client.renderer.entity.Render");
        var renderSuper = ModAPI.reflect.getSuper(renderClass, (x) => x.length === 2);
        const spearTexture = ResourceLocation(ModAPI.util.str("textures/entity/${id}_spear.png"));

        var RenderSpear = function RenderSpear(renderManager) {
            renderSuper(this, renderManager);
            this.shadowSize = 0.1;
        };
        ModAPI.reflect.prototypeStack(renderClass, RenderSpear);

        RenderSpear.prototype.$doRender = function (entity, x, y, z, yaw, partialTicks) {
            var Tessellator = ModAPI.reflect.getClassById("net.minecraft.client.renderer.Tessellator").staticMethods.getInstance.method();
            var WorldRenderer = Tessellator.$getWorldRenderer ? Tessellator.$getWorldRenderer() : Tessellator.$getWorldRenderer0();
            var GL11 = ModAPI.GL11;

            ModAPI.mc.renderEngine.bindTexture(spearTexture);

            GL11.glPushMatrix();
            GL11.glTranslatef(x, y, z);
            var wrap = ModAPI.util.wrap(entity);
            GL11.glRotatef(180.0 - wrap.rotationYaw, 0.0, 1.0, 0.0);
            GL11.glRotatef(-wrap.rotationPitch, 1.0, 0.0, 0.0);

            var f = 0.05625;
            GL11.glScalef(f, f, f);

            WorldRenderer.$startDrawingQuads();
            WorldRenderer.$setNormal(0.0, 0.0, -1.0);
            WorldRenderer.$addVertexWithUV(-8.0, -2.0, 0.0, 0.0, 0.0);
            WorldRenderer.$addVertexWithUV( 8.0, -2.0, 0.0, 1.0, 0.0);
            WorldRenderer.$addVertexWithUV( 8.0,  2.0, 0.0, 1.0, 1.0);
            WorldRenderer.$addVertexWithUV(-8.0,  2.0, 0.0, 0.0, 1.0);
            Tessellator.$draw();

            GL11.glPopMatrix();
        };

        RenderSpear.prototype.$getEntityTexture = function () {
            return spearTexture;
        };

        // ===== ITEM REGISTRATION =====
        var itemId = ModAPI.keygen.item("${id}");
        var CustomSpearItemRef = new CustomSpearItem();
        registerSpear.CustomSpearItemRef = CustomSpearItemRef;

        ModAPI.reflect
            .getClassById("net.minecraft.item.Item")
            .staticMethods.registerItem.method(itemId, ModAPI.util.str("${id}"), CustomSpearItemRef);

        // ===== ENTITY REGISTRATION =====
        var entityId = ModAPI.keygen.entity("${id}_spear");
        ModAPI.reflect
            .getClassById("net.minecraft.entity.EntityList")
            .staticMethods.addMapping0.method(
                ModAPI.util.asClass(EntitySpear),
                { $createEntity: function (w) { return new EntitySpear(w); } },
                ModAPI.util.str("${name} Spear"),
                entityId
            );

        // ===== CLIENT RENDER REGISTRATION =====
        ModAPI.addEventListener("lib:asyncsink", () => {
            AsyncSink.L10N.set("item.${id}.name", "${name}");
            AsyncSink.L10N.set("entity.${id}_spear.name", "${name} Spear");
        });

        registerSpear.EntitySpear = EntitySpear;
        registerSpear.RenderSpear = RenderSpear;
        registerSpear.spearTexture = spearTexture;
        registerSpear.CustomSpearItem = CustomSpearItem;
        registerSpear.CustomSpearItemRef = CustomSpearItemRef;

        return registerSpear;
    }

    var registerSpear = registerSpear || {};
    ModAPI.dedicatedServer.appendCode(registerSpear);
    registerSpear = registerSpear();

    ModAPI.addEventListener("lib:asyncsink", async () => {
        ${hasItemTexture ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/items/${id}.png",
                await (await fetch("${this.tags.itemTexture}")).arrayBuffer()
            );
        } catch(e) {
            console.warn("Failed to load spear item texture for ${id}:", e);
        }
        ` : ""}

        ${hasEntityTexture ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/entity/${id}_spear.png",
                await (await fetch("${this.tags.entityTexture}")).arrayBuffer()
            );
        } catch(e) {
            console.warn("Failed to load spear entity texture for ${id}:", e);
        }
        ` : ""}

        await waitForRenderManager();

        try {
            ModAPI.mc.renderManager.entityRenderMap.put(
                ModAPI.util.asClass(registerSpear.EntitySpear),
                new registerSpear.RenderSpear(ModAPI.mc.renderManager.getRef())
            );
        } catch(e) {
            console.warn("Failed to register spear renderer for ${id}:", e);
        }
    });
})();`;
    }
};
