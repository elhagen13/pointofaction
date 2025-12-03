"use client";
import { Key } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "./calendar.module.css"


export default function Calendar({refresh = 0}) {
  const [dates, setDates] = useState({});

  const numToDay = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday"
  }

  const getWeekDates = () => {
    const today = new Date();
    const days = [0, 1, 2, 3, 4, 5, 6];

    const currentWeek = days.map(
      (day) =>
        new Date(today.getTime() + day * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
    );

    const dayDict = {};
    for (const day of currentWeek) {
      if (new Date(day).getDay() === 6 || new Date(day).getDay() === 0) {
        dayDict[day] = { open: false };
      } else {
        dayDict[day] = {
          startTime: "10:00",
          endTime: "17:00",
          open: true,
        };
      }
    }

    setDates(dayDict);
    return currentWeek;
  };

  const hoursToTime = (time) => {
    const hour = time.split(":")[0]
    const amPm = hour / 12 >= 1 ? "PM" : "AM"
    const revisedHour = hour > 12 ? hour - 12 : hour == 0 ? 12 : hour


    return `${revisedHour}:${time.split(":")[1]} ${amPm}`

  }

  useEffect(() => {
    const run = async () => {
      const week = getWeekDates();
      await fetchDates(week);
    };
    run();
  }, [refresh]);

  const fetchDates = async (week) => {
    const response = await fetch(`/api/hours/alt?dates=${week}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    setDates((prevDates) => {
      const dateDict = { ...prevDates };
      for (const modifiedDate of data.data) {
        dateDict[modifiedDate.date] = modifiedDate;
      }
      return dateDict;
    });
  };



  return (
    <div className={styles.container}>
      This Weeks Hours:
    <div className={styles.calendarContainer}>
        {
            Object.entries(dates).map(([key, val], index) => 
            <div className={styles.weekDay} style={{borderColor: index == 0 && "red"}}>
                <div>{numToDay[new Date(key).getDay()]}</div>
                <div>
                  {val.open ? `${hoursToTime(val.startTime)}-${hoursToTime(val.endTime)}` : <span style={{color: "#652525ff"}}>CLOSED</span>}
                </div>
            </div>)
        }
    </div>
    </div>
  );
}
