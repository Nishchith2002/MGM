

import React from "react";

const Background = ({ children, imageUrl }) => {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        // width:'80%'
      }}
    >
      {children}
    </div>
  );
};

export default Background;