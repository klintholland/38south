import React, { useEffect, useState } from 'react';
import { FaSquare } from 'react-icons/fa6';
import '../scss/global.scss';

const DiamondGrid = () => {
  const [numRows, setNumRows] = useState(0);
  const [numDiamondsInRow, setNumDiamondsInRow] = useState(0);

  useEffect(() => {
    const viewportWidth = window.innerWidth * 2;
    const viewportHeight = window.innerHeight * 2;
    const diamondSizeWithGap = 5 + 24;
    const calculatedNumRows = Math.ceil(viewportHeight / diamondSizeWithGap);
    const calculatedNumDiamondsInRow = Math.ceil(viewportWidth / diamondSizeWithGap);
    console.log(viewportHeight);

    setNumRows(calculatedNumRows);
    setNumDiamondsInRow(calculatedNumDiamondsInRow);
  }, []);

  const rows = new Array(numRows).fill(null).map((_, rowIndex) => (
    <div key={rowIndex} className="row">
      {new Array(numDiamondsInRow * 2).fill(null).map((_, diamondIndex) => (
        <div key={diamondIndex} className="diamond">
          <FaSquare />
        </div>
      ))}
    </div>
  ));

  return (
    <div className="diamond-grid">
      {rows}
    </div>
  );
};

export default DiamondGrid;
