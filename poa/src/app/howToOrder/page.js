'use client'
import styles from "./ordering.module.css"
import { useState, useRef, useEffect } from "react";
import sections from "./sections";
import { GoChevronDown, GoChevronUp } from "react-icons/go";

export default function HowToOrder() {
  const [step, setStep] = useState({});
  const [expandedIndices, setExpandedIndices] = useState([null, null, null]); // [sectionIndex, subSectionIndex]
  const videoRef = useRef(null);


  const toggleSection = (sectionIndex) => {
    setExpandedIndices(prev => 
      prev[0] === sectionIndex ? [null, null] : [sectionIndex, null]
    );
  };

  const toggleSubSection = (sectionIndex, subSectionIndex) => {
    setExpandedIndices(prev => 
      prev[1] === subSectionIndex ? [sectionIndex, null, null] : [sectionIndex, subSectionIndex, null]
    );
  };

  const selectStep = (stepData, indices) => {
    setStep(stepData);
    setExpandedIndices(indices);

    if (videoRef.current && stepData["Video Link"]) {
      videoRef.current.pause();
      videoRef.current.src = stepData["Video Link"]; // Directly set source
      videoRef.current.load(); // Force reload
      videoRef.current.play().catch(error => {
        console.log('Autoplay failed:', error);
        // Fallback: Show play button or handle error
      });
    }
    
  };

  return (
    <div className={styles.tutorialPage}>
      <div className={styles.title}>Tutorials</div>
      <div className={styles.tutorial}>
        <div className={styles.tutorialDropdown}>
          <div className={styles.orderingProcess}>Ordering Process</div>
          {Object.entries(sections).map(([sectionName, sectionValue], sectionIndex) => (
            <div key={`section-${sectionIndex}`}>
              <div 
                className={`${styles.section} ${expandedIndices[0] === sectionIndex ? styles.chosenSection : ""}`}
                onClick={() => toggleSection(sectionIndex)}
              >
                <div className={styles.sectionTitle}>
                  {sectionIndex + 1}. {sectionName}
                </div>
                {expandedIndices[0] === sectionIndex ? <GoChevronUp /> : <GoChevronDown />}
              </div>

              {expandedIndices[0] === sectionIndex && (
                <div>
                  {Array.isArray(sectionValue) ? (
                    sectionValue.map((step, stepIndex) => (
                      <div 
                        key={`step-${sectionIndex}-${stepIndex}`}
                        className={`${styles.step} ${expandedIndices[2] === stepIndex ? styles.chosenStep : ""}`}
                        onClick={() => selectStep(step, [sectionIndex, null, stepIndex])}
                      >
                        {String.fromCharCode(stepIndex + 97)}. {step["Step"]}
                      </div>
                    ))
                  ) : (
                    Object.entries(sectionValue).map(([subSectionName, subSectionValue], subSectionIndex) => (
                      <div key={`subSection-${sectionIndex}-${subSectionIndex}`}>
                        <div 
                          className={`${styles.subSection} ${expandedIndices[1] === subSectionIndex ? styles.chosenSubSection : ""}`}
                          onClick={() => toggleSubSection(sectionIndex, subSectionIndex)}
                        >
                          <div className={styles.sectionTitle}>
                            {subSectionIndex + 1}. {subSectionName}
                          </div>
                          {expandedIndices[1] === subSectionIndex ? <GoChevronUp /> : <GoChevronDown />}
                        </div>

                        {expandedIndices[1] === subSectionIndex && (
                          subSectionValue.map((step, stepIndex) => (
                            <div 
                              key={`subStep-${sectionIndex}-${subSectionIndex}-${stepIndex}`}
                              className={`${styles.subStep} ${expandedIndices[2] === stepIndex ? styles.chosenStep : ""}`}
                              onClick={() => selectStep(step, [sectionIndex, subSectionIndex, stepIndex])}
                            >
                              {String.fromCharCode(stepIndex + 97)}. {step["Step"]}
                            </div>
                          ))
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.stepDetails} style={{display: Object.keys(step).length > 0 ? 'block' : 'none'}}>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className={styles.video}
            onError={(e) => console.log("Video error:", e.target.error)}
          >
          </video>
          <div style={{ padding: "20px 0" }}>
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              {step["Step"]}
            </div>
            {step["Description"]}
          </div>
        </div>
      </div>
    </div>
  );
}
/*
 <div className={styles.tutorialPage}>
      <div className={styles.title}>Tutorial</div>
      <div className={styles.tutorial}>
        <div className={styles.tutorialDropdown}>
          <div className={styles.orderingProcess}>Ordering Process</div>
          {
            Object.entries(sections).map(([key, value], index) => {
              return(
              <div key={`${key}_${index}`}>
                <div className={styles.section} onClick={() => {setSection(index === section ? '' : index); setSubSection('');}}>
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
             autoPlay
             muted
             playsInline
             controls
             className={styles.video}
             onError={(e) => console.log("Video error:", e.target.error)}
          >
            <source src={step["Video Link"]} type="video/mp4" />
          </video>
          <div style={{padding: "20px 0"}}>
            <div style={{fontWeight: "bold", marginBottom:"10px"}}>
              {step["Step"]}
            </div>
            {step["Description"]}
            </div>
        </div>

      </div>
    </div>

*/
