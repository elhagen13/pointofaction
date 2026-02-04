import globals from "../globals.module.css";
import styles from "./components.module.css";
import { useState, useEffect } from "react";
import Image from "@/app/components/Image";
import { IoCheckmark, IoCopyOutline } from "react-icons/io5";
import { BeatLoader } from "react-spinners";

export default function EditImages() {
  const [images, setImages] = useState([]);
  const [copied, setCopied] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);
  const [descriptorDict, setDescriptorDict] = useState({});
  const [imageDescriptors, setImageDescriptors] = useState({})

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    fetchDescriptors()
  }, [images])

 

  const fetchImages = async () => {
      const response = await fetch("/api/uploadImage", {
        method: "GET",
      });
      if (response.ok) {
        const result = await response.json();
        setImages(result.items);
      }
    };

    const fetchDescriptors = async() => {
        const response = await fetch("/api/imageBank", {
            method: "GET"
        })
        if (response.ok) {
        const result = await response.json();
        const tempDict = {}
        result.data.forEach((i) => tempDict[i.awsId] = i.descriptor);
        setDescriptorDict(tempDict)
        setImageDescriptors(tempDict)
      }
    }

  const handleCopyClick = async(url, index) => {
    try{
        await navigator.clipboard.writeText(url);
        setCopied(index)
        setTimeout(() => setCopied(null), 2000)
        
    }
    catch (err){
        alert("fail to copy")
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
      const response = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if(result.success){
        setCurrentEdit(0)
      }
      
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      fetchImages();
      setImageUploading(false)
    }
  };

  const sendChanges = async(image) => {
    const response = await fetch("/api/imageBank",{
        method: "PATCH",
        body: JSON.stringify({
            id: image.key,
            descriptor: imageDescriptors[image.key]
        })
    })
    if(response.ok){
        descriptorDict[image.key] = imageDescriptors[image.key];
        setCurrentEdit(null)
    }

  }

  return (
    <div>
      <h2 className={globals.flexH} style={{marginBottom:"1rem"}}>
        Image Bank <button className={styles.button} onClick={handleImageUpload}>{imageUploading ? <BeatLoader size={10} color="white"/> : "upload"}</button>
      </h2>
      <table className={`${globals.table} ${globals.gray}`}>
        <thead>
          <tr>
            <th>Image</th>
            <th>Description</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          {images.map((image, index) => (
            <tr>
              <td className={globals.smlo}>
                <div className={globals.imageContainer}>
                  <Image image={image.url} objectFit={"cover"}/>
                </div>
              </td>
              <td onClick={() => setCurrentEdit(index)} style={{width:"50%"}}>
               
                <div className={globals.input} style={{position:"relative"}}>
                    <input
                    value={imageDescriptors[image.key]} 
                    onChange={(e) => setImageDescriptors({
                        ...imageDescriptors,
                        [image.key] : e.target.value
                    })}
                    className={`${!(currentEdit == index) && globals.inputReadOnly} ${imageDescriptors[image.key] !== descriptorDict[image.key] && globals.impartial}`}/>
                    {currentEdit == index && 
                    <div className={styles.checkmark} onClick={() => sendChanges(image)}>
                        <IoCheckmark></IoCheckmark>
                    </div>}
                </div>
                
              </td>
              <td className={globals.flexH} style={{minHeight:"4rem"}} onClick={() => handleCopyClick(image.url, index)}>
                {image.url} <div>{copied == index ? <IoCheckmark/> : <IoCopyOutline/>}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

