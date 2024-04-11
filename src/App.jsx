import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [colors, setColors] = useState([]);
  const [canvas, setCanvas] = useState(null);
  const [colorDetected, setColorDetected] = useState("");

  const video = useRef();
  const colorBox = useRef();
  const textBox = useRef();

  function getRGB(x, y) {
    const startX = x - Math.floor(Math.min(300 / 2, (2 * x * 0.3) / 2));
    const startY = y - Math.floor(Math.min(300 / 2, (2 * y * 0.3) / 2));
    const finishX = x + (x - startX);
    const finishY = y + (y - startY);

    var pixelData = canvas.getImageData(startX, startY, finishX, finishY).data;

    const colorsList = getColors(pixelData);

    const mergedColorsList = mergeSimilarColors(colorsList);

    var maxColorCount = mergedColorsList.reduce(function (prev, current) {
      return prev.count > current.count ? prev : current;
    });

    return maxColorCount;
  }

  const getColors = (pixelData) => {
    var colorCount = {};
    var colors = [];

    for (var i = 0; i < pixelData.length; i += 4) {
      var r = pixelData[i];
      var g = pixelData[i + 1];
      var b = pixelData[i + 2];
      var color = rgbToHex(r, g, b);

      if (colorCount[color]) {
        colorCount[color] = {
          count: colorCount[color] + 1,
          ...colorCount[color],
        };
      } else {
        colorCount[color] = {
          count: 1,
          r: r,
          g: g,
          b: b,
        };
      }
    }

    for (let color in colorCount) {
      colors.push({
        color: color,
        count: colorCount[color].count,
        r: colorCount[color].r,
        g: colorCount[color].g,
        b: colorCount[color].b,
      });
    }

    return colors;
  };

  const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const rgbToHex = (r, g, b) => {
    return (
      "#" +
      componentToHex(r) +
      componentToHex(g) +
      componentToHex(b)
    ).toUpperCase();
  };

  const mergeSimilarColors = (colors) => {
    var mergedColors = [];

    colors.forEach(function (colorData) {
      var found = false;

      mergedColors.forEach(function (mergedColor) {
        if (colorDistance(colorData, mergedColor) < 128) {
          mergedColor.count += colorData.count;
          found = true;
        }
      });

      if (!found) {
        mergedColors.push(colorData);
      }
    });

    return mergedColors;
  };

  const colorDistance = (color1, color2) => {
    var r1 = color1.r;
    var g1 = color1.g;
    var b1 = color1.b;

    var r2 = color2.r;
    var g2 = color2.g;
    var b2 = color2.b;

    var distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );

    return distance;
  };

  function getColorName(color) {
    var minimum = 1000;
    var cname = "";

    for (var i = 1; i < colors.length; i++) {
      var d =
        Math.abs(color.b - colors[i].b) +
        Math.abs(color.g - colors[i].g) +
        Math.abs(color.r - colors[i].r);
      if (d <= minimum) {
        minimum = d;
        cname = colors[i].name;
      }
    }

    return cname;
  }

  const processVideo = () => {
    canvas.drawImage(
      video.current,
      0,
      0,
      colorBox.current.width,
      colorBox.current.height
    );

    var x = Math.floor(colorBox.current.width / 2);
    var y = Math.floor(colorBox.current.height / 2);

    const color = getRGB(x, y);
    const colorName = getColorName(color);

    setColorDetected(
      `${colorName}, HEX = ${color.color}, R = ${color.r}, G = ${color.g}, B = ${color.b}`
    );

    textBox.current.style.backgroundColor = `${color.color}`;

    requestAnimationFrame(processVideo);
  };

  const playVideo = () => {
    requestAnimationFrame(processVideo);
  };

  useEffect(() => {
    const getAllColors = () => {
      fetch("./src/colors.csv")
        .then((response) => response.text())
        .then((data) => {
          var rows = data.split("\n");
          var parsedData = [];
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i].split(",");
            parsedData.push({
              id: row[0],
              name: row[1],
              hex: row[2],
              r: row[3],
              g: row[4],
              b: row[5],
            });
          }
          setColors([...parsedData]);
        })
        .catch((error) => {
          console.log("Error: ", error);
        });
    };

    getAllColors();

    return () => {
      setColors([]);
    };
  }, []);

  useEffect(() => {
    if (colors.length === 0) return;

    setCanvas(
      colorBox.current.getContext("2d", {
        willReadFrequently: true,
      })
    );
  }, [colors]);

  useEffect(() => {
    if (canvas == null) {
      return;
    }

    const setupVideo = () => {
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then(function (stream) {
            video.current.srcObject = stream;
          })
          .catch(function (error) {
            console.log("Error: " + error);
          });
      }

      video.current.addEventListener("play", playVideo);
    };

    const clearSetupVideo = () => {
      video.current.removeEventListener("play", playVideo);
    };

    setupVideo();

    return () => {
      clearSetupVideo();
    };
  }, [canvas]);

  return (
    <>
      <main>
        <h1>NHẬN DIỆN MÀU SẮC</h1>
        <video ref={video} autoPlay></video>
        <canvas ref={colorBox}></canvas>
        <div className="square">
          <div className="text-box" ref={textBox}>
            {colorDetected}
          </div>
          <div className="top-left"></div>
          <div className="top-right"></div>
          <div className="bottom-left"></div>
          <div className="bottom-right"></div>
          <div className="center"></div>
        </div>
      </main>
    </>
  );
}

export default App;
