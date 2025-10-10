import React, { useState, useEffect } from 'react';
import { IoClose, IoEye, IoEyeOff, IoCloseCircle } from 'react-icons/io5';
import { FaGripVertical } from 'react-icons/fa';
import styles from './drag.module.css';

function ColumnManager({ 
  isOpen, 
  onClose, 
  columns, 
  setColumns, 
  viewType = 'lineItems', // 'lineItems' or 'boxes'
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const currentColumns = columns[viewType] || [];

  const handleToggleColumn = (columnIndex) => {
    const updatedColumns = [...currentColumns];
    const columnName = Object.keys(updatedColumns[columnIndex])[0];
    updatedColumns[columnIndex] = {
      [columnName]: !updatedColumns[columnIndex][columnName]
    };
    
    setColumns({
      ...columns,
      [viewType]: updatedColumns
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const updatedColumns = [...currentColumns];
    const draggedColumn = updatedColumns[draggedIndex];
    
    // Remove the dragged column
    updatedColumns.splice(draggedIndex, 1);
    
    // Insert at new position
    updatedColumns.splice(dropIndex, 0, draggedColumn);
    
    setColumns({
      ...columns,
      [viewType]: updatedColumns
    });
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const resetToDefault = () => {
    const defaultColumns = {
      lineItems: [
        {"Image": true},
        {"Description": true},
        {"Style": true},
        {"Brand": true},
        {"Color": true},
        {"Size": true},
        {"Quantity": true},
        {"Box": true}, 
        {"Location": true},
        {"Price": false},
        {"Visibility": true}
      ],
      boxes: [
        {"Image": true},
        {"Box Id.": true},
        {"Description": true},
        {"Location": true},
        {"Total Quantity": true},
        {"Discount": true},
        {"Min.": true},
        {"Visibility": true},
      ]
    };

    setColumns(defaultColumns);
  };

  const toggleAllColumns = (show) => {
    const updatedColumns = currentColumns.map(column => {
      const columnName = Object.keys(column)[0];
      return { [columnName]: show };
    });
    
    setColumns({
      ...columns,
      [viewType]: updatedColumns
    });
  };

  if (!isOpen) return null;

  useEffect(() => {
    localStorage.setItem("columns", JSON.stringify(columns))
  }, [columns])

  return (
      <div className={styles.modal}>
        <div className={styles.controls}>
          <button 
            className={styles.controlButton}
            onClick={() => toggleAllColumns(true)}
          >
            Show All
          </button>
          <button 
            className={styles.controlButton}
            onClick={resetToDefault}
          >
            Reset
          </button>
        </div>
        <div className={styles.columnList}>
          {currentColumns.map((column, index) => {
            const columnName = Object.keys(column)[0];
            const isVisible = column[columnName];
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index && draggedIndex !== index;

            return (
              <div
                key={`${columnName}-${index}`}
                className={`${styles.columnItem} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className={styles.dragHandle}>
                  <FaGripVertical />
                </div>
                
                <div className={styles.columnInfo}>
                  <span className={styles.columnName}>{columnName}</span>
                </div>
                
                <button
                  className={`${styles.visibilityButton} ${isVisible ? styles.visible : styles.hidden}`}
                  onClick={() => handleToggleColumn(index)}
                >
                  {isVisible ? <IoEye /> : <IoEyeOff />}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.summary}>
          <p>
            Showing {currentColumns.filter(col => Object.values(col)[0]).length} of {currentColumns.length} columns
          </p>
        </div>
      </div>
  
  );
}

export default ColumnManager;