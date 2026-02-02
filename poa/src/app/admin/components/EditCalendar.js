import { FaArrowCircleLeft, FaArrowCircleRight, FaCheck } from "react-icons/fa";
import styles from "./calendar.module.css";
import globals from "../globals.module.css";
import { useState, useEffect } from "react";
import { BeatLoader } from "react-spinners";
export default function EditCalendar() {
  const [curMonth, setCurMonth] = useState(parseInt(new Date().getMonth()));
  const [curYear, setCurYear] = useState(parseInt(new Date().getFullYear()));
  const [monthDropdown, setMonthDropdown] = useState(false);
  const [dateDict, setDateDict] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [dragStart, setDragStart] = useState(null);
  const [dragMode, setDragMode] = useState(null);
  const [editHoursOpen, setEditHoursOpen] = useState(false);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const months = [
    "January",
    "Febuary",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function getDaysInMonth(month, year) {
    // Month is 1-based (e.g., 2 for February).
    // Day 0 of the next month is the last day of the current month.
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth() {
    return new Date(curYear, curMonth, 1).getDay();
  }

  const getDay = (index) => {
    const month = index < getFirstDayOfMonth() ? curMonth - 1 : curMonth;
    if (month !== curMonth) {
      return (
        <div className={styles.gray}>
          {getDaysInMonth(month, curYear) - getFirstDayOfMonth() + index + 1}
        </div>
      );
    } else if (
      index >
      getDaysInMonth(curMonth, curYear) + getFirstDayOfMonth() - 1
    ) {
      return (
        <div className={styles.gray}>
          {index - getDaysInMonth(curMonth, curYear) - getFirstDayOfMonth() + 1}
        </div>
      );
    } else {
      return <div>{index - getFirstDayOfMonth() + 1}</div>;
    }
  };

  const getDayNum = (index) => {
    const month = index < getFirstDayOfMonth() ? curMonth - 1 : curMonth;
    if (month !== curMonth) {
      return getDaysInMonth(month, curYear) - getFirstDayOfMonth() + index + 1;
    } else if (
      index >
      getDaysInMonth(curMonth, curYear) + getFirstDayOfMonth() - 1
    ) {
      return (
        index - getDaysInMonth(curMonth, curYear) - getFirstDayOfMonth() + 1
      );
    } else {
      return index - getFirstDayOfMonth() + 1;
    }
  };

  const increaseMonth = () => {
    if (curMonth == 11) {
      setCurMonth(0);
      setCurYear(curYear + 1);
    } else {
      setCurMonth(curMonth + 1);
    }
  };

  const decreaseMonth = () => {
    if (curMonth == 0) {
      setCurMonth(11);
      setCurYear(curYear - 1);
    } else {
      setCurMonth(curMonth - 1);
    }
  };

  const fetchDates = async () => {
    const response = await fetch(`/api/hours`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const tempDict = {};
    data.forEach((date) => (tempDict[date.date] = date));
    setDateDict(tempDict);
  };
  useEffect(() => {
    fetchDates();
  }, []);

  const getColor = (index, dateStr) => {
    if (selectedDates.has(dateStr)) {
      return "#b3d4fc";
    }

    if (
      (!dateDict[dateStr] && 
      (index % 7 === 0 ||
      index % 7 === 6)) ||
      dateDict[dateStr]?.open === false
    ) {
      return "#ffe4e4ff";
    }

    if (dateDict[dateStr] && (dateDict[dateStr].startTime !== "10:00" || dateDict[dateStr].endTime !== "17:00")) {
      return "#f9eedaff";
    }

    return "";
  };

  const handleMouseDown = (dateStr) => {
    setIsDragging(true);
    setDragStart(dateStr);

    setSelectedDates((prev) => {
      const next = new Set(prev);
      const isSelected = next.has(dateStr);

      setDragMode(isSelected ? "remove" : "add");

      isSelected ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
  };

  const handleMouseEnter = (dateStr) => {
    if (!isDragging || !dragStart || !dragMode) return;

    const start = new Date(dragStart);
    const end = new Date(dateStr);
    const [from, to] = start <= end ? [start, end] : [end, start];

    setSelectedDates((prev) => {
      const next = new Set(prev);
      const cur = new Date(from);

      while (cur <= to) {
        const key = cur.toISOString().slice(0, 10);
        dragMode === "add" ? next.add(key) : next.delete(key);
        cur.setDate(cur.getDate() + 1);
      }

      return next;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const getDateStr = (i) => {
    // First day shown in the grid (Sunday before the 1st, or the 1st itself)
    const firstOfMonth = new Date(curYear, curMonth, 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    // Add i days
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);

    // Format YYYY-MM-DD
    return date.toISOString().slice(0, 10);
  };

  const convertTime = (time) => {
      let [hour, minute] = time.split(":");
      hour = parseInt(hour);
      return `${hour <= 12 ? hour : hour % 12}:${minute}${hour >= 12 ? "pm" : "am"}`;
    };

    useEffect(() => {
      console.log(selectedDates)
    },[selectedDates])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <FaArrowCircleLeft onClick={() => decreaseMonth()} />
        <div onClick={() => setMonthDropdown(!monthDropdown)}>
          {months[curMonth]}
        </div>
        <div>{curYear}</div>
        <FaArrowCircleRight onClick={() => increaseMonth()} />
        {monthDropdown && (
          <div className={styles.dropdown}>
            {months.map((month, i) => (
              <div
                onClick={() => {
                  setCurMonth(i);
                  setMonthDropdown(false);
                }}
              >
                {month}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.gridContainer}>
      <div className={styles.grid}>
        {days.map((day) => (
          <div>{day}</div>
        ))}
        {Array(42)
          .fill(0)
          .map((_, i) => {
            const dateStr = getDateStr(i);
            return (
              <div
                className={styles.dateBlock}
                style={{ backgroundColor: getColor(i, dateStr) }}
                onMouseDown={() => handleMouseDown(dateStr)}
                onMouseEnter={() => handleMouseEnter(dateStr)}
                onMouseUp={handleMouseUp}
                onClick={() => console.log(dateStr)}
              >
                {getDay(i)}
                <span style={{fontWeight:"normal"}}>
                  {getColor(i, dateStr) == "#f9eedaff" &&  
                  `${convertTime(dateDict[dateStr].startTime)} - ${convertTime(dateDict[dateStr].endTime)}`}
                </span>
              </div>
            );
          })}
      </div>
      </div>
      <div>
        
        <h3>Selected Dates:</h3>
        {Array.from(selectedDates)
          .map((date) => `${new Date(`${date}T00:00:00`).toDateString()}`)
          .join(", ")}
      </div>
      <button
        className={`${globals.button} ${globals.add}`}
        disabled={selectedDates.size < 1}
        onClick={() => setEditHoursOpen(true)}
      >
        Change hours
      </button>
      {editHoursOpen && (
        <EditHours
          onClose={() => setEditHoursOpen(false)}
          dateDict={dateDict}
          selectedDates={selectedDates}
          reload={() => {fetchDates(); setSelectedDates(new Set())}}
        />
      )}
    </div>
  );
}

function EditHours({ onClose, dateDict, selectedDates, reload }) {
  const [datesSelected, setDatesSelected] = useState(selectedDates)
  const [selected, setSelected] = useState(selectedDates);
  const [open, setOpen] = useState(true);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("17:00");
  const [submitting, setSubmitting] = useState(false)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const getStatus = (day) => {
    const convertTime = (time) => {
      let [hour, minute] = time.split(":");
      hour = parseInt(hour);
      return `${hour <= 12 ? hour : hour % 12}:${minute}${hour >= 12 ? "pm" : "am"}`;
    };

    if (!dateDict[day]) {
      if ((new Date(`${day}T00:00:00`)).getDay() == 0 || (new Date(`${day}T00:00:00`).getDay() == 6)){
        return "CLOSED";
      }
      return "10:00am - 5:00pm";
    } else if (!dateDict[day].open) return "CLOSED";
    else
      return `${convertTime(dateDict[day].startTime)} - ${convertTime(dateDict[day].endTime)}`;
  };

  const toggleSelectedDate = (date) => {
    const tempDates = new Set(selected);
    tempDates.has(date) ? tempDates.delete(date) : tempDates.add(date);
    setSelected(tempDates);
  };

  const handleSubmit = async() => {
    try{
      setSubmitting(true)
      const response = await fetch('/api/hours/alt',
        {
          method: "PATCH",
          body: JSON.stringify({
            dates: Array.from(selected),
            open: open,
            startTime: startTime,
            endTime: endTime
          })
        }
      )

      if(response.ok){
        const remainingDates = datesSelected;
        Array.from(selected).forEach((date) => remainingDates.delete(date))
        setDatesSelected(remainingDates);
        setSelected(remainingDates)

        if(remainingDates.size == 0){
          onClose();
        }
      }
      else{
        throw Error("Error encountered updating horus")
      }
     
    }
    catch{
      alert("Error updating times")

    }
    finally{
      setSubmitting(false);
      reload();
    }
  }

  return (
    <div className={globals.overlayContainer} onClick={handleOverlayClick}>
      <div className={globals.overlay} onClick={handleModalClick}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2>
            Changing {selected.size} date{selectedDates.size > 1 && "s"}
          </h2>
          <div className={styles.selectedGrid}>
            {Array.from(datesSelected)
              .sort((a, b) => new Date(a) - new Date(b))
              .map((date) => (
                <div
                  className={selected.has(date) && styles.selectedRow}
                  onClick={() => toggleSelectedDate(date)}
                >
                  <div className={styles.checkFlex}>
                    <div>
                      <FaCheck
                        className={`${styles.check} ${selected.has(date) ? styles.selected : styles.unselected}`}
                      />
                    </div>
                    {(new Date(`${date}T00:00:00`)).toDateString()}
                  </div>

                  <div>{getStatus(date)}</div>
                </div>
              ))}
          </div>
          <div className={styles.radio}>
            <label
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "5px",
                alignItems: "center",
              }}
            >
              <input
                type="radio"
                name="openType"
                value="open"
                checked={open === true}
                onChange={() => setOpen(true)}
              />{" "}
              Open
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "5px",
                alignItems: "center",
              }}
            >
              <input
                type="radio"
                name="openType"
                value="closed"
                checked={open === false}
                onChange={() => setOpen(false)}
              />{" "}
              Closed
            </label>
          </div>
          {open && (
            <div>
              <input
                className={styles.input}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              ></input>{" "}
              to{" "}
              <input
                className={styles.input}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              ></input>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "end" }}>
            <button className={`${globals.button} ${globals.green}`}
            disabled={submitting || (open && endTime < startTime)}
            onClick={handleSubmit}>
              {submitting ? <BeatLoader size={9} /> : "save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
