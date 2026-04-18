PRIMITIVES["spear"] = {
    name: "Spear",
    uses: [],
    type: "item",
    tags: {
        id: "custom_spear",
        name: "Spear",
        // ONE 32×32 texture for both item + thrown entity
        texture: VALUE_ENUMS.IMG
    },

    getDependencies: function () { return []; },

    asJavaScript: function () {
        const hasTexture = this.tags.texture && this.tags.texture.startsWith("data:");
        const id = this.tags.id;
        const name = this.tags.name;

        // hard‑coded stats (no extra tags so builder can’t complain)
        const attackDamage = 7.0;
        const throwDamage = 9.0;
        const maxDurability = 250;

        const throwVelocity = 1.6;
        const throwInaccuracy = 0.01;
        const gravity = 0.05;
        const drag = 0.99;

        const stickInGroundTicks = 200;
        const canPickupCreativeOnly = false;

        return `(function SpearDatablock() {

    // ============================
    // ITEM
    // ============================
    function registerItem() {
        const Item = ModAPI.reflect.getClassById("net.minecraft.item.Item");
        const DamageSource = ModAPI.reflect.getClassById("net.minecraft.util.DamageSource");

        var superItem = ModAPI.reflect.getSuper(Item);
        var SpearItem = function SpearItem() {
            superItem(this);
            this.$maxStackSize = 1;
            this.$setMaxDamage(${maxDurability});
        };
        ModAPI.reflect.prototypeStack(Item, SpearItem);

        // melee
        SpearItem.prototype.$hitEntity = function (stack, target, attacker) {
            try {
                var wrapT = ModAPI.util.wrap(target);
                var wrapA = ModAPI.util.wrap(attacker);

                var src = DamageSource.staticMethods.causePlayerDamage
                    ? DamageSource.staticMethods.causePlayerDamage(wrapA.getRef())
                    : DamageSource.staticMethods.generic();

                wrapT.attackEntityFrom(src, ${attackDamage});
                stack.$damageItem(1, attacker);
            } catch(e) {
                console.warn("Spear melee failed:", e);
            }
            return true;
        };

        // throw
        SpearItem.prototype.$onItemRightClick = function (stack, world, player) {
            var w = ModAPI.util.wrap(world);
            var p = ModAPI.util.wrap(player);

            if (!w.isRemote()) {
                try {
                    var SpearEntity = registerItem.SpearEntity;
                    var spear = new SpearEntity(world, player, stack);
                    w.spawnEntityInWorld(spear);

                    if (!p.capabilities || !p.capabilities.isCreativeMode) {
                        stack.$damageItem(1, player);
                        if (stack.$getItemDamage() >= stack.$getMaxDamage()) {
                            stack.$stackSize = 0;
                        }
                    }
                } catch(e) {
                    console.warn("Failed to throw spear:", e);
                }
            }
            return stack;
        };

        var itemId = ModAPI.keygen.item("${id}");
        var SpearItemRef = new SpearItem();
        registerItem.SpearItemRef = SpearItemRef;

        Item.staticMethods.registerItem.method(itemId, ModAPI.util.str("${id}"), SpearItemRef);

        ModAPI.addEventListener("lib:asyncsink", () => {
            AsyncSink.L10N.set("item.${id}.name", "${name}");
        });
    }

    // ============================
    // ENTITY
    // ============================
    function registerEntity() {
        const Entity = ModAPI.reflect.getClassById("net.minecraft.entity.Entity");
        const DamageSource = ModAPI.reflect.getClassById("net.minecraft.util.DamageSource");
        const ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");

        var superEnt = ModAPI.reflect.getSuper(Entity, x => x.length === 1 || x.length === 2);

        var SpearEntity = function SpearEntity(world, thrower, stack) {
            superEnt(this, world);
            this.wrapped = ModAPI.util.wrap(this).getCorrective();

            this.inGround = false;
            this.ticksInGround = 0;
            this.thrower = thrower || null;
            this.stack = stack || null;

            if (thrower) {
                var p = ModAPI.util.wrap(thrower);
                this.wrapped.setLocationAndAngles(
                    p.posX,
                    p.posY + p.getEyeHeight() - 0.1,
                    p.posZ,
                    p.rotationYaw,
                    p.rotationPitch
                );

                var yaw = p.rotationYaw / 180 * Math.PI;
                var pitch = p.rotationPitch / 180 * Math.PI;

                var vx = -Math.sin(yaw) * Math.cos(pitch);
                var vy = -Math.sin(pitch);
                var vz =  Math.cos(yaw) * Math.cos(pitch);

                vx += (Math.random() - 0.5) * ${throwInaccuracy};
                vy += (Math.random() - 0.5) * ${throwInaccuracy};
                vz += (Math.random() - 0.5) * ${throwInaccuracy};

                this.wrapped.motionX = vx * ${throwVelocity};
                this.wrapped.motionY = vy * ${throwVelocity};
                this.wrapped.motionZ = vz * ${throwVelocity};
            }
        };

        ModAPI.reflect.prototypeStack(Entity, SpearEntity);

        SpearEntity.prototype.$entityInit = function () {};
        SpearEntity.prototype.$canBeCollidedWith = function () { return true; };

        SpearEntity.prototype.$onUpdate = function () {
            this.wrapped = ModAPI.util.wrap(this).getCorrective();
            this.wrapped.onEntityUpdate();

            if (this.inGround) {
                this.ticksInGround++;
                if (this.ticksInGround > ${stickInGroundTicks}) {
                    this.wrapped.$setDead();
                }
                return;
            }

            this.wrapped.posX += this.wrapped.motionX;
            this.wrapped.posY += this.wrapped.motionY;
            this.wrapped.posZ += this.wrapped.motionZ;

            this.wrapped.motionX *= ${drag};
            this.wrapped.motionY *= ${drag};
            this.wrapped.motionZ *= ${drag};
            this.wrapped.motionY -= ${gravity};

            var f = Math.sqrt(this.wrapped.motionX * this.wrapped.motionX + this.wrapped.motionZ * this.wrapped.motionZ);
            this.wrapped.rotationYaw = Math.atan2(this.wrapped.motionX, this.wrapped.motionZ) * 180 / Math.PI;
            this.wrapped.rotationPitch = Math.atan2(this.wrapped.motionY, f) * 180 / Math.PI;

            try {
                var hit = this.wrapped.worldObj.$rayTraceBlocks(
                    ModAPI.util.asVec3(this.wrapped.posX, this.wrapped.posY, this.wrapped.posZ),
                    ModAPI.util.asVec3(
                        this.wrapped.posX + this.wrapped.motionX,
                        this.wrapped.posY + this.wrapped.motionY,
                        this.wrapped.posZ + this.wrapped.motionZ
                    ),
                    false, true, false
                );
                if (hit) this.onImpact(hit);
            } catch(e) {}
        };

        SpearEntity.prototype.onImpact = function (hit) {
            this.wrapped = ModAPI.util.wrap(this).getCorrective();

            try {
                if (hit.$entityHit) {
                    var ent = hit.$entityHit;
                    var wrapEnt = ModAPI.util.wrap(ent);

                    var src = DamageSource.staticMethods.causeThrownDamage
                        ? DamageSource.staticMethods.causeThrownDamage(this, this.thrower)
                        : DamageSource.staticMethods.generic();

                    wrapEnt.attackEntityFrom(src, ${throwDamage});
                    this.dropSelf();
                    this.wrapped.$setDead();
                } else {
                    this.inGround = true;
                    this.wrapped.motionX = 0;
                    this.wrapped.motionY = 0;
                    this.wrapped.motionZ = 0;
                }
            } catch(e) {
                console.warn("Impact failed:", e);
                this.wrapped.$setDead();
            }
        };

        SpearEntity.prototype.dropSelf = function () {
            try {
                var ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
                var stack = this.stack
                    ? this.stack
                    : new ItemStack(registerItem.SpearItemRef, 1, 0);
                this.wrapped.entityDropItem(stack, 0.1);
            } catch(e) {}
        };

        SpearEntity.prototype.$onCollideWithPlayer = function (player) {
            if (!this.inGround) return;

            var p = ModAPI.util.wrap(player);
            if (${canPickupCreativeOnly} && (!p.capabilities || !p.capabilities.isCreativeMode)) return;

            try {
                var ItemStack = ModAPI.reflect.getClassById("net.minecraft.item.ItemStack");
                var stack = new ItemStack(registerItem.SpearItemRef, 1, 0);
                if (p.inventory.addItemStackToInventory(stack)) {
                    this.wrapped.$setDead();
                }
            } catch(e) {}
        };

        var entId = ModAPI.keygen.entity("${id}_entity");
        ModAPI.reflect
            .getClassById("net.minecraft.entity.EntityList")
            .staticMethods.addMapping0.method(
                ModAPI.util.asClass(SpearEntity),
                { $createEntity: function (w) { return new SpearEntity(w); } },
                ModAPI.util.str("${name} Spear"),
                entId
            );

        registerItem.SpearEntity = SpearEntity;
    }

    // ============================
    // RENDERER (flat sprite)
    // ============================
    function registerRenderer() {
        const Render = ModAPI.reflect.getClassById("net.minecraft.client.renderer.entity.Render");
        var superRender = ModAPI.reflect.getSuper(Render, x => x.length === 2);

        const ResourceLocation = ModAPI.reflect
            .getClassByName("ResourceLocation")
            .constructors.find(x => x.length === 1);

        const spearTex = ResourceLocation(ModAPI.util.str("textures/items/${id}.png"));

        var SpearRenderer = function SpearRenderer(manager) {
            superRender(this, manager);
            this.shadowSize = 0.1;
        };
        ModAPI.reflect.prototypeStack(Render, SpearRenderer);

        SpearRenderer.prototype.$doRender = function (entity, x, y, z, yaw, partialTicks) {
            var GL11 = ModAPI.GL11;
            var Tess = ModAPI.reflect.getClassById("net.minecraft.client.renderer.Tessellator").staticMethods.getInstance.method();
            var WR = Tess.$getWorldRenderer();

            ModAPI.mc.renderEngine.bindTexture(spearTex);

            GL11.glPushMatrix();
            GL11.glTranslatef(x, y, z);

            var wrap = ModAPI.util.wrap(entity);
            GL11.glRotatef(180 - wrap.rotationYaw, 0, 1, 0);
            GL11.glRotatef(-wrap.rotationPitch, 1, 0, 0);

            var s = 0.05;
            GL11.glScalef(s, s, s);

            WR.$startDrawingQuads();
            WR.$setNormal(0, 0, -1);

            WR.$addVertexWithUV(-16, -16, 0, 0, 0);
            WR.$addVertexWithUV( 16, -16, 0, 1, 0);
            WR.$addVertexWithUV( 16,  16, 0, 1, 1);
            WR.$addVertexWithUV(-16,  16, 0, 0, 1);

            Tess.$draw();
            GL11.glPopMatrix();
        };

        SpearRenderer.prototype.$getEntityTexture = function () {
            return spearTex;
        };

        ModAPI.addEventListener("lib:asyncsink", () => {
            ModAPI.mc.renderManager.entityRenderMap.put(
                ModAPI.util.asClass(registerItem.SpearEntity),
                new SpearRenderer(ModAPI.mc.renderManager.getRef())
            );
        });
    }

    // ============================
    // RUN
    // ============================
    ModAPI.dedicatedServer.appendCode(registerItem);
    ModAPI.dedicatedServer.appendCode(registerEntity);
    registerItem();
    registerEntity();
    registerRenderer();

    ModAPI.addEventListener("lib:asyncsink", async () => {
        ${hasTexture ? `
        try {
            AsyncSink.setFile(
                "resourcepacks/AsyncSinkLib/assets/minecraft/textures/items/${id}.png",
                await (await fetch("${this.tags.texture}")).arrayBuffer()
            );
        } catch(e) {
            console.warn("Failed to load spear texture:", e);
        }
        ` : ""}
    });

})();`;
    }
};
