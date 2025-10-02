PRIMITIVES["mob"] = {
    name: "Mob",
    uses: [],
    type: "mob",
    tags: {
        id: "custom_mob",
        name: "Custom Mob"
    },
    getDependencies: function () {
        return [];
    },
    asJavaScript: function () {
        return `(function CustomMobEntity() {
    console.log("Mob primitive loaded");
})();`;
    }
}
