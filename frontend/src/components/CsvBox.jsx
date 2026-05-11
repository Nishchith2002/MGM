



import React, { useState } from "react";

export default function CsvBox({ label, fileName }) {
  const [text, setText] = useState("");

  const handleUpload = async () => {
    await fetch("http://localhost:5002/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, content: text }),
    });

    alert(`${fileName} updated`);

    // ✅ Notify Utility.js to reload charts
    const event = new CustomEvent("csvUpdated", { detail: { fileName } });
    window.dispatchEvent(event);
  };

  const handleDownload = () => {
    window.location.href = `http://localhost:5002/api/download/${fileName}`;
  };

  return (
    <div style={{ display: "flex", marginBottom: "10px" }}>
      {/* Left box (textarea) */}
      <div style={{ width: "700px", border: "1px solid black" }}>
        <textarea
          rows={3}
          placeholder={`Paste ${label} CSV here...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            padding: "4px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        />
      </div>

      {/* Right box (buttons) */}
      <div style={{ width: "100px", display: "flex", flexDirection: "column" }}>
        <button
          onClick={handleUpload}
          style={{
            border: "2px solid black",
            marginBottom: "5px",
            padding: "8px",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          Upload
        </button>
        <button
          onClick={handleDownload}
          style={{
            border: "2px solid black",
            padding: "8px",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          Download File
        </button>
      </div>
    </div>
  );
}
