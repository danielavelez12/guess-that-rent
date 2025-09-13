import React from 'react';
import { useEffect } from "react";
import axios from "axios";
import './App.css';
import logo from "./logo.svg";
import { ListingsResponse } from "./types";
import GameContainer from './components/GameContainer';

function App() {
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get<ListingsResponse>(
          `${apiUrl}/listings`
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
      <GameContainer />
    </div>
  );
}

export default App;
