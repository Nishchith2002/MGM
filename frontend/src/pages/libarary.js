



import React, { useState } from "react";
import { FileText } from "lucide-react";

const Library = () => {
  const [openSection, setOpenSection] = useState(null);
  const [openYear, setOpenYear] = useState(null);

  const toggleSection = (section) =>
    setOpenSection(openSection === section ? null : section);

  const toggleYear = (year) =>
    setOpenYear(openYear === year ? null : year);

  const externalReports = [
    "MGM Macau Certification Audit Report 2018.pdf",
    "MGM Cotai Certification Audit Report 2020.pdf",
    "MGM Macau Assessment Report 2017.pdf",
    "MGM Cotai FSA Audit Report 2018.pdf",
    "MGM Cotai Surveillance Audit Report 2021.pdf",
    "MGM Macau Renewal Audit Report 2022.pdf",
  ];

  const internalReports = [
    "MGM Cotai Internal Audit Report_Nov2019.pdf",
    "MGM Cotai Internal Audit Report_Dec2021.pdf",
    "MGM Macau Internal Audit Report_Feb2016.pdf",
    "MGM Macau Internal Audit Report_Jan2017.pdf",
    "MGM Macau Internal Audit Report_Jan2020.pdf",
    "MGM Macau Internal Audit Report_Jan2021.pdf",
    "MGM Macau Internal Audit Report_Jul2017.pdf",
    "MGM Macau Internal Audit Report_Jan2022.pdf",
  ];

  // ✅ Year folders (REM)
  const remData = {
    2021: [
      "MGM_Monthly REM Report_Jan2021.pdf",
      "MGM_Monthly REM Report_Feb2021.pdf",
      "MGM_Monthly REM Report_Mar2021.pdf",
      "MGM_Monthly REM Report_Apr2021.pdf",
      "MGM_Monthly REM Report_May2021.pdf",
      "MGM_Monthly REM Report_Jun2021.pdf",
      "MGM_Monthly REM Report_Jul2021.pdf",
      "MGM_Monthly REM Report_Aug2021.pdf",
      "MGM_Monthly REM Report_Sep2021.pdf",
      "MGM_Monthly REM Report_Oct2021.pdf",
      "MGM_Monthly REM Report_Nov2021.pdf",
      "MGM_Monthly REM Report_Dec2021.pdf",
    ],
    2022: [
      "MGM_Monthly REM Report_Jan2022.pdf",
      "MGM_Monthly REM Report_Feb2022.pdf",
      "MGM_Monthly REM Report_Mar2022.pdf",
      "MGM_Monthly REM Report_Apr2022.pdf",
      "MGM_Monthly REM Report_May2022.pdf",
      "MGM_Monthly REM Report_Jun2022.pdf",
      "MGM_Monthly REM Report_Jul2022.pdf",
      "MGM_Monthly REM Report_Aug2022.pdf",
      "MGM_Monthly REM Report_Sep2022.pdf",
      "MGM_Monthly REM Report_Oct2022.pdf",
      "MGM_Monthly REM Report_Nov2022.pdf",
      "MGM_Monthly REM Report_Dec2022.pdf",
    ],
    2023: [
      "MGM_Monthly REM Report_Jan2023.pdf",
      "MGM_Monthly REM Report_Feb2023.pdf",
      "MGM_Monthly REM Report_Mar2023.pdf",
      "MGM_Monthly REM Report_Apr2023.pdf",
      "MGM_Monthly REM Report_May2023.pdf",
      "MGM_Monthly REM Report_Jun2023.pdf",
      "MGM_Monthly REM Report_Jul2023.pdf",
      "MGM_Monthly REM Report_Aug2023.pdf",
      "MGM_Monthly REM Report_Sep2023.pdf",
      "MGM_Monthly REM Report_Oct2023.pdf",
      "MGM_Monthly REM Report_Nov2023.pdf",
      "MGM_Monthly REM Report_Dec2023.pdf",
    ],
    2024: [
         "MGM_Monthly REM Report_Jan2023.pdf",
      "MGM_Monthly REM Report_Feb2024.pdf",
      "MGM_Monthly REM Report_Mar2024.pdf",
      "MGM_Monthly REM Report_Apr2024.pdf",
      "MGM_Monthly REM Report_May2024.pdf",
      "MGM_Monthly REM Report_Jun2024.pdf",
      "MGM_Monthly REM Report_Jul2024.pdf",
      "MGM_Monthly REM Report_Aug2024.pdf",
      "MGM_Monthly REM Report_Sep2024.pdf",
      "MGM_Monthly REM Report_Oct2024.pdf",
      "MGM_Monthly REM Report_Nov2024.pdf",
      "MGM_Monthly REM Report_Dec2024.pdf",
    ],
    2025: [
          "MGM_Monthly REM Report_Jan2023.pdf",
      "MGM_Monthly REM Report_Feb2025.pdf",
      "MGM_Monthly REM Report_Mar2025.pdf",
      "MGM_Monthly REM Report_Apr2025.pdf",
      "MGM_Monthly REM Report_May2025.pdf",
      "MGM_Monthly REM Report_Jun2025.pdf",
      "MGM_Monthly REM Report_Jul2025.pdf",
      "MGM_Monthly REM Report_Aug2025.pdf",
      "MGM_Monthly REM Report_Sep2025.pdf",
      "MGM_Monthly REM Report_Oct2025.pdf",
      "MGM_Monthly REM Report_Nov2025.pdf",
      "MGM_Monthly REM Report_Dec2025.pdf",
    ],
  };

  const handleFileDownload = (relativePath, fileName) => {
    const url = process.env.PUBLIC_URL + relativePath;
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "20px 40px",
        fontFamily: "Arial, sans-serif",
        margin: "100px 0 0 80px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 0.5fr",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* ===== LEFT COLUMN ===== */}
        <div
          style={{
            backgroundColor: "#efefef",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              color: "#E87722",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            ISO Certification
          </h2>

          {/* === External === */}
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "10px",
              cursor: "pointer",
              color: openSection === "external" ? "#E87722" : "#000",
            }}
            onClick={() => toggleSection("external")}
          >
            External Audit Reports
          </div>

          {openSection === "external" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "15px",
              }}
            >
              {externalReports.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    handleFileDownload(`/Data/External Audit Report/${file}`, file)
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <FileText size={28} color="#000" />
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#000",
                      marginTop: "4px",
                      lineHeight: "1.2",
                    }}
                  >
                    {file.replace(".pdf", "")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* === Internal === */}
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "10px",
              cursor: "pointer",
              color: openSection === "internal" ? "#E87722" : "#000",
            }}
            onClick={() => toggleSection("internal")}
          >
            Internal Audit Reports
          </div>

          {openSection === "internal" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "15px",
              }}
            >
              {internalReports.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    handleFileDownload(`/Data/Internal Audit Report/${file}`, file)
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <FileText size={28} color="#000" />
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#000",
                      marginTop: "4px",
                      lineHeight: "1.2",
                    }}
                  >
                    {file.replace(".pdf", "")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* === Manuals === */}
          <div
            style={{
              fontWeight: "bold",
              cursor: "pointer",
              color: openSection === "manuals" ? "#E87722" : "#000",
            }}
            onClick={() => toggleSection("manuals")}
          >
            Register & Manuals
          </div>
        </div>

        {/* ===== MIDDLE COLUMN ===== */}
        <div
          style={{
            backgroundColor: "#efefef",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              color: "#E87722",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            Utility Data
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "80%",
              cursor: "pointer",
            }}
            onClick={() =>
              handleFileDownload(
                `/Data/MGM Macau  Cotai Utility Tracker_Dashboard.xlsx`,
                "MGM Macau & Cotai Utility Tracker.xlsx"
              )
            }
          >
            <FileText size={60} color="#000" />
            <span
              style={{
                fontSize: "13px",
                color: "#000",
                marginTop: "6px",
                textAlign: "center",
              }}
            >
              MGM Macau & Cotai Utility Tracker
            </span>
          </div>
        </div>

        {/* ===== RIGHT COLUMN (REM REPORTS) ===== */}
        <div
          style={{
            backgroundColor: "#efefef",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              color: "#E87722",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "15px",
            }}
          >
            REM Reports
          </h2>

          {Object.keys(remData)
            .sort((a, b) => b - a)
            .map((year) => (
              <div key={year}>
                <div
                  style={{
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: "5px",
                    color: openYear === year ? "#E87722" : "#000",
                  }}
                  onClick={() => toggleYear(year)}
                >
                  {year}
                </div>

                {openYear === year && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    {remData[year].map((file, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          handleFileDownload(`/Data/REM Report ${year}/${file}`, file)
                        }
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          cursor: "pointer",
                        }}
                      >
                        <FileText size={24} color="#000" />
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#000",
                            lineHeight: "1.1",
                          }}
                        >
                          {file.replace(".pdf", "")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Library;
