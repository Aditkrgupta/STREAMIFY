import { useEffect,useRef,useState } from 'react'
import { useSocket } from '../context/SocketProvider';
import { useParams } from 'react-router-dom';

function Chat() {
  const socket = useSocket()
  const timer=useRef(null)
  const [userName, setUserName] = useState('');
  const [showNamePopup, setShowNamePopup] = useState(true);
  const [inputName, setInputName] = useState('');
  const [messages, setMessages] = useState([]);
  const [typers,setTypers]=useState([])
  const [text, setText] = useState('')
  const {roomId}=useParams()
  
  useEffect(() => {
      socket.on('roomNotice', (userName) => {
        console.log(`${userName} joined to Group!`)
      })
      socket.on('chatMessage', (msg) => {
        console.log("msg")
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

      return ()=>{
        socket.off('roomNotice')
        socket.off('chatMessage')
        socket.off('typing')
        socket.off('stopTyping')
      }
  }, [socket]);

  useEffect(() => {
    if (text) {
      socket.emit('typing',userName)
      clearTimeout(timer.current)
    }
    timer.current=setTimeout(()=>{
      socket.emit('stopTyping',userName)
    },1000);

    return()=>{
      clearTimeout(timer.current);
    }
  }, [text, userName])

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
    socket.emit('joinRoom', trimmed);
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
    socket.emit('chatMessage', msg);
    setText('')
  }

  function handleKeyDone(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">

      {/* Name Popup - Styled */}
      {showNamePopup && (
        <div className='fixed inset-0 flex items-center justify-center z-40 bg-black/30 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all'>
            <h1 className='text-2xl font-bold text-slate-800 mb-2'>
              Enter Your Name
            </h1>
            <p className='text-sm text-slate-600 mb-6'>
              Enter your name to start chatting. This will be used to identify you.
            </p>
            <form onSubmit={handleNameSubmit}>
              <input
                autoFocus
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className='w-full border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all placeholder-slate-400'
                placeholder="e.g. John Doe"
              />
              <button
                type="submit"
                className='w-full mt-4 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-all shadow-md'>
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Chat - Styled */}
      {!showNamePopup && (
        <div className='w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden'>

          {/* Header - Styled */}
          <div className='bg-emerald-600 px-6 py-4 flex items-center gap-3'>
            <div className='h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xl'>
              {roomId?.charAt(0).toUpperCase() || 'R'}
            </div>

            <div className='flex-1'>
              <div className='text-white font-medium'>
                Realtime Group Chat
              </div>
              {typers.length > 0 && (
                <div className='text-white/80 text-sm'>
                  {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
            </div>

            <div className='bg-white/20 px-4 py-2 rounded-full'>
              <span className='text-white text-sm'>
                Signed in as{' '}
                <span className='font-semibold capitalize'>{userName}</span>
              </span>
            </div>
          </div>

          {/* Messages Area - Styled */}
          <div className='flex-1 overflow-y-auto p-6 bg-slate-50'>
            {messages.map((m) => {
              const mine = m.sender === userName;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl ${
                      mine
                        ? 'bg-emerald-500 text-white rounded-br-none'
                        : 'bg-white text-slate-800 rounded-bl-none shadow-md'
                    }`}
                  >
                    <div className='break-words whitespace-pre-wrap text-[15px]'>
                      {m.text}
                    </div>

                    <div className={`flex justify-between items-center mt-2 text-xs ${
                      mine ? 'text-emerald-100' : 'text-slate-500'
                    }`}>
                      <span className='font-medium'>{m.sender}</span>
                      <span>{formatTime(m.ts)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Input Area - Styled */}
          <div className='bg-white border-t border-slate-200 px-6 py-4'>
            <div className='flex items-center gap-3 bg-slate-100 rounded-full p-1'>
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDone}
                placeholder='Type a message...'
                className='flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none text-slate-800 placeholder-slate-400'
              />
              <button
                onClick={sendMessage}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  text.trim()
                    ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-500'
                }`}
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