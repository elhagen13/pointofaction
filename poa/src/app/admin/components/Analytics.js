"use client";
import { useEffect, useRef, useState } from "react";
import embed from "vega-embed";
import styles from "./analytics.module.css";
import { IoIosArrowDown } from "react-icons/io";
import { BeatLoader } from "react-spinners";
import { FaArrowRight } from "react-icons/fa";

export default function Analytics() {
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [openPage, setOpenPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typeLoading, setTypeLoading] = useState(false);
  const [screen, setScreen] = useState("new");

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [changingDates, setChangingDates] = useState(false);

  const [tempStartDate, setTempStartDate] = useState();
  const [tempEndDate, setTempEndDate] = useState();

  const pages = [
    "Home",
    "Company Stores",
    "Services",
    "Vendors",
    "Gallery",
    "Contact Us",
    "FAQs",
  ];

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    setStartDate(oneMonthAgo);
    setEndDate(today);
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;
    getVisitorData(pages[openPage]);
  }, [startDate, endDate]);

  useEffect(() => {
    if (data.length > 0 && containerRef.current) {
      const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        width: "container",
        height: 300,
        autosize: {
            type: "fit",
            contains: "padding",
        },
        data: { values: data },
        layer: [
          {
            params: [
              {
                name: "brush",
                select: {
                  type: "interval",
                  encodings: ["x"],
                },
              },
            ],
            mark: {
              type: "line",

              color: "#c26565ff",
            },
            encoding: {
              x: {
                field: "date",
                type: "temporal",
                title: null,
                axis: { format: "%b %d", gridColor: "#ffffffff" },
              },
              y: {
                field: screen == "new" ? "new_visitors" : "total_visitors",
                type: "quantitative",
                title: "Visitors",
                axis: {
                  gridColor: "#f8f7f7ff",
                  format: ".0f",
                  tickMinStep: 1,
                },
              },
              opacity: {
                condition: {
                  param: "brush",
                  value: 1,
                },
                value: 0.7,
              },
            },
          },
          {
            transform: [
              {
                filter: { param: "brush" },
              },
            ],
            mark: "rule",
            encoding: {
              y: {
                aggregate: "mean",
                field: screen == "new" ? "new_visitors" : "total_visitors",
                type: "quantitative",
              },
              color: { value: "#91a2d2ff" },
              size: { value: 1 },
            },
          },
        ],
      };

      embed(containerRef.current, spec, { actions: false });
    }
  }, [data, screen]);

  const getVisitorData = async (page) => {
    setLoading(true);

    const result = await fetch(`/api/tracker/${page}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: startDate,
        endDate: endDate,
      }),
    });
    const response = await result.json();
    const transformedData = response.data.map((item) => ({
      date: item.date,
      new_visitors: item.firstVisitThisMonthCount,
      total_visitors: item.totalDocuments,
    }));
    console.log(transformedData);
    setData(transformedData);
    setLoading(false);
  };

  const changeOpenPage = (index) => {
    setOpenPage(index);
    setLoading(true);
    getVisitorData(pages[index]);
  };

  const formatDate = (date) => {
    let d = new Date(date).toLocaleDateString().split("/");

    return [d[2], d[0].padStart(2, "0"), d[1].padStart(2, "0")].join("-");
  };

  const changeDates = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setChangingDates(false);
  };

  return (
    <div>
      <h2>Analytics</h2>
      <div className={styles.options}>
        {pages.map((page, index) => (
          <>
            <div>
              <h3
                className={styles.option}
                onClick={() => openPage !== index && changeOpenPage(index)}
              >
                {page}
                <IoIosArrowDown
                  className={styles.arrow}
                  style={{ transform: index == openPage && "rotate(180deg)" }}
                />
              </h3>
            </div>
            {openPage == index && (
              <div>
                {loading ? (
                  <BeatLoader size={10} />
                ) : (
                  <div className={styles.boxInfo}>
                    <div className={styles.monthAnalytics}>
                      {!changingDates ? (
                        data[0] && (
                          <h4
                            title="click to change date range"
                            onClick={() => {
                              setChangingDates(true);
                              setTempStartDate(startDate);
                              setTempEndDate(endDate);
                            }}
                          >
                            {new Date(startDate).toLocaleDateString()}-
                            {new Date(endDate).toLocaleDateString()}
                          </h4>
                        )
                      ) : (
                        <h4>
                          <input
                            type="date"
                            value={formatDate(tempStartDate)}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            max={formatDate(tempEndDate)}
                          />
                          -
                          <input
                            type="date"
                            value={formatDate(tempEndDate)}
                            onChange={(e) => setTempEndDate(e.target.value)}
                            min={formatDate(tempStartDate)}
                          />
                          <FaArrowRight
                            className={styles.arrow}
                            onClick={changeDates}
                          />
                        </h4>
                      )}
                      <div className={styles.buttonContainer}>
                        <button
                          className={screen == "new" && styles.selected}
                          onClick={() => setScreen("new")}
                        >
                          Unique Visitors
                        </button>
                        <button
                          className={screen == "old" && styles.selected}
                          onClick={() => setScreen("old")}
                        >
                          Total Visitors
                        </button>
                      </div>
                      <div className={styles.boxContainer} title="drag to see average of selected period" ref={containerRef}></div>
                    </div>
                    <div className={styles.statBox}>
                      <div className={styles.stats}>
                        <h4>Total Visitors for Selected Time Period</h4>
                        <span>
                          {data.reduce((a, b) => b.total_visitors + a, 0)}
                        </span>
                      </div>
                      <div className={styles.stats}>
                        <h4>New Visitors for Selected Time Period</h4>
                        <span>
                          {data.reduce((a, b) => b.new_visitors + a, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}
