'use client'
import ProductCard from "./components/ProductCard";
import BoxContents from "./components/BoxContents";
import styles from "./store.module.css"
import { useState, useEffect, useMemo } from "react"
import { FaCartShopping } from "react-icons/fa6";
import CartPopup from "./components/CartPopup";
import { IoSearch } from "react-icons/io5";

export default function Store() {
    const [boxes, setBoxes] = useState([]);
    const [inventory, setInventory] = useState([])

    const [selectedBox, setSelectedBox] = useState(null);

    const [cartOpen, setCartOpen] = useState(false);
    const [savedCart, setSavedCart] = useState({});

    const [page, setPage] = useState("items")
    const [groupedInventory, setGroupedInventory] = useState({})

    const [searchExpanded, setSearchExpanded] = useState(false)
    const [searchValue, setSearchValue] = useState("")


    useEffect(() => {
    fetch('/api/tracker', {
      method: "POST",
      body: JSON.stringify({
          page:'overstock_store'
      })
    })
  }, [])



    useEffect(() => {
        getSaleItems();
        getCartFromStorage();
    }, [])

    const getCartFromStorage = () => {
        try {
            const cartData = localStorage.getItem("customerCart");
            if (!cartData) {
                const emptyCart = {
                    boxes: [],
                    items: {},
                };
                setSavedCart(emptyCart);
                return;
            }

            const parsed = JSON.parse(cartData);
            setSavedCart(parsed);
        } catch (error) {
            console.warn("Invalid cart data in localStorage, resetting cart:", error);
            localStorage.removeItem("customerCart");
            const emptyCart = { boxes: [], items: {} };
            setSavedCart(emptyCart);
        }
    };


    const saveCartToStorage = (cart) => {
        try {
            localStorage.setItem("customerCart", JSON.stringify(cart));
        } catch (error) {
            console.error("Failed to save cart to localStorage:", error);
        }
    };


    const getSaleItems = async () => {
        try {
            const result = await fetch('/api/store', {
                method: "GET"
            })
            if (result.ok) {
                const data = await result.json()

                setBoxes(data.data.boxes);
                setInventory(data.data.inventory)
            }
            else throw Error("Error getting sale items")
        }
        catch {
            alert("Error getting sale items, please try again")

        }
    }



    const boxDict = useMemo(() => {
        if (!boxes || !inventory) return
        const dict = {};
        const itemDict = {}

        inventory.forEach((item) => {
            if (!itemDict[item.boxId]) {
                itemDict[item.boxId] = [item]
            }
            else (
                itemDict[item.boxId].push(item)
            )
        })

        boxes.forEach((box) => {
            dict[box._id.toString()] = box;
            dict[box._id.toString()].items = itemDict[box._id.toString()];
        });

        return dict;

    }, [boxes, inventory]);

    const inventoryDict = useMemo(() => {

        const itemDict = {}
        if (!inventory) return

        inventory.forEach((item) => {
            itemDict[item._id] = item
        })
        return itemDict
    }, [inventory])

    useEffect(() => {
        saveCartToStorage(savedCart)
    }, [savedCart])

    useEffect(() => {
        const grouped = {}
        for (const item of inventory) {
            const key = `${item.boxId}-${item.color}-${item.brand}-${item.style}`
            if (grouped[key]) {
                grouped[key].push(item)
            }
            else {
                grouped[key] = [item]
            }
        }
        setGroupedInventory(grouped)

    }, [inventory])


    const filteredBoxes = useMemo(() => {
        if (!searchValue.trim() || !boxDict) return boxes;

        const search = searchValue.toLowerCase();
        return boxes.filter(box => {
            const boxName = box.name?.toLowerCase() || '';
            const boxDescription = box.description?.toLowerCase() || '';

            // Get items from boxDict instead of box.items
            const boxWithItems = boxDict[box._id.toString()];
            const itemMatch = boxWithItems?.items?.some(item => {
                const brand = item.brand?.toLowerCase() || '';
                const description = item.description?.toLowerCase() || '';
                const color = item.color?.toLowerCase() || '';
                const style = item.style?.toLowerCase() || '';

                return brand.includes(search) ||
                    description.includes(search) ||
                    color.includes(search) ||
                    style.includes(search);
            });

            return boxName.includes(search) ||
                boxDescription.includes(search) ||
                itemMatch;
        });
    }, [boxes, searchValue, boxDict]);

    const filteredItems = useMemo(() => {
        if (!searchValue.trim()) return Object.values(groupedInventory);

        const search = searchValue.toLowerCase();
        return Object.values(groupedInventory).filter(itemGroup => {
            const item = itemGroup[0]; // Check first item in group
            const brand = item.brand?.toLowerCase() || '';
            const description = item.description?.toLowerCase() || '';
            const color = item.color?.toLowerCase() || '';
            const style = item.style?.toLowerCase() || '';

            return brand.includes(search) ||
                description.includes(search) ||
                color.includes(search) ||
                style.includes(search);
        });
    }, [groupedInventory, searchValue]);


    return (
        <div className={styles.page}>
            <div className={styles.cartContainer} onClick={() => setCartOpen(true)}><FaCartShopping size={25} /></div>
            <div className={styles.toggleContainer}>
                <div className={styles.toggle}>
                    <div style={{ zIndex: 3, cursor: "pointer", color: page === "boxes" ? "white" : "black" }} onClick={() => setPage("boxes")}>Boxes</div>
                    <div style={{ zIndex: 3, cursor: "pointer", color: page === "items" ? "white" : "black" }} onClick={() => setPage("items")}>Items</div>
                    <div className={`${styles.slider} ${page === "boxes" ? styles.sliderBoxes : styles.sliderItems}`}></div>
                </div>
                <div className={`${styles.searchContainer} ${searchExpanded && styles.searchContainerExpanded}`}
                    style={{ outline: searchExpanded && (page === "boxes" ? "3px solid rgba(36, 94, 29, 0.47)" : "3px solid rgba(156, 156, 190, 1)") }}>
                    <IoSearch size={20} onClick={() => setSearchExpanded(!searchExpanded)} />
                    {searchExpanded &&
                        <input className={styles.searchInput}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            autoFocus />}
                </div>
            </div>
            <div className={styles.productGrid}>


                <>
                    {page === "boxes" &&
                        filteredBoxes.map((box) => (
                            <ProductCard box={box} setSelectedBox={setSelectedBox} />
                        ))}
                </>
                <>
                    {page === "items" &&
                        filteredItems.map((item) => (
                            <ProductCard item={item} setSelectedBox={setSelectedBox} boxDict={boxDict} />
                        ))}
                </>



            </div>
            {selectedBox && <BoxContents box={selectedBox} onClose={() => setSelectedBox(null)} savedCart={savedCart}
                setSavedCart={setSavedCart} saveCartToStorage={saveCartToStorage} />}
            <CartPopup visible={cartOpen} onClose={() => setCartOpen(false)} boxDict={boxDict} inventoryDict={inventoryDict} savedCart={savedCart} setSavedCart={setSavedCart} />
        </div>
    )

}
