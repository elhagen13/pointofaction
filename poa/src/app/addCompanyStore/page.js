"use client";
import { useState, useEffect } from "react";
import styles from "./addStore.module.css";
import { FaRegEdit } from "react-icons/fa";

function AddStore({ onClose, onCompanyAdded }) {
  const [companyName, setCompanyName] = useState("");
  const [companyImage, setCompanyImage] = useState("");
  const [companyLink, setCompanyLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Basic validation
    if (!companyName || !companyImage || !companyLink) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createCompany();
      if (success) {
        // Clear form
        setCompanyName("");
        setCompanyImage("");
        setCompanyLink("");

        // Notify parent component to refresh the list
        if (onCompanyAdded) {
          onCompanyAdded();
        }

        // Close modal
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  async function createCompany() {
    try {
      const companyData = {
        companyName: companyName,
        companyLink: companyLink,
        companyImage: companyImage,
      };

      const response = await fetch("/api/companyStores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Company created successfully:", data.data);
        console.log("Message:", data.message);
        return true;
      } else {
        console.error("Error creating company:", data.error);
        console.error("Details:", data.details);
        alert("Error creating company: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  return (
    <div className={styles.addStoreOverlay} onClick={handleOverlayClick}>
      <div className={styles.overlay} onClick={handleModalClick}>
        <div className={styles.title} style={{ marginBottom: "30px" }}>
          Add a Company Store
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formInput}>
            <label>Company Name</label>
            <input
              className={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              required
            />
          </div>
          <div className={styles.formInput}>
            <label>Company Image</label>
            <input
              className={styles.input}
              value={companyImage}
              onChange={(e) => setCompanyImage(e.target.value)}
              placeholder="Image URL"
              required
            />
          </div>
          <div className={styles.formInput}>
            <label>Company Link</label>
            <input
              className={styles.input}
              value={companyLink}
              onChange={(e) => setCompanyLink(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div>
            <button type="submit" disabled={isSubmitting} className={styles.button}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStore({ company, onClose, onCompanyEdited }) {
  const [companyName, setCompanyName] = useState(company.companyName);
  const [companyImage, setCompanyImage] = useState(company.companyImage);
  const [companyLink, setCompanyLink] = useState(company.companyLink);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Basic validation
    if (!companyName || !companyImage || !companyLink) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await editCompany();
      if (success) {
        // Clear form
        setCompanyName("");
        setCompanyImage("");
        setCompanyLink("");

        // Notify parent component to refresh the list
        if (onCompanyEdited) {
          onCompanyEdited();
        }
        //Close modal
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async(e) => {
    e.preventDefault()
    setIsDeleting(true);

    try {
      const success = await deleteCompany();
      if (success) {
        // Clear form
        setCompanyName("");
        setCompanyImage("");
        setCompanyLink("");

        // Notify parent component to refresh the list
        if (onCompanyEdited) {
          onCompanyEdited();
        }
        //Close modal
        onClose();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsSubmitting(false);
    }

  }

  async function editCompany() {
    try {
      const companyData = {
        companyName: companyName,
        companyLink: companyLink,
        companyImage: companyImage,
      };

      const response = await fetch(`/api/companyStores/${company._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Company edited successfully:", data.data);
        console.log("Message:", data.message);
        return true;
      } else {
        console.error("Error editing company:", data.error);
        console.error("Details:", data.details);
        alert("Error editing company: " + (data.error || "Unknown error"));
        return false;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: " + error.message);
      return false;
    }
  }

  async function deleteCompany(){
    try {
      const response = await fetch(`/api/companyStores/${company._id}`, {
        method: 'DELETE',
      });
  
      const data = await response.json();
  
      if (data.success) {
        console.log('Company deleted successfully:', data.message);
        console.log('Deleted company data:', data.data);
        return true;
      } else {
        console.error('Error deleting company:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Network error:', error);
      return false;
    }
  }

  return (
    <div className={styles.addStoreOverlay} onClick={handleOverlayClick}>
      <div className={styles.overlay} onClick={handleModalClick}>
        <div className={styles.title} style={{ marginBottom: "30px" }}>
          Edit Company Store
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formInput}>
            <label>Company Name</label>
            <input
              className={styles.input}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              required
            />
          </div>
          <div className={styles.formInput}>
            <label>Company Image</label>
            <input
              className={styles.input}
              value={companyImage}
              onChange={(e) => setCompanyImage(e.target.value)}
              placeholder="Image URL"
              required
            />
          </div>
          <div className={styles.formInput}>
            <label>Company Link</label>
            <input
              className={styles.input}
              value={companyLink}
              onChange={(e) => setCompanyLink(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div style={{display:"flex", justifyContent:"space-between"}}>
            <button type="submit" disabled={isSubmitting} className={styles.button}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
            <button className={`${styles.button} ${styles.delete}`} onClick={handleDelete}>
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCompanyStore() {
  const [companies, setCompanies] = useState([]);
  const [addStoreOpen, setAddStoreOpen] = useState(false);
  const [editStoreOpen, setEditStoreOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState({})


  useEffect(() => {
    getAllCompanies();
  }, []);

  useEffect(() => {
    console.log(companies);
  }, [companies]);


  const handleCompanyAdded = () => {
    getAllCompanies(); 
  };

  async function getAllCompanies() {
    try {
      const response = await fetch("/api/companyStores");
      const data = await response.json();

      if (data.success) {
        console.log("Companies:", data.data);
        console.log("Total companies:", data.pagination.total);
        setCompanies(data.data);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }

  return (
    <>
      {addStoreOpen && (
        <AddStore 
          onClose={() => setAddStoreOpen(false)} 
          onCompanyAdded={handleCompanyAdded} 
        />
      )}
      {editStoreOpen && (
        <EditStore
          company={selectedStore}
          onClose={() => setEditStoreOpen(false)} 
          onCompanyEdited={handleCompanyAdded}
        />
      )}
      <div className={styles.addStore}>
        <div className={styles.titleBar}>
          <div className={styles.title}>Company Stores</div>
          <button
            className={styles.button}
            onClick={() => setAddStoreOpen(true)}
          >
            Add Store
          </button>
        </div>
        <div className={styles.companies}>
          {companies.map((company, index) => (
            <div className={styles.company} key={index}>
              <div className={styles.imageContainer}>
                <img
                  src={company.companyImage}
                  className={styles.companyImage}
                  alt={company.companyName}
                />
              </div>
              <div className={styles.companyName}>{company.companyName}</div>
              <div className={styles.edit} onClick={() => {setSelectedStore(company); setEditStoreOpen(true)}}>
                <FaRegEdit size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default AddCompanyStore;