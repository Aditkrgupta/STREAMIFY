import { useEffect,useRef,useState } from 'react'
import { useSocket } from '../context/SocketProvider';
import { useParams } from 'react-router-dom';

function Chat() {
  const socket = useSocket()
  const timer=useRef(null)
  const {roomId}=useParams()
  const [userName, setUserName] = useState('');
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState('');
  const [messages, setMessages] = useState([]);
  const [typers,setTypers]=useState([])
  const [text, setText] = useState('')


  useEffect(()=>{
  if(userName){
    socket.emit("room:join",{email:userName,room:roomId})
  }
},[userName,roomId,socket])

 useEffect(() => {
  socket.emit("room:join",{email:userName,room:roomId})   // ADD THIS LINE

  socket.on('connect',()=>{

      socket.on('roomNotice', (userName) => {
        console.log(`${userName} joined to Group!`)
      })

      socket.on('chatMessage', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on('typing',(userName)=>{
        setTypers((prev)=>{
          const isExist=prev.find((typer)=>typer===userName)
          if(!isExist){
            return [...prev,userName]
          }
          return prev;
        })
      })

      socket.on('stopTyping',(userName)=>{
        setTypers((prev)=> prev.filter((typer)=>typer!==userName))
      })
  })

return ()=>{
  socket.off('roomNotice')
  socket.off('chatMessage')
  socket.off('typing')
  socket.off('stopTyping')
}

}, []);

  useEffect(() => {
    if (text) {
      socket.emit('typing', {userName,roomId})
      clearTimeout(timer.current)
    }

    timer.current=setTimeout(()=>{
      socket.emit('stopTyping',{userName,roomId})
    },1000);

    return()=>{
      clearTimeout(timer.current);
    }

  }, [text, userName,roomId])

  function formatTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`;
  }

  function handleNameSubmit(e) {
    e.preventDefault();
    const trimmed = inputName.trim()
    if (!trimmed) return;
    setUserName(trimmed);
    setShowNamePopup(false);
  }

  function sendMessage() {
    const t = text.trim();
    if (!t) return;

    const msg = {
      id: Date.now(),
      sender: userName,
      text: t,
      ts: Date.now()
    };

    setMessages((m) => [...m, msg]);
    socket.emit('chatMessage', {msg,roomId});
    setText('')
  }

  function handleKeyDone(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-page">

      {showNamePopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h1 className="popup-title">Enter Your Name</h1>

            <p className="popup-text">
              Enter Your name to start chatting this will be used to identify
            </p>

            <form onSubmit={handleNameSubmit}>
              <input
                autoFocus
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="name-input"
                placeholder="Your name (e.g. John Doe)"
              />

              <button type="submit" className="continue-btn">
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {!showNamePopup && (
        <div className="chat-container">

          <div className="chat-header">

            <div className="avatar">R</div>

            <div className="header-info">
              <div className="chat-title">Realtime Group Chat</div>

              {typers.length ? (
                <div className="typing-text">
                  {typers.join(', ')} is typing...
                </div>
              ) : ""}
            </div>

            <div className="signed-user">
              Signed in as <span>{userName}</span>
            </div>

          </div>

          <div className="chat-messages">
            {messages.map((m) => {
              const mine = m.sender === userName;

              return (
                <div
                  key={m.id}
                  className={`message-row ${mine ? 'my-message' : 'other-message'}`}
                >

                  <div className="message-bubble">

                    <div className="message-text">
                      {m.text}
                    </div>

                    <div className="message-meta">
                      <div className="sender">{m.sender}</div>
                      <div className="time">{formatTime(m.ts)}</div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>

          <div className="chat-input-area">

            <div className="input-box">

              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDone}
                placeholder="Type a Message..."
                className="message-input"
              />

              <button
                onClick={sendMessage}
                className="send-btn"
              >
                Send
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Chat