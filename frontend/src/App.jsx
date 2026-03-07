import {Routes,Route} from 'react-router-dom'
import LobbyScreen from './screens/Lobby'
import './App.css'
import RoomPage from './screens/Room'
import Chat from './screens/Chat'
function App()
{
  return(
    <Routes>
      <Route path='/' element={<LobbyScreen/>}/>
      <Route path='/room/:roomId' element={<RoomPage/>}/>
      <Route path='/chat/:roomId' element={<Chat/>}/>
    </Routes>
  )
}
export default App