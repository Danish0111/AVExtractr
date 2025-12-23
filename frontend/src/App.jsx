import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState("");

  const BASE_URL = import.meta.env.NODE_ENV === "production" ? "/" : "http://localhost:5000/";

  const downloadAudio = () => {
    const encodedUrl = encodeURIComponent(url);
    window.open(`${BASE_URL}api/extract-audio?url=${encodedUrl}`);
  };

  const downloadVideo = () => {
    const encodedUrl = encodeURIComponent(url);
    window.open(`${BASE_URL}api/extract-video?url=${encodedUrl}`);
  };

  return (
    <div className="flex min-h-screen bg-red-500 flex-col items-center justify-center px-4">
      <h1 className="flex items-center gap-2 text-3xl sm:text-4xl font-semibold text-white tracking-wide">
        <img
          src="./logo.jpg"
          alt="AVExtractr logo"
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
        />
        AVExtractr
      </h1>

      <p className="text-white text-xs sm:text-sm mt-2 mb-8 text-center">
        Extract Audio & Video from YouTube
      </p>

      <div className="w-full max-w-md bg-white rounded-lg p-4 sm:p-6 space-y-4 shadow-lg">

        <div className="flex flex-col">
          <label htmlFor="url" className="text-sm font-semibold mb-2">
            YouTube URL
          </label>
          <input
            id="url"
            className="border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-red-500 transition"
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            Paste a YouTube video URL
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <button
            className="bg-red-600 text-white py-3 font-bold rounded-lg hover:bg-red-700 transition w-full"
            onClick={downloadAudio}
          >
            Extract Audio
          </button>

          <button
            className="bg-blue-600 text-white py-3 font-bold rounded-lg hover:bg-blue-700 transition w-full"
            onClick={downloadVideo}
          >
            Extract Video
          </button>
        </div>

        <div className="text-xs text-blue-900 border border-blue-300 bg-blue-100 p-3 rounded-lg">
          <span className="font-bold">Note:</span> This tool extracts media from
          publicly available YouTube videos. Ensure you have rights to download
          the content.
        </div>
      </div>
    </div>
  );
}

export default App;
