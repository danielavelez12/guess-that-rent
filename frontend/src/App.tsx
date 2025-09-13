import axios from "axios";
import { useEffect } from "react";
import "./App.css";
import logo from "./logo.svg";
import { ListingsResponse } from "./types";

function App() {
  useEffect(() => {
    const fetchListings = async () => {
      try {
        // For development, assuming backend runs on localhost:8000
        // For production, this would be your Render backend URL
        const response = await axios.get<ListingsResponse>(
          "http://localhost:8000/listings"
        );
        console.log("Backend response:", response.data);
        console.log("Number of listings:", response.data.count);
        console.log("Listings:", response.data.listings);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchListings();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
