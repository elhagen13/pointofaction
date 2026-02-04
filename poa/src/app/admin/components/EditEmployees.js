import { BeatLoader } from "react-spinners";
import styles from "./components.module.css";
import { useEffect, useState } from "react";
import Image from "@/app/components/Image";
import globals from "../globals.module.css";
import { FaEdit, FaPlus, FaUpload } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
export default function EditEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const response = await fetch("/api/employees", {
      method: "GET",
    });
    if (response.ok) {
      const result = await response.json();
      setEmployees(result.data);
    }
    setLoading(false);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
    setDragging(true);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = () => {
    if (
      draggedIndex === null ||
      dragOverIndex === null ||
      draggedIndex === dragOverIndex
    ) {
      resetDrag();
      return;
    }

    const updated = [...employees];
    const draggedItem = updated[draggedIndex];

    updated.splice(draggedIndex, 1);
    updated.splice(dragOverIndex, 0, draggedItem);

    setEmployees(updated);
    updateIndexes(updated)
    resetDrag();
  };
    const updateIndexes = async(updated) => {
        const emplList= [];
        updated.forEach((empl) => emplList.push(empl._id));

        await fetch('/api/employees', {
          method: "PATCH",
          body: JSON.stringify({
            emplList: emplList
          })
        })

  } 

  
  const resetDrag = () => {
    setDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <div
        className={`${styles.title} ${globals.flexH}`}
        style={{ marginBottom: "20px" }}
      >
        Edit Employees
        <button className={styles.button} onClick={() => setNewEmployee(true)}>
          Add Employee
        </button>
      </div>
      {loading ? (
        <BeatLoader />
      ) : (
        <div className={styles.employeeGrid}>
          {employees.map((employee, index) => (
            <div
              key={employee.id || index}
              className={styles.employeeWrapper}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
            >
              {index === dragOverIndex && dragging && (
                <span className={styles.dropIndicator} />
              )}

              <div
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={resetDrag}
                className={draggedIndex === index ? styles.dragging : ""}
              >
                <img src={employee.photo} draggable={false} />

                <button
                  className={`${globals.button} ${globals.outline}`}
                  style={{ cursor: dragging ? "grabbing" : "grab" }}
                  onClick={() => setEmployee(employee)}
                >
                  {employee.name} <FaEdit />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {employee && (
        <Employee
          employee={employee}
          onClose={() => setEmployee(null)}
          reload={fetchEmployees}
        />
      )}
      {newEmployee && <NewEmployee onClose={() => setNewEmployee(false)} reload={fetchEmployees}/>}
    </div>
  );
}

function Employee({ employee, onClose, reload }) {
  const [photo, setPhoto] = useState(employee.photo || "");
  const [name, setName] = useState(employee.name || "");
  const [role, setRole] = useState(employee.role || "");
  const [phoneNumber, setPhoneNumber] = useState(employee.number || "");
  const [email, setEmail] = useState(employee.email || "");
  const [roleDescription, setRoleDescription] = useState(
    employee.roleDescription || "",
  );
  const [capabilities, setCapabilities] = useState(
    employee.capabilities?.join("\n") || "",
  );
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleUpdate = async () => {
    setUpdating(true);
    const updateBody = {
      ...(photo.trim() !== employee.photo && { photo: photo }),
      ...(name.trim() !== employee.name && { name: name }),
      ...(role.trim() !== employee.role && { role: role }),
      ...(phoneNumber.trim() !== employee.number && { number: phoneNumber }),
      ...(email.trim() !== employee.email && { email: email }),
      ...(roleDescription.trim() !== employee.roleDescription && {
        roleDescription: roleDescription,
      }),
      ...(!(
        capabilities.split("\n").length == employee.capabilities?.length && 
        capabilities
          .split("\n")
          .every((e, i) => e === employee.capabilities[i])
       
      ) && { capabilities: capabilities.split("\n") }),
    };

    const response = await fetch(`/api/employees/${employee._id}`, {
      method: "PATCH",
      body: JSON.stringify(updateBody),
    });

    if (response.ok) {
      onClose();
      reload();
    } else {
      alert("Update failed");
    }

    setUpdating(false);
  };

  const handleDelete = async () => {
    const response = await fetch(`/api/employees/${employee._id}`,
     { method: "DELETE"}
    )

    if(response.ok){
      reload();
      onClose();
    }

  }

  const handleImageUpload = () => {
     const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = (e) => handleFileSelect(e);
      fileInput.click();
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      handleUploadImage(file);
    };
  };

  const handleUploadImage = async (file) => {
    if (!file) {
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/inventory/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setPhoto(result.url);
      } else {
        alert("Upload failed")
      }
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className={globals.overlayContainer} onClick={handleOverlayClick}>
      <div className={globals.overlay} onClick={handleModalClick}>
        <div className={globals.flexV}>
          <div
            className={styles.imageContainer}
            style={{ width: "10rem", height: "10rem", borderRadius: "100%", cursor:"pointer" }}
            onClick={handleImageUpload}

          >
            <img
              src={photo}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              className={styles.employeePhoto}
            ></img>
          </div>
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Name:</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
              ></input>
            </div>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Role:</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
              ></input>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Phone Number:</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              ></input>
            </div>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Email:</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              ></input>
            </div>
          </div>
          <div className={globals.input}>
            <label>Role Description:</label>
            <textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              style={{ minHeight: "6rem" }}
            />
          </div>
          <div className={globals.input}>
            <label>Capabilities: (split with new line)</label>
            <textarea
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              style={{ minHeight: "6rem" }}
            />
          </div>
          <div className={styles.capabilitiesBox}>
            {capabilities.split("\n").map((c) => {
              if (c) return <div>{c}</div>;
            })}
          </div>
          <div className={globals.flexH}>
            <button className={`${globals.button} ${globals.red}`}
            onClick={handleDelete}>
              Delete
            </button>
            <button
              className={`${globals.button} ${globals.green}`}
              disabled={updating}
              onClick={handleUpdate}
            >
              {updating ? <BeatLoader size={10} /> : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewEmployee({ onClose, reload }) {
  const [photo, setPhoto] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [updating, setUpdating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleUpdate = async () => {
    if(!photo || !name || !role) return
    setUpdating(true);
    const updateBody = {
      photo: photo,
      name: name,
      role: role,
      ...(phoneNumber.trim() && { number: phoneNumber }),
      ...(email.trim() && { email: email }),
      ...(roleDescription.trim() && {
        roleDescription: roleDescription,
      }),
      ...(capabilities.split("\n").length > 0 && { capabilities: capabilities.split("\n") }),
    };

    const response = await fetch(`/api/employees`, {
      method: "POST",
      body: JSON.stringify(updateBody),
    });

    if (response.ok) {
      onClose();
      reload();
    } else {
      alert("Update failed");
    }

    setUpdating(false);
  };

  const handleImageUpload = () => {
     const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = (e) => handleFileSelect(e);
      fileInput.click();
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      handleUploadImage(file);
    };
  };

  const handleUploadImage = async (file) => {
    if (!file) {
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/inventory/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setPhoto(result.url);
      } else {
        alert("Upload failed")
      }
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className={globals.overlayContainer} onClick={handleOverlayClick}>
      <div className={globals.overlay} onClick={handleModalClick}>
        <div className={globals.flexV}>
          <div
            className={styles.imageContainer}
            style={{ width: "10rem", height: "10rem", borderRadius: "100%", cursor:"pointer" }}
            onClick={handleImageUpload}
          >
            {photo !== "" ? (
              <img
                src={photo}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              ></img>
            ) : (
              imageUploading ? <BeatLoader/> : <MdOutlineFileUpload size={40} color={"#aca7a7ff"}/>
            )}
          </div>
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Name:</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
              ></input>
            </div>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Role:</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
              ></input>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Phone Number:</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              ></input>
            </div>
            <div className={globals.input} style={{ flexGrow: 1 }}>
              <label>Email:</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              ></input>
            </div>
          </div>
          <div className={globals.input}>
            <label>Role Description:</label>
            <textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              style={{ minHeight: "6rem" }}
            />
          </div>
          <div className={globals.input}>
            <label>Capabilities: (split with new line)</label>
            <textarea
              value={capabilities}
              onChange={(e) => setCapabilities(e.target.value)}
              style={{ minHeight: "6rem" }}
            />
          </div>
          <div className={styles.capabilitiesBox}>
            {capabilities.split("\n").map((c) => {
              if (c) return <div>{c}</div>;
            })}
          </div>
          <div className={globals.flexH} style={{justifyContent:"end"}}>
            <button
              className={`${globals.button} ${globals.green}`}
              disabled={updating}
              onClick={() => handleUpdate()}
            >
              {updating ? <BeatLoader size={10} /> : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
