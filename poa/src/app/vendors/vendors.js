const vendors = {
    "SanMar": {
        storeName: "SanMar",
        image: "/vendors/sanmar.png",
    },
    "S&S": {
        storeName: "S&S Activeware",
        image: "/vendors/s&s.png" 
    },
    "American Apparel": {
        storeName: "American Apparel",
        image: "/vendors/americanapparel.png"
    },
    "NorthFace": {
        storeName: "North Face",
        image: "/vendors/northface.png"
    },
    "Fossa": {
        storeName: "Fossa",
        image: "/vendors/fossa.png"
    },
    "Landway": {
        storeName: "Landway",
        image: "/vendors/landway.png"
    },
    "Next Level Apparel": {
        storeName: "Next Level Apparel",
        image: "/vendors/nextlevelapparel.png"
    },
    "Richardson": {
        storeName: "Richardson",
        image: "/vendors/richardson.png"
    },
    "Pacific": {
        storeName: "Pacific Headwear",
        image: "/vendors/pacificheadware.png"
    },
    "Flexfit": {
        storeName: "Flexfit",
        image: "/vendors/flexfit.png"
    },
    "Outdoor Cap": {
        storeName: "Outdoor Cap",
        image: "/vendors/outdoorcap.png"
    },
    "Otto": {
        storeName: "Otto",
        image: "/vendors/otto.png"
    },
    "Nissin": {
        storeName: "Nissin",
        image: "/vendors/nissin.png"
    },
    "ChefWorks": {
        storeName: "ChefWorks",
        image: "/vendors/chefworks.png"
    },
    "Daystar Apparel": {
        storeName: "Daystar Apparel",
        image: "/vendors/daystar.png"
    },
    "Numo": {
        storeName: "Numo",
        image: "/vendors/numo.png"
    },
    "ETS Express": {
        storeName: "ETS Express",
        image: "/vendors/etsexpress.png"
    },
};

const categories = {
    tops: ["SanMar", "S&S", "American Apparel", "NorthFace", "Fossa", "Landway", "Next Level Apparel"],
    outerwear: ["SanMar", "NorthFace", "Fossa", "Landway"],
    activewear: ["SanMar", "NorthFace", "S&S", "Landway"],
    headwear: ["SanMar", "Richardson", "Pacific", "Flexfit", "Outdoor Cap", "Otto", "Nissin"],
    workwear: ["SanMar", "ChefWorks", "Daystar Apparel"],
    drinkware: ["Numo", "ETS Express"]
};

// Export as named exports
export { vendors, categories };

// Or export as a default object (choose one approach)
// export default { vendors, categories };