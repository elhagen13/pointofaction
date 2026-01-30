"use client";
import styles from "./flag.module.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import { GrFlag, GrFlagFill } from "react-icons/gr";
import { BeatLoader } from "react-spinners";

export default function Flag({ item }) {
  const [visible, setVisible] = useState(false);
  const [flags, setFlags] = useState(item?.tags || []);
  const [myFlags, setMyFlags] = useState(
    new Set(item?.tags?.map((tag) => tag.tag) || [])
  );
  const [allFlags, setAllFlags] = useState([]);
  const [color, setColor] = useState("#9cc29dff");
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setVisible(false);
      }
    }

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fetchFlags();
  }, [visible]);

  const fetchFlags = async () => {
    setLoading(true);
    const response = await fetch("/api/inventory/tags", {
      method: "GET",
    });

    const result = await response.json();
    setAllFlags(result.data);
    setLoading(false);
  };

  const filteredFlags = useMemo(() => {
    return allFlags.filter(
      (flag) => !myFlags.has(flag.tag) && flag.tag.includes(search)
    );
  }, [allFlags, search, myFlags, flags]);

  const addFlag = (flag) => {
    setFlags([...flags, flag]);
    myFlags.add(flag.tag);
    submitTag("add", flag.tag, flag.color);
  };

  const removeFlag = (flag) => {
    setFlags(flags.filter((f) => f.tag != flag.tag));
    myFlags.delete(flag.tag);
    submitTag("remove", flag.tag, flag.color);
  };

  const submitTag = async (type, tag, color) => {
    setSubmitting(true);
    const response = await fetch("/api/inventory/tags", {
      method: "PATCH",
      body: JSON.stringify({
        id: item._id,
        type: type,
        tag: tag,
        color: color,
      }),
    });

    const result = await response.json();
    setSubmitting(false);
    setSearch("")
  };

  return (
    <div ref={popupRef}>
      {(!flags || flags.length == 0) ? 
      <GrFlag
        title="Add a tag to inventory item (no tags)"
        onClick={() => {
          console.log(flags.length);
          setVisible(!visible);
        }}
      />
        : 
        <GrFlagFill 
        title="Add or remove a tag from item" 
        onClick={() => {
          console.log(flags.length);
          setVisible(!visible);
        }}/>
    }
      {visible && (
        <div className={styles.flagPopup}>
          <h5>Existing Tags</h5>
          {flags.length > 0 ? (
            <div className={styles.flagContainer}>
              {Array.from(flags).map((flag) => (
                <button
                  style={{ backgroundColor: `${flag.color}70` }}
                  onClick={() => removeFlag(flag)}
                >
                  {flag.tag}
                </button>
              ))}
            </div>
          ) : (
            <span style={{ fontStyle: "italic" }}>No tags assigned</span>
          )}
          <h5>Add Tag</h5>
          <div className={styles.search}>
            <FaSearch className={styles.searchIcon} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            ></input>
          </div>
          {loading ? (
            <BeatLoader size={8} />
          ) : (
            <div className={styles.flagContainer}>
              {filteredFlags.length > 0 || !search ? (
                filteredFlags.map(
                  (flag) =>
                    !myFlags.has(flag.tag) && (
                      <button
                        style={{ backgroundColor: `${flag.color}70` }}
                        onClick={() => addFlag(flag)}
                      >
                        {flag.tag}
                      </button>
                    )
                )
              ) : (
                <div className={styles.addTag}>
                  <span>
                    Color:{" "}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    ></input>
                  </span>
                  <button
                    style={{ cursor: "pointer", background: "white" }}
                    onClick={() => {
                        addFlag({
                        tag: search.trim(),
                        color: color
                    })}}
                    disabled={submitting}
                  >
                    {submitting ? <BeatLoader size={8} /> : "Submit Tag"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
