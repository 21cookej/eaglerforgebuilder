PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob",
        width: 0.4,
        height: 0.7,
        maxHealth: 10,
        movementSpeed: 0.25,
        breedingItem: "wheat",
        dropItem: "leather",
        spawnEggBaseColor: 0x5e3e2d,
        spawnEggSpotColor: 0x269166
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        return `(function MobDatablock() {
    var entityClass = ModAPI.reflect.getClassById("net.minecraft.entity.passive.EntityAnimal");
    var entitySuper = ModAPI.reflect.getSuper(entityClass, (x) => x.length === 2);
    
    var CustomEntity = function CustomEntity(worldIn) {
        entitySuper(this, worldIn);
        var wrapped = ModAPI.util.wrap(this).getCorrective();
        wrapped.setSize(${this.tags.width}, ${this.tags.height});
    }
    
    ModAPI.reflect.prototypeStack(entityClass, CustomEntity);
    
    var ID = ModAPI.keygen.entity("${this.tags.id}");
    ModAPI.reflect.getClassById("net.minecraft.entity.EntityList").staticMethods.addMapping0.method(
        ModAPI.util.asClass(CustomEntity),
        { $createEntity: function (w) { return new CustomEntity(w); } },
        ModAPI.util.str("${this.tags.name}"),
        ID,
        ${this.tags.spawnEggBaseColor},
        ${this.tags.spawnEggSpotColor}
    );
})();`;
    }
}
