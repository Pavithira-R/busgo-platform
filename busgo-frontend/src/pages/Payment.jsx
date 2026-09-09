import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
export default function Payment() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  useEffect(() => { navigate(`/ticket/${ticketId}`) }, [ticketId, navigate])
  return null
}
