'use client'
import styles from "./ordering.module.css"
import { useState, useRef, useEffect } from "react";
import sections from "./sections";
import { GoChevronDown, GoChevronUp } from "react-icons/go";

export default function HowToOrder() {
  const [step, setStep] = useState({});
  const [stepLength, setStepLength] = useState(null)
  const [expandedIndices, setExpandedIndices] = useState([null, null, null]); // [sectionIndex, subSectionIndex]
  const videoRef = useRef(null);
  
  const toggleSection = (sectionIndex) => {
    const sectionName = Object.keys(sections)[sectionIndex];
    const sectionValue = sections[sectionName];
    
    // Check if this section has subsections (is an object) or direct steps (is an array)
    if (Array.isArray(sectionValue)) {
      // Direct steps - auto-select first step
      setStepLength(sectionValue.length)
      const firstStep = sectionValue[0];
      setStep(firstStep);
      setExpandedIndices([sectionIndex, null, 0]);
      
      if (videoRef.current && firstStep["Video Link"]) {
        videoRef.current.pause();
        videoRef.current.src = firstStep["Video Link"];
        videoRef.current.load();
        videoRef.current.play().catch(error => {
          console.log('Autoplay failed:', error);
        });
      }
    } else {
      // Has subsections - just toggle expansion
      toggleSubSection(sectionIndex, 0)
    }
  };

  const toggleSubSection = (sectionIndex, subSectionIndex) => {
    const sectionName = Object.keys(sections)[sectionIndex];
    const sectionValue = sections[sectionName];
    const subSectionName = Object.keys(sectionValue)[subSectionIndex];
    const subSectionValue = sectionValue[subSectionName];
    
    // Auto-select first step of the subsection
    const firstStep = subSectionValue[0];
    setStepLength(subSectionValue.length)
    setStep(firstStep);
    setExpandedIndices([sectionIndex, subSectionIndex, 0]);
    
    if (videoRef.current && firstStep["Video Link"]) {
      videoRef.current.pause();
      videoRef.current.src = firstStep["Video Link"];
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.log('Autoplay failed:', error);
      });
    }
  };

  const getStep = (indices) => {
    let category = Object.values(sections)[indices[0]]
    if(Array.isArray(category)){
      return category[indices[2]]
    }
    else{
      const subCategory = Object.values(category)[indices[1]]
      return subCategory[indices[2]]
    }
  }

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
          <div style={{ padding: "20px 0" }}>
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              {step["Step"]}
            </div>
            {step["Description"]}
          </div>
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
          <div className={styles.navigate}>
            <div>{expandedIndices[2] > 0 && <button className={styles.button} onClick={() => selectStep(getStep([expandedIndices[0], expandedIndices[1], expandedIndices[2] - 1]), [expandedIndices[0], expandedIndices[1], expandedIndices[2] - 1])}>
              Previous
            </button>}
            </div>
            <div>{expandedIndices[2] < stepLength - 1 && <button className={styles.button} onClick={() => selectStep(getStep([expandedIndices[0], expandedIndices[1], expandedIndices[2] + 1]), [expandedIndices[0], expandedIndices[1], expandedIndices[2] + 1])}>
              Next
            </button>}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}