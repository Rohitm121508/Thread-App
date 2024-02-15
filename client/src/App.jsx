import { Button, Container } from "@chakra-ui/react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import User from './pages/User'
import Post from "./pages/Post";
import Header from "./components/Header";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import LogoutButton from "./components/LogoutButton";
import UpdateProfile from "./pages/UpdateProfile";
import CreatePost from "./components/CreatePost";

function App() {
 const user = useRecoilValue(userAtom)

  return (
    <Container maxWidth={`620px`}>
      <Header/>
    <Routes>
      <Route path="/" element={user ? <Home/>: <Navigate to='/auth'/>}/>
      <Route path="/auth" element={!user ? <Auth/>:<Navigate to={`/`}/>}/>
      <Route path="/update" element={user ? <UpdateProfile/>:<Navigate to={`/auth`}/>}/>
      <Route
						path='/:username'
						element={
							user ? (
								<>
									<User />
									<CreatePost />
								</>
							) : (
								<User/>
							)
						}
					/>
      <Route path="/:username/post/:pid" element={<Post/>}/>
    </Routes>
    {user && <LogoutButton/>}
   
    </Container>
  )
}

export default App
