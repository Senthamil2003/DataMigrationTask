import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState([]);

  const fetchData = async () => {
    try {
      const response = await axios.get("http://40.90.208.153:5000/api/data");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage("Error fetching data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://40.90.208.153:5000/insert", {
        name,
        age,
      });
      setMessage("Data inserted successfully");
      fetchData();
      setName("");
      setAge("");
    } catch (error) {
      console.error("Error inserting data:", error);
      setMessage("Error inserting data");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Insert Data </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <button type="submit">Submit</button>
        </form>
        {message && <p>{message}</p>}
        <div>
          <h2>Data</h2>
          {data.length > 0 ? (
            data.map((item) => (
              <p key={item.id}>
                {item.name} - {item.age}
              </p>
            ))
          ) : (
            <p>No data available bro</p>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
