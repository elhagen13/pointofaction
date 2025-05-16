'use client'
import styles from "./ordering.module.css"
import { useState } from "react";
import sections from "./sections";
import { GoChevronDown, GoChevronUp } from "react-icons/go";

export default function HowToOrder() {
  const [section, setSection] = useState('')
  const [subSection, setSubSection] = useState('')
  const [step, setStep] = useState({})
  console.log(step)

  return (
    <div className={styles.tutorialPage}>
      <div className={styles.title}>Tutorial</div>
      <div className={styles.tutorial}>
        <div className={styles.tutorialDropdown}>
          <div className={styles.orderingProcess}>Ordering Process</div>
          {
            Object.entries(sections).map(([key, value], index) => {
              return(
              <div key={`${key}_${index}`}>
                <div className={styles.section} onClick={() => setSection(index === section ? '' : index)}>
                  <div className={styles.sectionTitle}>{index + 1}. {key}</div>
                  {section === index ? <GoChevronUp strokeWidth="2px"/> : <GoChevronDown strokeWidth="2px"/>}
                </div>
                {
                  section !== index ? <div></div> : 
                  Array.isArray(value) ? 
                  <div>
                    {
                      value.map((step, index) => {
                        return(
                          <div className={styles.step} key={`${step}_${index}`} onClick={() => setStep(step)}>
                            {String.fromCharCode(index + 97)}. {step["Step"]}
                          </div>
                        )
                      }
                       
                      )
                    }
                  </div>
                  :
                  <div>
                    <div>
                    {
                      Object.entries(value).map(([key, value], index) => {
                        return(
                          <div>
                            <div className={styles.subSection} onClick={() => setSubSection(index === subSection ? '' : index)}>
                              <div className={styles.sectionTitle}>{index + 1}. {key}</div>
                              {subSection === index ? <GoChevronUp strokeWidth="2px"/> : <GoChevronDown strokeWidth="2px"/>}
                            </div>
                            <div>
                              { subSection === index &&
                                value.map((step, index) => {
                                  return(
                                    <div className={styles.subStep} key={`${step}_${index}`} onClick={() => setStep(step)}>
                                      {String.fromCharCode(index + 97)}. {step["Step"]}
                                    </div>
                                  )
                                }
                                
                                )
                              }
                            </div>
                          </div>

                        )
                      }
                       
                      )
                    }
                  </div>
                  </div>
                }
              </div>
              )

            })
          }
        </div>
        <div className={styles.stepDetails}>
          <video
            muted
            loop
            playsInline
            className={styles.video}
          >
            <source src={step["Video Link"]} type="video/mp4" />
          </video>
          <div style={{padding: "20px 0"}}>
            <div style={{fontWeight: "bold"}}>
              {step["Step"]}
            </div>
            {step["Description"]}
            {step["Video Link"]}
            </div>
        </div>

      </div>
    </div>
  );
}
