
import { useState } from 'react'
import { openai } from '../lib/openai'
import { generateText } from 'ai'

type Message = {
  role: 'user' | 'assistant'
  content: string
  isJournal?: boolean
}

export default function JournalChat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [journalEntries, setJournalEntries] = useState<Message[]>([])
   const [shoppingList, setShoppingList] = useState<string[]>([])


  const handleSubmit = async () => {
    if (!input.trim()) return

     const classification = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `Does the message sound like personal journal entry?Reply with "yes" or "no".\n\nMessage: "${input}"`
    })
   const isJournalEntry = classification.text.trim().toLowerCase() === 'yes'

   
    const newMessages: Message[] = [...messages, { role: 'user', content: input, isJournal: isJournalEntry }]
    setMessages(newMessages)
    setInput('')

  
    if (isJournalEntry) {
      setJournalEntries(prev => [...prev, { role: 'user', content: input, isJournal: true }])
    }

    

    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      messages: newMessages
    })

    const reply = result.text
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    const shoppingCheck = await generateText({
  model: openai('gpt-3.5-turbo'),
  prompt: `Does this message contain a shopping item or list entry? Reply with "yes" or "no".\n\nMessage: "${input}"`,
})

const isShoppingItem = shoppingCheck.text.trim().toLowerCase() === 'yes'
if (isShoppingItem) {
  const itemExtraction = await generateText({
    model: openai('gpt-3.5-turbo'),
    prompt: `Extract the shopping item from this message:\n\n"${input}"\n\nReply with just the item.`,
  })

  const item = itemExtraction.text.trim()
  setShoppingList(prev => [...prev, item])
}
const isShoppingQuery =
  input.toLowerCase().includes('shopping list') ||
  input.toLowerCase().includes('what should i buy')
  if (isShoppingQuery) {
  const reply = shoppingList.length
    ? `Here's your  list:\n- ${shoppingList.join('\n- ')}`
    : `Your shopping list is empty.`
  setMessages(prev => [...prev, { role: 'assistant', content: reply }])
  return
}
if (isShoppingQuery) {
  const reply = shoppingList.length
    ? `Here's your shopping list:\n- ${shoppingList.join('\n- ')}`
    : `Your shopping list is empty.`
  setMessages(prev => [...prev, { role: 'assistant', content: reply }])
  return
}
const offTopicCheck = await generateText({
  model: openai('gpt-3.5-turbo'),
  prompt: `Does this message ask something outside journaling or shopping? Reply with "yes" or "no".\n\nMessage: "${input}"`,
})

const isOffTopic = offTopicCheck.text.trim().toLowerCase() === 'yes'

if (isOffTopic) {
  setMessages(prev => [
    ...prev,
    { role: 'assistant', content: "I'm only a journaling assistant. these topics are out of scope for me." }
  ])
  return
}


  }
  const handleSummarise=async()=>{
    if (journalEntries.length === 0) {
    alert('Nothing to summarise.')
    return
  }
  const combinedEntries = journalEntries.map(entry => entry.content).join(' ')



  const summary = await generateText({
    model: openai('gpt-3.5-turbo'),
    prompt: `Summarize the following journal entries:

${combinedEntries}`,
  })

  setMessages(prev => [...prev, { role: 'assistant', content: summary.text }])

  }

  return (
    <main style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>Journal Assistant</h2>
      <div style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="What are the todos for you today?..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={handleSubmit} style={{ padding: '0.5rem 1rem' }}>
          Send
        </button>
         <button onClick={handleSubmit} style={{ padding: '0.5rem 1rem' }}>
          Summarise
        </button>
      </div>
    </main>
  )
}