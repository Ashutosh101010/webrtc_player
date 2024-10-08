
import './App.css';
import { Route, Routes } from "react-router-dom";
import Main from "./main";


function App() {


  return (
          <div className="app">
            <Routes>
                <Route
                    path="/player/:liveId/:userId"
                    element={<Main />}
                />
            </Routes>
          </div>

  );
}

export default App;
