PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",
        texture: VALUE_ENUMS.IMG,
        modelType: ["CHICKEN", "PIG", "COW", "SHEEP", "WOLF", "ZOMBIE", "SKELETON", "SPIDER"],
        width: 0.4,
        height: 0.7,
        shadowSize: 0.3,
        maxHealth: 10,
        movementSpeed: 0.25,
        swimSpeed: 1.4,
        canSwim: true,
        canPanic: true,
        panicSpeed: 1.4,
        canMate: true,
        mateSpeed: 1.0,
        canFollowParent: true,
        followParentSpeed: 1.2,
        canWander: true,
        wanderSpeed: 1.0,
        canWatchPlayer: true,
        watchDistance: 6.0,
        breedingItem: "wheat",
        dropItem: "leather",
        spawnEggBaseColor: 0x5e3e2d,
        spawnEggSpotColor: 0x269166,
        livingSound: "mob.custom.idle",
        hurtSound: "mob.custom.hurt",
        deathSound: "mob.custom.death",
        stepSound: "mob.custom.step",
        stepVolume: 0.15,
        Constructor: VALUE_ENUMS.ABSTRACT_HANDLER + "MobConstructor",
        LivingUpdate: VALUE_ENUMS.ABSTRACT_HANDLER + "MobLivingUpdate",
        OnInteract: VALUE_ENUMS.ABSTRACT_HANDLER + "MobInteract"
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        const tags = { ...this.tags };
        
        var constructorHandler = getHandlerCode("MobConstructor", tags.Constructor, ["$entity"]);
        var livingUpdateHandler = getHandlerCode("MobLivingUpdate", tags.LivingUpdate, ["$entity"]);
        var interactHandler = getHandlerCode("MobInteract", tags.OnInteract, ["$entity", "$player"]);

        return `(function CustomMobEntity() {
    ModAPI.meta.title("${tags.name} Mod");
    
    function registerEntity() {
        var EntityAnimal = ModAPI.reflect.getClassById("net.minecraft.entity.passive.EntityAnimal");
        var entitySuper = ModAPI.reflect.getSuper(EntityAnimal, (x) => x.length === 2);
        
        var CustomEntity = function CustomEntity(worldIn) {
            entitySuper(this, worldIn);
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            this.wrapped.setSize(${tags.width}, ${tags.height});
            var $entity = this.wrapped;
            ${constructorHandler.code};
        }
        
        ModAPI.reflect.prototypeStack(EntityAnimal, CustomEntity);
        
        CustomEntity.prototype.$onLivingUpdate = function () {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            var $entity = this.wrapped;
            ${livingUpdateHandler.code};
        }
        
        CustomEntity.prototype.$interact = function (player) {
            this.wrapped = this.wrapped || ModAPI.util.wrap(this).getCorrective();
            var $entity = this.wrapped;
            var $player = ModAPI.util.wrap(player);
            ${interactHandler.code};
            return 0;
        }
        
        var ID = ModAPI.keygen.entity("${tags.id}");
        ModAPI.reflect.getClassById("net.minecraft.entity.EntityList").staticMethods.addMapping0.method(
            ModAPI.util.asClass(CustomEntity),
            { $createEntity: function (w) { return new CustomEntity(w); } },
            ModAPI.util.str("${tags.name}"),
            ID,
            ${tags.spawnEggBaseColor},
            ${tags.spawnEggSpotColor}
        );
        
        return { CustomEntity: CustomEntity };
    }
    
    ModAPI.dedicatedServer.appendCode(registerEntity);
    registerEntity();
})();`;
    }
}
