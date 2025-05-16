const vendors = {
    "SanMar": {
        storeName: "SanMar",
        image: "/vendors/sanmar.png",
        link: "https://www.sanmar.com"
    },
    "S&S": {
        storeName: "S&S Activeware",
        image: "/vendors/s&s.png", 
        link: "https://www.ssactivewear.com"
    },
    "American Apparel": {
        storeName: "American Apparel",
        image: "/vendors/americanapparel.png",
        link: "https://www.americanapparel.com/us/en/"
    },
    "NorthFace": {
        storeName: "North Face",
        image: "/vendors/northface.png",
        link: "https://www.thenorthface.com/en-us"
    },
    "Fossa": {
        storeName: "Fossa",
        image: "/vendors/fossa.png",
        link: "https://fossaapparel.com"
    },
    "Landway": {
        storeName: "Landway",
        image: "/vendors/landway.png",
        link: "https://www.landway.com"
    },
    "Richardson": {
        storeName: "Richardson",
        image: "/vendors/richardson.png",
        link: "https://richardsonsports.com"

    },
    "Pacific": {
        storeName: "Pacific Headwear",
        image: "/vendors/pacificheadwear.png",
        link: "https://www.augustasportswear.com/pacific-headwear"
    },
    "Flexfit": {
        storeName: "Flexfit",
        image: "/vendors/flexfit.png",
        link: "https://www.flexfit.com"
    },
    "Outdoor Cap": {
        storeName: "Outdoor Cap",
        image: "/vendors/outdoorcap.png",
        link: "https://www.outdoorcap.com"
    },
    "Otto": {
        storeName: "Otto",
        image: "/vendors/otto.png",
        link: "https://ottocap.com"
    },
    "Nissin": {
        storeName: "Nissin",
        image: "/vendors/nissin.png",
        link: "https://nissincap.com"
    },
    "ChefWorks": {
        storeName: "ChefWorks",
        image: "/vendors/chefworks.png",
        link: "https://www.chefworks.com"
    },
    "Daystar Apparel": {
        storeName: "Daystar Apparel",
        image: "/vendors/daystar.png",
        link: "https://daystarapparel.com"
    },
    "Numo": {
        storeName: "Numo",
        image: "/vendors/numo.png",
        link: "https://www.numomfg.com"
    },
    "ETS Express": {
        storeName: "ETS Express",
        image: "/vendors/etsexpress.png",
        link: "https://etsexpress.com"
    },
};

const categories = {
    overall: ["SanMar", "S&S"],
    tops: ["American Apparel", "NorthFace", "Fossa", "Landway"],
    outerwear: ["NorthFace", "Fossa", "Landway"],
    activewear: ["NorthFace", "Landway"],
    headwear: ["Richardson", "Pacific", "Flexfit", "Outdoor Cap", "Otto", "Nissin"],
    workwear: ["ChefWorks", "Daystar Apparel"],
    drinkware: ["Numo", "ETS Express"]
};

// Export as named exports
export { vendors, categories };

// Or export as a default object (choose one approach)
// export default { vendors, categories };