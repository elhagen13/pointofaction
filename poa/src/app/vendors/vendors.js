const vendors = {
    "SanMar": {
        storeName: "SanMar",
        image: "/vendors/sanmar.png",
        link: "https://www.sanmar.com",
        blocked: false
    },
    "S&S": {
        storeName: "S&S Activeware",
        image: "/vendors/s&s.png", 
        link: "https://www.ssactivewear.com",
        blocked: true
    },
    "American Apparel": {
        storeName: "American Apparel",
        image: "/vendors/americanapparel.png",
        link: "https://www.americanapparel.com/us/en/",
        blocked: true

    },
    "NorthFace": {
        storeName: "North Face",
        image: "/vendors/northface.png",
        link: "https://www.thenorthface.com/en-us",
        blocked: false

    },
    "Fossa": {
        storeName: "Fossa",
        image: "/vendors/fossa.png",
        link: "https://fossaapparel.com",
        blocked: false

    },
    "Landway": {
        storeName: "Landway",
        image: "/vendors/landway.png",
        link: "https://www.landway.com",
        blocked: false

    },
    "Richardson": {
        storeName: "Richardson",
        image: "/vendors/richardson.png",
        link: "https://richardsonsports.com",
        blocked: false


    },
    "Pacific": {
        storeName: "Pacific Headwear",
        image: "/vendors/pacificheadwear.png",
        link: "https://www.augustasportswear.com/pacific-headwear",
        blocked: false

    },
    "Flexfit": {
        storeName: "Flexfit",
        image: "/vendors/flexfit.png",
        link: "https://www.flexfit.com",
        blocked: true

    },
    "Outdoor Cap": {
        storeName: "Outdoor Cap",
        image: "/vendors/outdoorcap.png",
        link: "https://www.outdoorcap.com",
        blocked: true

    },
    "Otto": {
        storeName: "Otto",
        image: "/vendors/otto.png",
        link: "https://ottocap.com",
        blocked: true

    },
    "Nissin": {
        storeName: "Nissin",
        image: "/vendors/nissin.png",
        link: "https://nissincap.com",
        blocked: false

    },
    "ChefWorks": {
        storeName: "ChefWorks",
        image: "/vendors/chefworks.png",
        link: "https://www.chefworks.com",
        blocked: true

    },
    "Daystar Apparel": {
        storeName: "Daystar Apparel",
        image: "/vendors/daystar.png",
        link: "https://daystarapparel.com",
        blocked: true

    },
    "Numo": {
        storeName: "Numo",
        image: "/vendors/numo.png",
        link: "https://www.numomfg.com",
        blocked: true

    },
    "ETS Express": {
        storeName: "ETS Express",
        image: "/vendors/etsexpress.png",
        link: "https://etsexpress.com",
        blocked: false

    },
    "Carhartt":{
        storeName: "Carhartt",
        image: "/vendors/carhartt.png",
        link: "https://www.sanmar.com/Brands/Carhartt/c/bra-carhartt?categorySearchTerm=carhartt.com",
        blocked: true
    },
    "Berne":{
        storeName: "Berne",
        image: "/vendors/berne.png",
        link: "https://www.ssactivewear.com/ps/?q=berne",
        blocked: true
    },
    "DRI DUCK":{
        storeName: "DRI DUCK",
        image: "/vendors/driduck.png",
        link: "https://www.ssactivewear.com/ps/?q=dri_duck",
        blocked: true
    },
    "JDS":{
        storeName: "JDS",
        image: "/vendors/jds.png",
        link: "https://www.jdsindustries.com",
        blocked: true
    },
    "Polar Camel":{
        storeName: "Polar Camel",
        image: "/vendors/polarcamel.png",
        link: "https://www.jdsindustries.com/?view=shop&jds-category1=15&jds-category1-desc=Drinkware&jds-category2=138&jds-category2-desc=Polar%20Camel",
        blocked: true
    },
    
};

const categories = {
    overall: ["SanMar", "S&S"],
    tops: ["American Apparel", "NorthFace", "Fossa", "Landway"],
    outerwear: ["NorthFace", "Fossa", "Landway", "Carhartt", "Berne", "DRI DUCK"],
    activewear: ["NorthFace", "Landway"],
    headwear: ["Richardson", "Pacific", "Flexfit", "Outdoor Cap", "Otto", "Nissin"],
    workwear: ["ChefWorks", "Daystar Apparel"],
    drinkware: ["Numo", "ETS Express", "JDS", "Polar Camel"]
};

// Export as named exports
export { vendors, categories };

// Or export as a default object (choose one approach)
// export default { vendors, categories };