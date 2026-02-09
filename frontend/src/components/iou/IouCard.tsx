import { useState } from 'react'
import { getPartyEmail, type Iou } from '../../api/types'

interface IouCardProps {
  iou: Iou
  currentUser: string
  onPay: (id: string, amount: number) => void
  onConfirmPayment: (id: string) => void
  onCancel: (id: string) => void
}

export function IouCard({ iou, currentUser, onPay, onConfirmPayment, onCancel }: IouCardProps) {
  const [payAmount, setPayAmount] = useState('')
  
  const borrowerEmail = getPartyEmail(iou['@parties'].borrower)
  const lenderEmail = getPartyEmail(iou['@parties'].lender)
  const remainingDebt = iou.remainingDebt
  const state = iou['@state']
  const paymentClaim = iou.paymentClaim

  const isBorrower = borrowerEmail === currentUser
  const isLender = lenderEmail === currentUser
  const isDue = state === 'due'
  const isAwaitingConfirmation = state === 'awaitingPaymentConfirmation'
  const isSettled = state === 'settled'
  const isCancelled = state === 'cancelled'
  const isActive = isDue || isAwaitingConfirmation

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(payAmount)
    if (amount > 0) {
      onPay(iou['@id'], amount)
      setPayAmount('')
    }
  }

  return (
    <div className={`iou-card ${isSettled ? 'settled' : ''} ${isCancelled ? 'cancelled' : ''} ${isAwaitingConfirmation ? 'awaiting-confirmation' : ''}`}>
      <div className="iou-header">
        <span className={`state-badge ${state}`}>
          {state === 'awaitingPaymentConfirmation' ? 'Awaiting Payment Confirmation' : state}
        </span>
        <span className="iou-id">{iou['@id'].slice(0, 8)}...</span>
      </div>
      
      <div className="iou-amount">
        <div className="amount-item">
          <span className="amount-label">Remaining Debt</span>
          <div className="amount-value">
            <span className="currency">$</span>
            <span className="value">{remainingDebt.toLocaleString()}</span>
          </div>
        </div>
        <div className="amount-item">
          {paymentClaim && (
            <>
              <span className="amount-label">Staged Payment</span>
              <div className="amount-value">
                <span className="currency">$</span>
                <span className="value">{paymentClaim.amount.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="iou-parties">
        <div className="party">
          <span className="party-label">Owed By (Borrower)</span>
          <span className="party-value">{borrowerEmail}</span>
        </div>
        <div className="party">
          <span className="party-label">To (Lender)</span>
          <span className="party-value">{lenderEmail}</span>
        </div>
      </div>

      {isActive && ((isBorrower && isDue) || isLender) && (
        <div className="iou-actions">
          {isBorrower && isDue && (
            <form onSubmit={handlePaySubmit} className="pay-form">
              <input
                type="number"
                placeholder="Amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
              <button type="submit" className="btn btn-primary">Submit Payment</button>
            </form>
          )}
          {isLender && (
            <button 
              className="btn btn-secondary"
              onClick={() => onCancel(iou['@id'])}
            >
              Cancel Debt
            </button>
          )}
          {isLender && isAwaitingConfirmation && (
            <button 
              className="btn btn-primary confirm-payment-btn"
              onClick={() => onConfirmPayment(iou['@id'])}
            >
              Confirm Paid
            </button>
          )}
        </div>
      )}
    </div>
  )
}
