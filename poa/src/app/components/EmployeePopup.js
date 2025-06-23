import styles from "./employeePopup.module.css";

const EmployeePopup = ({ onClose, employee }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.popupBackground} onClick={handleOverlayClick}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={styles.imageContainer}>
            <img src={employee.photo} className={styles.image}></img>
          </div>
          <div className={styles.general}>
            <div className={styles.line}></div>
            <div className={styles.info}>
              <h1>{employee.name}</h1>
              <h4 style={{ paddingTop: "20px" }}>email: {employee.email}</h4>
              <h4 style={{ paddingTop: "10px" }}>
                {employee.number !== undefined
                  ? `phone: ${employee.number}`
                  : ""}
              </h4>
            </div>
          </div>
          <div className={styles.role}>
            <h3 style={{ textTransform: "uppercase" }}>{employee.role}</h3>
            <h4 style={{ fontWeight: "normal" }}>{employee.roleDescription}</h4>
          </div>
          {employee.capabilities !== undefined ? (
            <div className={styles.abilityBox}>
              <div className={styles.capabilityTitle}>Capabilities</div>
              {employee.capabilities.map((capability, index) => (
                <div key={index} className={styles.capability}>
                  <div style={{ fontSize: "30px" }}>&#9745;</div>
                  {capability}
                </div>
              ))}
            </div>
          ) : <></>}
        </div>
      </div>
    </div>
  );
};

export default EmployeePopup;
